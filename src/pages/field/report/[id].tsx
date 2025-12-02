import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Save, Edit2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Report, MainItem, SubItem, Issue } from "@/types";
import { reportService } from "@/services/reportService";
import { mosqueService } from "@/services/mosqueService";
import { itemService } from "@/services/itemService";
import { issueService } from "@/services/issueService";
import { supabase } from "@/integrations/supabase/client";
import { ReportTemplate } from "@/components/pdf/ReportTemplate";
import { generatePdfFromHtml } from "@/lib/html2pdfGenerator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import type { Database } from "@/integrations/supabase/types";

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

type IssueInsert = Database["public"]["Tables"]["report_issues"]["Insert"];
type IssueUpdate = Database["public"]["Tables"]["report_issues"]["Update"];

export default function EditReport() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const reportTemplateRef = useRef<HTMLDivElement>(null);

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetchingMap, setIsFetchingMap] = useState(false);
  const mapFetchAttempted = useRef(false);
  const [mainItems, setMainItems] = useState<MainItem[]>([]);
  const [subItems, setSubItems] = useState<SubItem[]>([]);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [issueDialogMode, setIssueDialogMode] = useState<"create" | "edit">("create");
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
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [isSavingIssue, setIsSavingIssue] = useState(false);

  useEffect(() => {
    const autoFetchMap = async () => {
      if (mapFetchAttempted.current || isFetchingMap || !report || report.map_photo_url) return;
      const { mosques } = report;
      if (!mosques?.latitude || !mosques?.longitude) return;

      try {
        setIsFetchingMap(true);
        mapFetchAttempted.current = true;
        const resp = await fetch("/api/map-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: mosques.latitude,
            lng: mosques.longitude,
            reportId: report.id,
            userId: user?.id,
          }),
        });
        const mapJson = await resp.json();
        if (resp.ok && mapJson.url) {
          await reportService.updateReport(report.id, {
            map_photo_url: mapJson.url,
          });
          setReport((prev) => (prev ? { ...prev, map_photo_url: mapJson.url } : prev));
        } else {
          console.warn("map-photo API failed", mapJson?.error);
        }
      } catch (err) {
        console.warn("map-photo fetch error", err);
      } finally {
        setIsFetchingMap(false);
      }
    };

    autoFetchMap();
  }, [report, user, isFetchingMap]);
 	
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

  const loadReport = useCallback(async (reportId: string) => {
    setIsLoading(true);
    try {
      const data = await reportService.getReportById(reportId);
      setReport(data);
    } catch(error) {
      console.error("Failed to load report", error);
      toast({
        title: "خطأ في تحميل التقرير",
        description: "لم نتمكن من العثور على التقرير المطلوب.",
        variant: "destructive",
      });
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadItems = useCallback(async () => {
    try {
      const main = await itemService.getAllMainItems();
      const allSubItems = main.flatMap((m) => m.sub_items || []);
      setMainItems(main);
      setSubItems(allSubItems);
    } catch (error) {
      console.error("Failed to load items for issues", error);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/");
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (id && typeof id === "string") {
      loadReport(id);
    }
  }, [id, loadReport]);

  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user, loadItems]);

  const handleMosqueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!report) return;
    const { name, value } = e.target;
    setReport({
      ...report,
      mosques: {
        ...report.mosques,
        [name]: value,
      },
    });
  };

  const handleSaveChanges = async () => {
    if (!report || isSaving) return;
    setIsSaving(true);
    try {
      await mosqueService.updateMosque(report.mosques.id, report.mosques);
      await reportService.updateReport(report.id, { status: report.status });

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث بيانات التقرير والمسجد.",
      });
    } catch (error) {
      console.error("Failed to save changes", error);
      toast({
        title: "خطأ في الحفظ",
        description: "لم نتمكن من حفظ التغييرات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePrintPdf = async () => {
    if (!report || !reportTemplateRef.current || isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    try {
      const fileName = `${report.mosques.name || "تقرير"}_${new Date().toLocaleDateString("ar-SA")}.pdf`;
      await generatePdfFromHtml(reportTemplateRef.current, fileName);

      toast({
        title: "تم إنشاء التقرير بنجاح",
        description: "تم تنزيل ملف PDF بنجاح",
      });

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "خطأ في إنشاء التقرير",
        description: "حدث خطأ أثناء محاولة إنشاء ملف PDF. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
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

  const { data, error } = await supabase.storage.from("mosque-photos").upload(fileName, fileToUpload);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("mosque-photos").getPublicUrl(data.path);

    return publicUrl;
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
      alert("حدث خطأ أثناء رفع الصورة");
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
      alert("حدث خطأ أثناء رفع الصورة");
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

  const validateIssue = (): boolean => {
    if (!currentIssue.main_item_id) {
      alert("يرجى اختيار البند الرئيسي للمشكلة");
      return false;
    }

    if (currentIssue.caseType === "case1") {
      if (!currentIssue.case1Data.sub_item_id) {
        alert("يرجى اختيار البند الفرعي للمشكلة");
        return false;
      }
      if (currentIssue.case1Data.photos.filter((p) => p).length !== 3) {
        alert("يرجى رفع 3 صور للمشكلة");
        return false;
      }
      if (currentIssue.case1Data.quantity <= 0) {
        alert("يرجى إدخال كمية صحيحة");
        return false;
      }
      if (currentIssue.case1Data.unit_price <= 0) {
        alert("يرجى إدخال سعر صحيح");
        return false;
      }
    } else {
      const validItems = currentIssue.case2Data.items.filter(
        (item) => item.sub_item_id && item.photo && item.quantity > 0 && item.unit_price > 0,
      );
      if (validItems.length !== 3) {
        alert("يرجى استكمال بيانات البنود الثلاثة (البند، الكمية، وصورة لكل بند)");
        return false;
      }
    }

    return true;
  };

  const resetIssueForm = () => {
    setCurrentIssue({
      caseType: "case1",
      main_item_id: "",
      notes: "",
      case1Data: {
        sub_item_id: "",
        quantity: 1,
        unit_price: 0,
        photos: [],
      },
      case2Data: {
        items: [
          { sub_item_id: "", quantity: 1, unit_price: 0, photo: "" },
          { sub_item_id: "", quantity: 1, unit_price: 0, photo: "" },
          { sub_item_id: "", quantity: 1, unit_price: 0, photo: "" },
        ],
      },
    });
    setEditingIssueId(null);
  };

  const openAddIssueDialog = () => {
    resetIssueForm();
    setIssueDialogMode("create");
    setIsIssueDialogOpen(true);
  };

  const openEditIssueDialog = (issue: Issue) => {
    const caseType: IssueCase = issue.issue_type === "single" ? "case1" : "case2";

    const form: IssueFormData = {
      caseType,
      main_item_id: issue.main_item_id,
      notes: issue.notes || "",
      case1Data: {
        sub_item_id: "",
        quantity: 1,
        unit_price: 0,
        photos: [],
      },
      case2Data: {
        items: [
          { sub_item_id: "", quantity: 1, unit_price: 0, photo: "" },
          { sub_item_id: "", quantity: 1, unit_price: 0, photo: "" },
          { sub_item_id: "", quantity: 1, unit_price: 0, photo: "" },
        ],
      },
    };

    if (caseType === "case1") {
      const item = issue.issue_items[0];
      const photos = issue.issue_photos.map((p) => p.photo_url);
      form.case1Data = {
        sub_item_id: item?.sub_item_id || "",
        quantity: item?.quantity || 1,
        unit_price: item?.unit_price ?? item?.sub_items?.unit_price ?? 0,
        photos: [photos[0] || "", photos[1] || "", photos[2] || ""],
      };
    } else {
      const items = issue.issue_items;
      const photos = issue.issue_photos;
      form.case2Data = {
        items: [0, 1, 2].map((idx) => ({
          sub_item_id: items[idx]?.sub_item_id || "",
          quantity: items[idx]?.quantity || 1,
          unit_price: items[idx]?.unit_price ?? items[idx]?.sub_items?.unit_price ?? 0,
          photo: photos[idx]?.photo_url || "",
        })),
      };
    }

    setCurrentIssue(form);
    setEditingIssueId(issue.id);
    setIssueDialogMode("edit");
    setIsIssueDialogOpen(true);
  };

  const handleSaveIssue = async () => {
    if (isSavingIssue) return;
    if (!report || !id || typeof id !== "string") return;
    if (pendingUploads > 0) {
      alert("يرجى انتظار اكتمال رفع الصور قبل الحفظ");
      return;
    }
    if (!validateIssue()) return;

    try {
      setIsSavingIssue(true);
      if (issueDialogMode === "create") {
        const issueData: IssueInsert = {
          report_id: report.id,
          main_item_id: currentIssue.main_item_id,
          notes: currentIssue.notes || "",
          issue_type: currentIssue.caseType === "case1" ? "single" : "multiple",
        };

        const savedIssue = await issueService.createIssue(issueData);

        if (savedIssue) {
        if (currentIssue.caseType === "case1") {
          await supabase.from("issue_items").insert([
            {
              issue_id: savedIssue.id,
              sub_item_id: currentIssue.case1Data.sub_item_id,
              quantity: currentIssue.case1Data.quantity,
              unit_price:
                currentIssue.case1Data.unit_price ||
                getSubItemPrice(currentIssue.case1Data.sub_item_id),
            },
          ]);

            await supabase.from("issue_photos").insert(
              currentIssue.case1Data.photos.map((photoUrl) => ({
                issue_id: savedIssue.id,
                photo_url: photoUrl,
              })),
            );
          } else {
          await supabase.from("issue_items").insert(
            currentIssue.case2Data.items.map((item) => ({
              issue_id: savedIssue.id,
              sub_item_id: item.sub_item_id,
              quantity: item.quantity,
              unit_price: item.unit_price || getSubItemPrice(item.sub_item_id),
            })),
          );

            await supabase.from("issue_photos").insert(
              currentIssue.case2Data.items.map((item) => ({
                issue_id: savedIssue.id,
                photo_url: item.photo,
              })),
            );
          }
        }
      } else if (issueDialogMode === "edit" && editingIssueId) {
        const updateData: IssueUpdate = {
          main_item_id: currentIssue.main_item_id,
          notes: currentIssue.notes || "",
          issue_type: currentIssue.caseType === "case1" ? "single" : "multiple",
          report_id: report.id,
        };

        await issueService.updateIssue(editingIssueId, updateData);

        await supabase.from("issue_items").delete().eq("issue_id", editingIssueId);
        await supabase.from("issue_photos").delete().eq("issue_id", editingIssueId);

        if (currentIssue.caseType === "case1") {
          await supabase.from("issue_items").insert([
            {
              issue_id: editingIssueId,
              sub_item_id: currentIssue.case1Data.sub_item_id,
              quantity: currentIssue.case1Data.quantity,
              unit_price:
                currentIssue.case1Data.unit_price ||
                getSubItemPrice(currentIssue.case1Data.sub_item_id),
            },
          ]);

          await supabase.from("issue_photos").insert(
            currentIssue.case1Data.photos.map((photoUrl) => ({
              issue_id: editingIssueId,
              photo_url: photoUrl,
            })),
          );
        } else {
          await supabase.from("issue_items").insert(
            currentIssue.case2Data.items.map((item) => ({
              issue_id: editingIssueId,
              sub_item_id: item.sub_item_id,
              quantity: item.quantity,
              unit_price: item.unit_price || getSubItemPrice(item.sub_item_id),
            })),
          );

          await supabase.from("issue_photos").insert(
            currentIssue.case2Data.items.map((item) => ({
              issue_id: editingIssueId,
              photo_url: item.photo,
            })),
          );
        }
      }

      // Toggle saving state off before heavy reload to avoid a stuck button if the refresh is slow
      setIsSavingIssue(false);
      await loadReport(id);
      resetIssueForm();
      setIsIssueDialogOpen(false);
    } catch (error) {
      console.error("Failed to save issue", error);
      alert("حدث خطأ أثناء حفظ المشكلة");
    } finally {
      setIsSavingIssue(false);
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    if (!id || typeof id !== "string") return;
    const confirmDelete = window.confirm("هل أنت متأكد من حذف هذه المشكلة؟");
    if (!confirmDelete) return;

    try {
      console.log("Deleting issue", issueId);
      // Optimistic remove so UI reacts even لو تأخر الطلب
      setReport((prev) =>
        prev
          ? {
              ...prev,
              report_issues: (prev.report_issues || []).filter(
                (issue) => issue.id !== issueId
              ),
            }
          : prev
      );

      // Deleting the parent issue cascades to items/photos in DB
      await issueService.deleteIssue(issueId);
      await loadReport(id);
      toast({
        title: "تم حذف المشكلة",
        description: "تم حذف البند والصور المرتبطة به.",
      });
    } catch (error) {
      console.error("Failed to delete issue", error);
      alert("حدث خطأ أثناء حذف المشكلة");
      // استرجع البيانات في حال فشل الحذف بعد الإزالة المتفائلة
      await loadReport(id);
    }
  };

  const handleDeleteReport = async () => {
    if (!id || typeof id !== "string") return;
    const confirmDelete = window.confirm("سيتم حذف التقرير بجميع بنوده وصوره، هل أنت متأكد؟");
    if (!confirmDelete) return;
    setIsDeleting(true);

    try {
      const issueIds = (report?.report_issues || []).map((issue) => issue.id);

      if (issueIds.length > 0) {
        await supabase.from("issue_items").delete().in("issue_id", issueIds);
        await supabase.from("issue_photos").delete().in("issue_id", issueIds);
        await supabase.from("report_issues").delete().in("id", issueIds);
      }

      await reportService.deleteReport(id);
      toast({
        title: "تم حذف التقرير",
        description: "تم حذف التقرير مع جميع البنود والصور المرتبطة.",
      });
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to delete report", error);
      alert("حدث خطأ أثناء حذف التقرير");
    } finally {
      setIsDeleting(false);
    }
  };

  const getSubItemPrice = (subItemId: string) =>
    subItems.find((s) => s.id === subItemId)?.unit_price || 0;

  if (isLoading || isAuthLoading || !report) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-yaamur-secondary via-white to-yaamur-secondary/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yaamur-primary mx-auto mb-4"></div>
          <p className="text-yaamur-text-light">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const reportDate = new Date(report.report_date).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const availableSubItems = subItems.filter((s) => s.main_item_id === currentIssue.main_item_id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yaamur-secondary via-white to-yaamur-secondary/50 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hidden Report Template for PDF Generation */}
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          <ReportTemplate ref={reportTemplateRef} report={report} reportDate={reportDate} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-xl">
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة للتقارير
              </Button>
            </Link>
            <h1 className="text-2xl md:text-4xl font-bold text-yaamur-text">{report.mosques.name}</h1>
            <p className="text-yaamur-text-light">تعديل وطباعة التقرير</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handlePrintPdf} 
              disabled={isGeneratingPDF}
              className="yaamur-button-primary h-12 px-6 rounded-xl"
            >
              <Download className="w-4 h-4 ml-2" />
              {isGeneratingPDF ? "جاري الإنشاء..." : "طباعة التقرير"}
            </Button>
            <Button 
              onClick={handleSaveChanges} 
              disabled={isSaving}
              variant="outline"
              className="h-12 px-6 rounded-xl"
            >
              <Save className="w-4 h-4 ml-2" />
              {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
            <Button
              onClick={handleDeleteReport}
              disabled={isDeleting}
              variant="destructive"
              className="h-12 px-6 rounded-xl"
            >
              {isDeleting ? "جارٍ الحذف..." : "حذف التقرير"}
            </Button>
          </div>
        </div>

        {pendingUploads > 0 && (
          <div className="text-sm text-yaamur-primary bg-yaamur-secondary/40 border border-yaamur-secondary/60 rounded-lg px-3 py-2">
            جاري رفع الصور... ({pendingUploads})
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mosque Info */}
          <div className="lg:col-span-1">
            <Card className="yaamur-card border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-yaamur-primary" />
                  بيانات المسجد
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-yaamur-text-light">اسم المسجد</label>
                  <Input 
                    name="name" 
                    placeholder="اسم المسجد" 
                    value={report.mosques.name} 
                    onChange={handleMosqueChange}
                    className="h-12 rounded-xl"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-yaamur-text-light">اسم المشرف</label>
                  <Input 
                    name="supervisor_name" 
                    placeholder="اسم المشرف" 
                    value={report.mosques.supervisor_name} 
                    onChange={handleMosqueChange}
                    className="h-12 rounded-xl"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-yaamur-text-light">جوال المشرف</label>
                  <Input 
                    name="supervisor_phone" 
                    placeholder="جوال المشرف" 
                    value={report.mosques.supervisor_phone} 
                    onChange={handleMosqueChange}
                    className="h-12 rounded-xl"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-yaamur-text-light">الحي</label>
                    <Input 
                      name="district" 
                      placeholder="الحي" 
                      value={report.mosques.district} 
                      onChange={handleMosqueChange}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-yaamur-text-light">المدينة</label>
                    <Input 
                      name="city" 
                      placeholder="المدينة" 
                      value={report.mosques.city} 
                      onChange={handleMosqueChange}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>

                {report.mosques.main_photo_url && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-yaamur-text-light">صورة المسجد</label>
                    <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-yaamur-secondary">
                      <Image
                        src={report.mosques.main_photo_url}
                        alt="Mosque main photo"
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Issues List */}
                  {/* Issues List */}
          <div className="lg:col-span-2">
            <Card className="yaamur-card border-0 shadow-xl">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-2xl">
                  البنود والمشاكل ({report.report_issues?.length || 0})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openAddIssueDialog}
                  className="rounded-xl flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  إضافة مشكلة
                </Button>
              </CardHeader>

              <CardContent className="space-y-4">
                {report.report_issues && report.report_issues.length > 0 ? (
                  report.report_issues.map((issue, index) => (
                    <Card key={issue.id} className="border-2 border-yaamur-secondary-dark">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="flex-1 text-lg">
                            <span className="text-yaamur-primary">مشكلة #{index + 1}:</span>
                            <span className="mr-2">{issue.main_items.name_ar}</span>
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <span className="text-sm bg-yaamur-secondary px-3 py-1 rounded-full">
                              {issue.issue_type === "single" ? "حالة 1" : "حالة 2"}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditIssueDialog(issue)}
                              className="rounded-xl"
                            >
                              تعديل
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteIssue(issue.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {issue.notes && (
                          <div>
                            <h5 className="font-semibold text-yaamur-text mb-2">ملاحظات:</h5>
                            <p className="text-yaamur-text-light">{issue.notes}</p>
                          </div>
                        )}

                        <div>
                          <h5 className="font-semibold text-yaamur-text mb-2">البنود الفرعية:</h5>
                          <div className="space-y-2">
                            {issue.issue_items.map((item) => (
                              <div
                                key={item.id}
                                className="flex justify-between items-center bg-yaamur-secondary p-3 rounded-lg"
                              >
                                <span className="font-medium">{item.sub_items.name_ar}</span>
                                <div className="flex gap-4 text-sm text-yaamur-text-light">
                                  <span>الكمية: {item.quantity}</span>
                                  <span>الوحدة: {item.sub_items.unit_ar}</span>
                                  <span className="font-bold text-yaamur-primary">
                                    {(item.unit_price ?? item.sub_items.unit_price) ?? 0} ريال
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {issue.issue_photos && issue.issue_photos.length > 0 && (
                          <div>
                            <h5 className="font-semibold text-yaamur-text mb-2">
                              الصور ({issue.issue_photos.length})
                            </h5>
                            <div className="grid grid-cols-3 gap-2">
                              {issue.issue_photos.map((photo) => (
                                <a
                                  key={photo.id}
                                  href={photo.photo_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <div
                                    className="relative h-28 md:h-32 rounded-lg overflow-hidden border-2 border-yaamur-secondary cursor-pointer"
                                  >
                                    <Image
                                      src={photo.photo_url}
                                      alt="Issue photo"
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 768px) 100vw, 33vw"
                                    />
                                  </div>
                                </a>
                              ))}

                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-yaamur-text-light text-lg">
                      لا توجد مشاكل مسجلة لهذا التقرير.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Live report preview (same layout as printed PDF) */}
        <div className="mt-10 bg-white/70 border border-yaamur-secondary/40 rounded-2xl shadow-xl p-4">
          <h2 className="text-xl font-bold mb-4 text-yaamur-text">معاينة التقرير (تحديث مباشر)</h2>
          <p className="text-sm text-yaamur-text-light mb-4">
            يتم تحديث المعاينة مباشرة عند تعديل بيانات المسجد أو الحالات، وهي نفس الصفحة التي تُطبع في ملف الـ PDF.
          </p>
          <div className="overflow-auto border border-yaamur-secondary/30 rounded-xl bg-neutral-100 flex justify-center">
            <ReportTemplate report={report} reportDate={reportDate} />
          </div>
        </div>

        {/*  Dialog */}
                <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
    <DialogHeader>
      <DialogTitle className="text-2xl">
        {issueDialogMode === "create" ? "إضافة مشكلة جديدة" : "تعديل المشكلة"}
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-6 py-4">
      {/* البند الرئيسي */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">البند الرئيسي *</Label>
        <Select
          value={currentIssue.main_item_id}
          onValueChange={(value) =>
            setCurrentIssue({ ...currentIssue, main_item_id: value })
          }
        >
          <SelectTrigger className="h-12 text-base rounded-xl">
            <SelectValue placeholder="اختر البند الرئيسي" />
          </SelectTrigger>
          <SelectContent>
            {mainItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name_ar}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* نوع الحالة */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">نوع الحالة *</Label>
        <RadioGroup
          value={currentIssue.caseType}
          onValueChange={(value) =>
            setCurrentIssue({ ...currentIssue, caseType: value as IssueCase })
          }
          className="space-y-3"
        >
          <div className="flex items-center space-x-2 space-x-reverse border-2 border-yaamur-secondary-dark rounded-xl p-4">
            <RadioGroupItem value="case1" id="case1" />
            <Label htmlFor="case1" className="flex-1 cursor-pointer">
              <div className="font-bold">حالة 1</div>
              <div className="text-sm text-yaamur-text-light">
                بند فرعي واحد + كمية + 3 صور
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse border-2 border-yaamur-secondary-dark rounded-xl p-4">
            <RadioGroupItem value="case2" id="case2" />
            <Label htmlFor="case2" className="flex-1 cursor-pointer">
              <div className="font-bold">حالة 2</div>
              <div className="text-sm text-yaamur-text-light">
                3 بنود فرعية، لكل بند كمية وصورة
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* حالة 1 */}
      {currentIssue.caseType === "case1" ? (
        <>
          <div className="space-y-2">
            <Label className="text-base font-semibold">البند الفرعي *</Label>
        <Select
          value={currentIssue.case1Data.sub_item_id}
          onValueChange={(value) =>
            setCurrentIssue({
              ...currentIssue,
              case1Data: {
                ...currentIssue.case1Data,
                sub_item_id: value,
                unit_price: getSubItemPrice(value),
              },
            })
          }
          disabled={!currentIssue.main_item_id}
        >
              <SelectTrigger className="h-12 text-base rounded-xl">
                <SelectValue placeholder="اختر البند الفرعي" />
              </SelectTrigger>
              <SelectContent>
                {availableSubItems.map((item) => (
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
              onChange={(e) =>
                setCurrentIssue({
                  ...currentIssue,
                  case1Data: {
                    ...currentIssue.case1Data,
                    quantity: parseInt(e.target.value) || 1,
                  },
                })
              }
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
              onChange={(e) =>
                setCurrentIssue({
                  ...currentIssue,
                  case1Data: {
                    ...currentIssue.case1Data,
                    unit_price: parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="h-12 text-base rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">
              الصور (3 صور مطلوبة) *
            </Label>
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
        /* حالة 2 */
        <div className="space-y-4">
          <Label className="text-base font-semibold">البنود الفرعية *</Label>
          {currentIssue.case2Data.items.map((item, itemIndex) => (
            <Card key={itemIndex} className="border-2 border-yaamur-secondary-dark">
              <CardContent className="p-4 space-y-3">
                <h4 className="font-bold text-yaamur-primary">
                  البند {itemIndex + 1}
                </h4>

                <Select
                  value={item.sub_item_id}
                  onValueChange={(value) => {
                    const newItems = [...currentIssue.case2Data.items];
                    newItems[itemIndex].sub_item_id = value;
                    newItems[itemIndex].unit_price = getSubItemPrice(value);
                    setCurrentIssue({
                      ...currentIssue,
                      case2Data: { items: newItems },
                    });
                  }}
                  disabled={!currentIssue.main_item_id}
                >
                  <SelectTrigger className="h-10 text-sm rounded-lg">
                    <SelectValue placeholder="اختر البند الفرعي" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubItems.map((subItem) => (
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
                    newItems[itemIndex].quantity =
                      parseInt(e.target.value) || 1;
                    setCurrentIssue({
                      ...currentIssue,
                      case2Data: { items: newItems },
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
                    newItems[itemIndex].unit_price =
                      parseFloat(e.target.value) || 0;
                    setCurrentIssue({
                      ...currentIssue,
                      case2Data: { items: newItems },
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

      {/* الملاحظات */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">الملاحظات (اختياري)</Label>
        <Input
          placeholder="أضف أي ملاحظات إضافية عن المشكلة"
          value={currentIssue.notes}
          onChange={(e) =>
            setCurrentIssue({ ...currentIssue, notes: e.target.value })
          }
          className="h-12 text-base rounded-xl"
        />
      </div>
    </div>

    <DialogFooter className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => setIsIssueDialogOpen(false)}
        className="flex-1 h-12 text-base rounded-xl"
      >
        إلغاء
      </Button>
      <Button
        onClick={handleSaveIssue}
        disabled={pendingUploads > 0 || isSavingIssue}
        className="flex-1 yaamur-button-primary h-12 text-base rounded-xl"
      >
        {isSavingIssue ? "جاري الحفظ..." : "حفظ المشكلة"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
          
        </div>
      </div>
  );
}
