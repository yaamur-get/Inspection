import React, { useState, useEffect, useRef } from "react";
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

type IssueCase = "case1" | "case2";

interface IssueFormData {
  caseType: IssueCase;
  main_item_id: string;
  notes: string;
  case1Data: {
    sub_item_id: string;
    quantity: number;
    photos: string[];
  };
  case2Data: {
    items: {
      sub_item_id: string;
      quantity: number;
      photo: string;
    }[];
  };
}

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
      photos: []
    },
    case2Data: {
      items: [
        { sub_item_id: "", quantity: 1, photo: "" },
        { sub_item_id: "", quantity: 1, photo: "" },
        { sub_item_id: "", quantity: 1, photo: "" }
      ]
    }
  });
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/");
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (id && typeof id === "string") {
      loadReport(id);
    }
  }, [id]);

  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user]);
 	
  const loadReport = async (reportId: string) => {
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
  };

  const loadItems = async () => {
    try {
      const main = await itemService.getAllMainItems();
      const allSubItems = main.flatMap((m) => m.sub_items || []);
      setMainItems(main);
      setSubItems(allSubItems);
    } catch (error) {
      console.error("Failed to load items for issues", error);
    }
  };

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

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage.from("mosque-photos").upload(fileName, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("mosque-photos").getPublicUrl(data.path);

    return publicUrl;
  };

  const handleCase1PhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhotos(true);
      const photoUrl = await uploadPhoto(file);
      const newPhotos = [...currentIssue.case1Data.photos];
      newPhotos[index] = photoUrl;
      setCurrentIssue({
        ...currentIssue,
        case1Data: { ...currentIssue.case1Data, photos: newPhotos },
      });
    } catch (error) {
      console.error("Upload error:", error);
      alert("حدث خطأ أثناء رفع الصورة");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleCase2PhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhotos(true);
      const photoUrl = await uploadPhoto(file);
      const newItems = [...currentIssue.case2Data.items];
      newItems[itemIndex].photo = photoUrl;
      setCurrentIssue({
        ...currentIssue,
        case2Data: { items: newItems },
      });
    } catch (error) {
      console.error("Upload error:", error);
      alert("حدث خطأ أثناء رفع الصورة");
    } finally {
      setUploadingPhotos(false);
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
    } else {
      const validItems = currentIssue.case2Data.items.filter(
        (item) => item.sub_item_id && item.photo && item.quantity > 0,
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
        photos: [],
      },
      case2Data: {
        items: [
          { sub_item_id: "", quantity: 1, photo: "" },
          { sub_item_id: "", quantity: 1, photo: "" },
          { sub_item_id: "", quantity: 1, photo: "" },
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
        photos: [],
      },
      case2Data: {
        items: [
          { sub_item_id: "", quantity: 1, photo: "" },
          { sub_item_id: "", quantity: 1, photo: "" },
          { sub_item_id: "", quantity: 1, photo: "" },
        ],
      },
    };

    if (caseType === "case1") {
      const item = issue.issue_items[0];
      const photos = issue.issue_photos.map((p) => p.photo_url);
      form.case1Data = {
        sub_item_id: item?.sub_item_id || "",
        quantity: item?.quantity || 1,
        photos: [photos[0] || "", photos[1] || "", photos[2] || ""],
      };
    } else {
      const items = issue.issue_items;
      const photos = issue.issue_photos;
      form.case2Data = {
        items: [0, 1, 2].map((idx) => ({
          sub_item_id: items[idx]?.sub_item_id || "",
          quantity: items[idx]?.quantity || 1,
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
    if (!report || !id || typeof id !== "string") return;
    if (!validateIssue()) return;

    try {
      if (issueDialogMode === "create") {
        const issueData = {
          report_id: report.id,
          main_item_id: currentIssue.main_item_id,
          notes: currentIssue.notes || "",
          issue_type: currentIssue.caseType === "case1" ? "single" : "multiple",
        } as any;

        const savedIssue = await issueService.createIssue(issueData);

        if (savedIssue) {
          if (currentIssue.caseType === "case1") {
            await supabase.from("issue_items").insert([
              {
                issue_id: savedIssue.id,
                sub_item_id: currentIssue.case1Data.sub_item_id,
                quantity: currentIssue.case1Data.quantity,
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
        const updateData = {
          main_item_id: currentIssue.main_item_id,
          notes: currentIssue.notes || "",
          issue_type: currentIssue.caseType === "case1" ? "single" : "multiple",
        } as any;

        await issueService.updateIssue(editingIssueId, updateData);

        await supabase.from("issue_items").delete().eq("issue_id", editingIssueId);
        await supabase.from("issue_photos").delete().eq("issue_id", editingIssueId);

        if (currentIssue.caseType === "case1") {
          await supabase.from("issue_items").insert([
            {
              issue_id: editingIssueId,
              sub_item_id: currentIssue.case1Data.sub_item_id,
              quantity: currentIssue.case1Data.quantity,
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

      await loadReport(id);
      resetIssueForm();
      setIsIssueDialogOpen(false);
    } catch (error) {
      console.error("Failed to save issue", error);
      alert("حدث خطأ أثناء حفظ المشكلة");
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    if (!id || typeof id !== "string") return;
    const confirmDelete = window.confirm("هل أنت متأكد من حذف هذه المشكلة؟");
    if (!confirmDelete) return;

    try {
      await supabase.from("issue_items").delete().eq("issue_id", issueId);
      await supabase.from("issue_photos").delete().eq("issue_id", issueId);
      await issueService.deleteIssue(issueId);
      await loadReport(id);
    } catch (error) {
      console.error("Failed to delete issue", error);
      alert("حدث خطأ أثناء حذف المشكلة");
    }
  };

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
          </div>
        </div>

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
                      <img 
                        src={report.mosques.main_photo_url} 
                        alt="صورة المسجد" 
                        className="w-full h-full object-cover"
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
                                    {item.sub_items.unit_price} ريال
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
                              {issue.issue_photos.map((photo, photoIndex) => (
                                <div
                                  key={photo.id}
                                  className="relative h-24 rounded-lg overflow-hidden border-2 border-yaamur-secondary"
                                >
                                  <img
                                    src={photo.photo_url}
                                    alt={`صورة ${photoIndex + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
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
                  case1Data: { ...currentIssue.case1Data, sub_item_id: value },
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
                    disabled={uploadingPhotos}
                    className="text-sm rounded-xl"
                  />
                  {currentIssue.case1Data.photos[index] && (
                    <div className="relative w-full h-24 rounded-lg overflow-hidden border-2 border-yaamur-primary">
                      <img
                        src={currentIssue.case1Data.photos[index]}
                        alt={`صورة ${index + 1}`}
                        className="w-full h-full object-cover"
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

                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCase2PhotoUpload(e, itemIndex)}
                    disabled={uploadingPhotos}
                    className="text-sm rounded-lg"
                  />
                  {item.photo && (
                    <div className="relative w-full h-24 rounded-lg overflow-hidden border-2 border-yaamur-primary">
                      <img
                        src={item.photo}
                        alt={`صورة البند ${itemIndex + 1}`}
                        className="w-full h-full object-cover"
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
        disabled={uploadingPhotos}
        className="flex-1 yaamur-button-primary h-12 text-base rounded-xl"
      >
        حفظ المشكلة
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
          
        </div>
      </div>
    </div>
  );
}
