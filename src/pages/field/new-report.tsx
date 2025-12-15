import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Building2, Plus, AlertTriangle, Navigation, Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { MainItem, SubItem } from "@/types";
import type { Database } from "@/integrations/supabase/types";
import { itemService } from "@/services/itemService";
import { mosqueService } from "@/services/mosqueService";
import { reportService } from "@/services/reportService";
import { issueService } from "@/services/issueService";
import { supabase } from "@/integrations/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from "next/image";

type MosqueInsert = Database["public"]["Tables"]["mosques"]["Insert"];

type IssueCase = "case1" | "case2";

interface IssueFormData {
  caseType: IssueCase;
  main_item_id: string;
  notes: string;
  case1Data: {
    sub_item_id: string;
    quantity: number;
    unit_price: number;
    photos: string[];
  };

  case2Data: {
    items: {
      sub_item_id: string;
      quantity: number;
      unit_price: number;
      photo: string;
    }[];
  };
}

export default function NewReport() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [mainItems, setMainItems] = useState<MainItem[]>([]);
  const [subItems, setSubItems] = useState<SubItem[]>([]);
  const [isAddIssueDialogOpen, setIsAddIssueDialogOpen] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const isGeneratingReportRef = useRef(false);
  
  const [mosqueForm, setMosqueForm] = useState<MosqueInsert>({
    name: "",
    supervisor_name: "",
    supervisor_phone: "",
    district: "",
    city: "",
    location_link: "",
    main_photo_url: "",
    latitude: 0,
    longitude: 0
  });

  const [currentIssue, setCurrentIssue] = useState<IssueFormData>({
    caseType: "case1",
    main_item_id: "",
    notes: "",
    case1Data: {
      sub_item_id: "",
      quantity: 1,
      unit_price: 0,
      photos: []
    },
    case2Data: {
      items: [
        { sub_item_id: "", quantity: 1, unit_price: 0, photo: "" },
        { sub_item_id: "", quantity: 1, unit_price: 0, photo: "" },
        { sub_item_id: "", quantity: 1, unit_price: 0, photo: "" }
      ]
    }
  });

  const [issues, setIssues] = useState<IssueFormData[]>([]);
  const [editingIssueIndex, setEditingIssueIndex] = useState<number | null>(null);

  const handleGenerateReportOnce = async () => {
    if (isGeneratingReportRef.current) return;

    isGeneratingReportRef.current = true;
    setIsGeneratingReport(true);

    try {
      await handleGenerateReport();
    } finally {
      // keep isGeneratingReportRef true so repeated clicks in the same visit do nothing
      setIsGeneratingReport(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    } else if (user) {
      loadItems();
    }
  }, [user, isLoading, router]);

  const loadItems = async () => {
    try {
      const main = await itemService.getAllMainItems();
      const allSubItems = main.flatMap(m => m.sub_items || []);
      setMainItems(main);
      setSubItems(allSubItems);
    } catch (error) {
      console.error("Failed to load items", error);
    }
  };

  const validatePhoneNumber = (phone: string) => {
    const saudiPhoneRegex = /^(\+966|966|0)5[0-9]{8}$/;
    return saudiPhoneRegex.test(phone.replace(/\s/g, ""));
  };

  const handleAutoFillLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
          setMosqueForm(prev => ({ 
            ...prev, 
            latitude, 
            longitude, 
            location_link: googleMapsLink 
          }));
          alert("تم تعبئة الموقع بنجاح!");
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("تعذر الحصول على الموقع. الرجاء التأكد من تفعيل خدمات الموقع.");
          setIsLoadingLocation(false);
        }
      );
    } else {
      alert("المتصفح لا يدعم خدمات الموقع");
      setIsLoadingLocation(false);
    }
  };

  const compressImage = async (
    file: File,
    maxDimension = 1400,
    targetSizeKb = 900
  ): Promise<File> => {
    // Avoid running in SSR or environments without Image/canvas
    if (typeof window === "undefined" || typeof window.Image === "undefined") {
      return file;
    }

    const targetBytes = targetSizeKb * 1024;
    if (file.size <= targetBytes) return file;

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const imgEl = new window.Image();
      imgEl.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(imgEl);
      };
      imgEl.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      };
      imgEl.src = objectUrl;
    });

    let { width, height } = img;
    if (width > height && width > maxDimension) {
      height = (height * maxDimension) / width;
      width = maxDimension;
    } else if (height >= width && height > maxDimension) {
      width = (width * maxDimension) / height;
      height = maxDimension;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");
    ctx.drawImage(img, 0, 0, width, height);

    const toBlob = (quality: number) =>
      new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Image compression failed"));
            resolve(blob);
          },
          "image/jpeg",
          quality
        );
      });

    let quality = 0.72;
    let blob = await toBlob(quality);
    while (blob.size > targetBytes && quality > 0.58) {
      quality -= 0.08;
      blob = await toBlob(quality);
    }

    return new File([blob], `${Date.now()}.jpg`, { type: "image/jpeg" });
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    if (!user) throw new Error("User not authenticated");

    let fileToUpload: File = file;
    try {
      const compressionTimeoutMs = 3500;
      const compressed = await Promise.race<File | null>([
        compressImage(file),
        new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), compressionTimeoutMs)
        ),
      ]);
      if (compressed && compressed.size > 0) {
        fileToUpload = compressed;
      }
    } catch (error) {
      console.warn("Image compression failed, uploading original", error);
    }

    const typeExt =
      fileToUpload.type.split("/")[1] ||
      fileToUpload.name.split(".").pop() ||
      "jpg";
    const safeExt = typeExt.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
    const fileName = `${user.id}/${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}.${safeExt}`;

    const { data, error } = await supabase.storage
      .from('mosque-photos')
      .upload(fileName, fileToUpload);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('mosque-photos')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleMosquePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    const previewUrl = URL.createObjectURL(file);
    setMosqueForm((prev) => ({ ...prev, main_photo_url: previewUrl }));
    setPendingUploads((count) => count + 1);

    try {
      const photoUrl = await uploadPhoto(file);
      setMosqueForm((prev) => {
        if (prev.main_photo_url !== previewUrl) return prev;
        return { ...prev, main_photo_url: photoUrl };
      });
    } catch (error) {
      console.error("Upload error:", error);
      alert("فشل رفع الصورة");
      setMosqueForm((prev) => {
        if (prev.main_photo_url !== previewUrl) return prev;
        return { ...prev, main_photo_url: "" };
      });
    } finally {
      setPendingUploads((count) => Math.max(0, count - 1));
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleCase1PhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const previewUrl = URL.createObjectURL(file);
    setCurrentIssue((prev) => {
      const newPhotos = [...prev.case1Data.photos];
      newPhotos[index] = previewUrl;
      return { ...prev, case1Data: { ...prev.case1Data, photos: newPhotos } };
    });
    setPendingUploads((count) => count + 1);

    try {
      const photoUrl = await uploadPhoto(file);
      setCurrentIssue((prev) => {
        if (prev.case1Data.photos[index] !== previewUrl) return prev;
        const newPhotos = [...prev.case1Data.photos];
        newPhotos[index] = photoUrl;
        return { ...prev, case1Data: { ...prev.case1Data, photos: newPhotos } };
      });
    } catch (error) {
      console.error("Upload error:", error);
      alert("فشل رفع الصورة");
      setCurrentIssue((prev) => {
        if (prev.case1Data.photos[index] !== previewUrl) return prev;
        const newPhotos = [...prev.case1Data.photos];
        newPhotos[index] = "";
        return { ...prev, case1Data: { ...prev.case1Data, photos: newPhotos } };
      });
    } finally {
      setPendingUploads((count) => Math.max(0, count - 1));
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleCase2PhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const previewUrl = URL.createObjectURL(file);
    setCurrentIssue((prev) => {
      const newItems = [...prev.case2Data.items];
      newItems[itemIndex] = { ...newItems[itemIndex], photo: previewUrl };
      return { ...prev, case2Data: { items: newItems } };
    });
    setPendingUploads((count) => count + 1);

    try {
      const photoUrl = await uploadPhoto(file);
      setCurrentIssue((prev) => {
        if (prev.case2Data.items[itemIndex]?.photo !== previewUrl) return prev;
        const newItems = [...prev.case2Data.items];
        newItems[itemIndex] = { ...newItems[itemIndex], photo: photoUrl };
        return { ...prev, case2Data: { items: newItems } };
      });
    } catch (error) {
      console.error("Upload error:", error);
      alert("فشل رفع الصورة");
      setCurrentIssue((prev) => {
        if (prev.case2Data.items[itemIndex]?.photo !== previewUrl) return prev;
        const newItems = [...prev.case2Data.items];
        newItems[itemIndex] = { ...newItems[itemIndex], photo: "" };
        return { ...prev, case2Data: { items: newItems } };
      });
    } finally {
      setPendingUploads((count) => Math.max(0, count - 1));
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleMosqueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhoneNumber(mosqueForm.supervisor_phone)) {
      alert("الرجاء إدخال رقم جوال سعودي صحيح");
      return;
    }
    if (!mosqueForm.main_photo_url) {
      alert("الرجاء رفع صورة المسجد الرئيسية");
      return;
    }
    setStep(2);
  };

  const handleAddIssue = () => {
    setCurrentIssue({
      caseType: "case1",
      main_item_id: "",
      notes: "",
      case1Data: {
        sub_item_id: "",
        quantity: 1,
        unit_price: 0,
        photos: []
      },
      case2Data: {
        items: [
          { sub_item_id: "", quantity: 1, unit_price: 0, photo: "" },
          { sub_item_id: "", quantity: 1, unit_price: 0, photo: "" },
          { sub_item_id: "", quantity: 1, unit_price: 0, photo: "" }
        ]
      }
    });
    setEditingIssueIndex(null);
    setIsAddIssueDialogOpen(true);
  };

  const validateIssue = (): boolean => {
    if (!currentIssue.main_item_id) {
      alert("الرجاء اختيار البند الرئيسي");
      return false;
    }

    if (currentIssue.caseType === "case1") {
      if (!currentIssue.case1Data.sub_item_id) {
        alert("الرجاء اختيار البند الفرعي");
        return false;
      }
      if (currentIssue.case1Data.photos.filter(p => p).length !== 3) {
        alert("الرجاء رفع 3 صور بالضبط للحالة الأولى");
        return false;
      }
      if (currentIssue.case1Data.quantity <= 0) {
        alert("الرجاء إدخال كمية صحيحة");
        return false;
      }
      if (currentIssue.case1Data.unit_price <= 0) {
        alert("الرجاء إدخال سعر صحيح");
        return false;
      }
    } else {
      const validItems = currentIssue.case2Data.items.filter(
        item => item.sub_item_id && item.photo && item.quantity > 0 && item.unit_price > 0
      );
      if (validItems.length !== 3) {
        alert("الرجاء إكمال بيانات البنود الفرعية الثلاثة (بند + كمية + صورة واحدة لكل بند)");
        return false;
      }
    }

    return true;
  };

  const handleSaveIssue = () => {
    if (pendingUploads > 0) {
      alert("يرجى انتظار اكتمال رفع الصور قبل الحفظ");
      return;
    }
    if (!validateIssue()) return;
    if (editingIssueIndex !== null) {
      const updated = [...issues];
      updated[editingIssueIndex] = currentIssue;
      setIssues(updated);
    } else {
      setIssues([...issues, currentIssue]);
    }
    setEditingIssueIndex(null);
    setIsAddIssueDialogOpen(false);
  };

  const handleGenerateReport = async () => {
    if (!user) {
      alert("يجب تسجيل الدخول أولاً");
      return;
    }
    
    if (pendingUploads > 0) {
      alert("انتظر اكتمال رفع الصور قبل إنشاء التقرير");
      return;
    }
    
    if (issues.length === 0) {
      alert("الرجاء إضافة مشكلة واحدة على الأقل");
      return;
    }

    try {
      const savedMosque = await mosqueService.createMosque(mosqueForm);

      // أنشئ صورة الخريطة مباشرة بعد إنشاء المسجد (قبل التقرير)
      let mapPhotoUrl: string | null = null;
      if (mosqueForm.latitude && mosqueForm.longitude) {
        try {
          const resp = await fetch("/api/map-photo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: mosqueForm.latitude,
              lng: mosqueForm.longitude,
              targetId: savedMosque.id,
              targetType: "mosque",
              userId: user.id,
            }),
          });
          const mapJson = await resp.json();
          if (resp.ok && mapJson.url) {
            mapPhotoUrl = mapJson.url as string;
          } else {
            console.warn("map-photo API failed", mapJson?.error);
          }
        } catch (err) {
          console.warn("map-photo fetch error", err);
        }
      }

      const reportData = {
        mosque_id: savedMosque.id,
        technician_id: user.id,
        report_date: new Date().toISOString(),
        status: "draft" as const,
        map_photo_url: mapPhotoUrl,
      };
      const savedReport = await reportService.createReport(reportData);

      for (const issue of issues) {
        const issueData = {
          report_id: savedReport.id,
          main_item_id: issue.main_item_id,
          notes: issue.notes || "",
          issue_type: issue.caseType === "case1" ? "single" : "multiple"
        };
        const savedIssue = await issueService.createIssue(issueData);

        if (savedIssue) {
          if (issue.caseType === "case1") {
            await supabase.from("issue_items").insert([{
              issue_id: savedIssue.id,
              sub_item_id: issue.case1Data.sub_item_id,
              quantity: issue.case1Data.quantity,
              unit_price: issue.case1Data.unit_price || getSubItemPrice(issue.case1Data.sub_item_id)
            }]);

            await supabase.from("issue_photos").insert(
              issue.case1Data.photos.map((photoUrl) => ({
                issue_id: savedIssue.id,
                photo_url: photoUrl
              }))
            );
          } else {
            await supabase.from("issue_items").insert(
              issue.case2Data.items.map((item) => ({
                issue_id: savedIssue.id,
                sub_item_id: item.sub_item_id,
                quantity: item.quantity,
                unit_price: item.unit_price || getSubItemPrice(item.sub_item_id)
              }))
            );

            await supabase.from("issue_photos").insert(
              issue.case2Data.items.map((item) => ({
                issue_id: savedIssue.id,
                photo_url: item.photo
              }))
            );
          }
        }
      }

      alert("تم إنشاء التقرير بنجاح!");
      router.push("/dashboard");

    } catch (error) {
      console.error("Failed to generate report:", error);
      alert("حدث خطأ أثناء إنشاء التقرير");
    }
  };

  const getMainItemName = (id: string) => mainItems.find(m => m.id === id)?.name_ar || "غير محدد";
  const getSubItemName = (id: string) => subItems.find(s => s.id === id)?.name_ar || "غير محدد";
  const getSubItemPrice = (id: string) => subItems.find(s => s.id === id)?.unit_price || 0;

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yaamur-secondary via-white to-yaamur-secondary/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yaamur-primary mx-auto mb-4"></div>
          <p className="text-yaamur-text-light">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const availableSubItems = subItems.filter(s => s.main_item_id === currentIssue.main_item_id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yaamur-secondary via-white to-yaamur-secondary/50 p-4 md:p-8 overflow-x-hidden" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-yaamur-text">إنشاء تقرير جديد</h1>
            <p className="text-yaamur-text-light mt-2">ملء معلومات المسجد والمشاكل الميدانية</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-xl">إلغاء</Button>
          </Link>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 1 ? "yaamur-gradient text-white" : "bg-gray-200 text-gray-600"
            }`}>
              1
            </div>
            <div className={`w-24 h-1 ${step >= 2 ? "yaamur-gradient" : "bg-gray-200"}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 2 ? "yaamur-gradient text-white" : "bg-gray-200 text-gray-600"
            }`}>
              2
            </div>
          </div>
        </div>

        {pendingUploads > 0 && (
          <div className="text-sm text-yaamur-primary bg-yaamur-secondary/40 border border-yaamur-secondary/60 rounded-lg px-3 py-2">
            جاري رفع الصور... ({pendingUploads})
          </div>
        )}

        {step === 1 && (
          <Card className="yaamur-card border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Building2 className="w-6 h-6 text-yaamur-primary" />
                معلومات المسجد
              </CardTitle>
              <CardDescription>أدخل التفاصيل الأساسية للمسجد</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMosqueSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">اسم المسجد *</Label>
                  <Input 
                    placeholder="أدخل اسم المسجد" 
                    value={mosqueForm.name} 
                    onChange={(e) => setMosqueForm({ ...mosqueForm, name: e.target.value })} 
                    required 
                    className="h-12 text-base rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">اسم المشرف *</Label>
                    <Input 
                      placeholder="اسم مشرف المسجد" 
                      value={mosqueForm.supervisor_name} 
                      onChange={(e) => setMosqueForm({ ...mosqueForm, supervisor_name: e.target.value })} 
                      required 
                      className="h-12 text-base rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">رقم جوال المشرف *</Label>
                    <Input 
                      placeholder="05xxxxxxxx" 
                      value={mosqueForm.supervisor_phone} 
                      onChange={(e) => setMosqueForm({ ...mosqueForm, supervisor_phone: e.target.value })} 
                      required 
                      className="h-12 text-base rounded-xl"
                    />
                    {mosqueForm.supervisor_phone && !validatePhoneNumber(mosqueForm.supervisor_phone) && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        الرجاء إدخال رقم جوال سعودي صحيح
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">الحي *</Label>
                    <Input 
                      placeholder="اسم الحي" 
                      value={mosqueForm.district} 
                      onChange={(e) => setMosqueForm({ ...mosqueForm, district: e.target.value })} 
                      required 
                      className="h-12 text-base rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">المدينة *</Label>
                    <Input 
                      placeholder="اسم المدينة" 
                      value={mosqueForm.city} 
                      onChange={(e) => setMosqueForm({ ...mosqueForm, city: e.target.value })} 
                      required 
                      className="h-12 text-base rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">رابط الموقع *</Label>
                  <div className="flex flex-col md:flex-row gap-2">
                    <Input 
                      placeholder="https://www.google.com/maps?q=..." 
                      value={mosqueForm.location_link} 
                      onChange={(e) => setMosqueForm({ ...mosqueForm, location_link: e.target.value })} 
                      required 
                      className="h-12 text-base rounded-xl flex-1"
                    />
                    <Button 
                      type="button" 
                      onClick={handleAutoFillLocation} 
                      disabled={isLoadingLocation}
                      className="h-12 px-6 rounded-xl whitespace-nowrap w-full md:w-auto"
                    >
                      <Navigation className="w-4 h-4 ml-2" />
                      {isLoadingLocation ? "جاري التحديد..." : "تحديد موقعي"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">صورة المسجد الرئيسية *</Label>
                  <div className="flex flex-col gap-4">
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={handleMosquePhotoUpload}
                      className="h-12 text-base rounded-xl"
                    />
                    {mosqueForm.main_photo_url && (
                      <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-yaamur-secondary">
                        <Image
                          src={mosqueForm.main_photo_url}
                          alt="Mosque main photo"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full yaamur-button-primary h-14 text-lg font-bold rounded-xl"
                  disabled={pendingUploads > 0}
                >
                  التالي: إضافة المشاكل
                  <ChevronRight className="w-5 h-5 mr-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Card className="yaamur-card border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">المشاكل الميدانية</CardTitle>
                <CardDescription>أضف المشاكل والأعطال التي تم رصدها</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {issues.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-16 h-16 text-yaamur-text-light mx-auto mb-4 opacity-50" />
                    <p className="text-yaamur-text-light text-lg">لم يتم إضافة أي مشاكل بعد</p>
                  </div>
                ) : (
                  issues.map((issue, index) => (
                    <Card key={index} className="border-2 border-yaamur-secondary-dark">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-yaamur-text">{getMainItemName(issue.main_item_id)}</h4>
                            <p className="text-sm text-yaamur-text-light">
                              {issue.caseType === "case1" 
                                ? `الحالة 1: ${getSubItemName(issue.case1Data.sub_item_id)} (${issue.case1Data.quantity} وحدة) - 3 صور`
                                : `الحالة 2: 3 بنود فرعية - صورة لكل بند`
                              }
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIssues(issues.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
                
                <Button 
                  onClick={handleAddIssue} 
                  className="w-full yaamur-button-primary h-12 text-base font-semibold rounded-xl"
                >
                  <Plus className="w-5 h-5 ml-2" />
                  إضافة مشكلة
                </Button>
              </CardContent>
            </Card>

            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)} 
                className="w-full md:flex-1 h-12 text-base font-semibold rounded-xl"
              >
                رجوع
              </Button>
              <Button 
                onClick={handleGenerateReportOnce} 
                disabled={issues.length === 0 || isGeneratingReport || pendingUploads > 0}
                className="w-full md:flex-1 yaamur-button-primary h-12 text-base font-semibold rounded-xl"
              >
                إنشاء التقرير
              </Button>
            </div>
          </div>
        )}

        <Dialog open={isAddIssueDialogOpen} onOpenChange={setIsAddIssueDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-2xl">إضافة مشكلة جديدة</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">البند الرئيسي *</Label>
                <Select 
                  value={currentIssue.main_item_id}
                  onValueChange={(value) => setCurrentIssue({...currentIssue, main_item_id: value})}
                >
                  <SelectTrigger className="h-12 text-base rounded-xl">
                    <SelectValue placeholder="اختر البند الرئيسي" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainItems.map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.name_ar}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">نوع الحالة *</Label>
                <RadioGroup 
                  value={currentIssue.caseType} 
                  onValueChange={(value) => setCurrentIssue({...currentIssue, caseType: value as IssueCase})}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2 space-x-reverse border-2 border-yaamur-secondary-dark rounded-xl p-4">
                    <RadioGroupItem value="case1" id="case1" />
                    <Label htmlFor="case1" className="flex-1 cursor-pointer">
                      <div className="font-bold">الحالة 1</div>
                      <div className="text-sm text-yaamur-text-light">بند فرعي واحد + كمية + 3 صور</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse border-2 border-yaamur-secondary-dark rounded-xl p-4">
                    <RadioGroupItem value="case2" id="case2" />
                    <Label htmlFor="case2" className="flex-1 cursor-pointer">
                      <div className="font-bold">الحالة 2</div>
                      <div className="text-sm text-yaamur-text-light">3 بنود فرعية + كمية لكل بند + صورة واحدة لكل بند</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {currentIssue.caseType === "case1" ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">البند الفرعي *</Label>
                    <Select 
                      value={currentIssue.case1Data.sub_item_id}
                      onValueChange={(value) => setCurrentIssue({
                        ...currentIssue, 
                        case1Data: {
                          ...currentIssue.case1Data,
                          sub_item_id: value,
                          unit_price: getSubItemPrice(value)
                        }
                      })}
                      disabled={!currentIssue.main_item_id}
                    >
                      <SelectTrigger className="h-12 text-base rounded-xl">
                        <SelectValue placeholder="اختر البند الفرعي" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubItems.map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name_ar} ({item.unit_ar} - {item.unit_price} ريال)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">الكمية *</Label>
                    <Input 
                      type="number" 
                      min="1"
                      value={currentIssue.case1Data.quantity}
                      onChange={(e) => setCurrentIssue({
                        ...currentIssue,
                        case1Data: {...currentIssue.case1Data, quantity: parseInt(e.target.value) || 1}
                      })}
                      className="h-12 text-base rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">سعر الوحدة (ريال) *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentIssue.case1Data.unit_price}
                      onChange={(e) => setCurrentIssue({
                        ...currentIssue,
                        case1Data: {
                          ...currentIssue.case1Data,
                          unit_price: parseFloat(e.target.value) || 0
                        }
                      })}
                      className="h-12 text-base rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">الصور (3 صور مطلوبة) *</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[0, 1, 2].map((index) => (
                        <div key={index} className="space-y-2">
                          <Input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleCase1PhotoUpload(e, index)}
                            className="text-sm rounded-xl"
                          />
                          {currentIssue.case1Data.photos[index] && (
                            <div className="relative w-full h-24 rounded-lg overflow-hidden border-2 border-yaamur-primary">
                              <Image
                                src={currentIssue.case1Data.photos[index]}
                                alt="Issue photo"
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 33vw"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <Label className="text-base font-semibold">البنود الفرعية الثلاثة *</Label>
                  {currentIssue.case2Data.items.map((item, itemIndex) => (
                    <Card key={itemIndex} className="border-2 border-yaamur-secondary-dark">
                      <CardContent className="p-4 space-y-3">
                        <h4 className="font-bold text-yaamur-primary">البند {itemIndex + 1}</h4>
                        
                        <Select 
                          value={item.sub_item_id}
                          onValueChange={(value) => {
                            const newItems = [...currentIssue.case2Data.items];
                            newItems[itemIndex].sub_item_id = value;
                            newItems[itemIndex].unit_price = getSubItemPrice(value);
                            setCurrentIssue({
                              ...currentIssue,
                              case2Data: {items: newItems}
                            });
                          }}
                          disabled={!currentIssue.main_item_id}
                        >
                          <SelectTrigger className="h-10 text-sm rounded-lg">
                            <SelectValue placeholder="اختر البند الفرعي" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSubItems.map(subItem => (
                              <SelectItem key={subItem.id} value={subItem.id}>
                                {subItem.name_ar} ({subItem.unit_ar} - {subItem.unit_price} ريال)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input 
                          type="number" 
                          min="1"
                          placeholder="الكمية"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...currentIssue.case2Data.items];
                            newItems[itemIndex].quantity = parseInt(e.target.value) || 1;
                            setCurrentIssue({
                              ...currentIssue,
                              case2Data: {items: newItems}
                            });
                          }}
                          className="h-10 text-sm rounded-lg"
                        />

                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="سعر الوحدة"
                          value={item.unit_price}
                          onChange={(e) => {
                            const newItems = [...currentIssue.case2Data.items];
                            newItems[itemIndex].unit_price = parseFloat(e.target.value) || 0;
                            setCurrentIssue({
                              ...currentIssue,
                              case2Data: {items: newItems}
                            });
                          }}
                          className="h-10 text-sm rounded-lg"
                        />

                        <div className="space-y-2">
                          <Input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleCase2PhotoUpload(e, itemIndex)}
                            className="text-sm rounded-lg"
                          />
                          {item.photo && (
                            <div className="relative w-full h-24 rounded-lg overflow-hidden border-2 border-yaamur-primary">
                              <Image
                                src={item.photo}
                                alt="Issue item photo"
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 33vw"
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-base font-semibold">ملاحظات (اختياري)</Label>
                <Input 
                  placeholder="أضف أي ملاحظات إضافية"
                  value={currentIssue.notes}
                  onChange={(e) => setCurrentIssue({...currentIssue, notes: e.target.value})}
                  className="h-12 text-base rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsAddIssueDialogOpen(false)}
                className="flex-1 h-12 text-base rounded-xl"
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleSaveIssue}
                disabled={pendingUploads > 0}
                className="flex-1 yaamur-button-primary h-12 text-base rounded-xl"
              >
                حفظ المشكلة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
