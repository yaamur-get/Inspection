import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Save, Edit2 } from "lucide-react";
import Link from "next/link";
import { Report } from "@/types";
import { reportService } from "@/services/reportService";
import { mosqueService } from "@/services/mosqueService";
import { ReportTemplate } from "@/components/pdf/ReportTemplate";
import { generatePdfFromHtml } from "@/lib/html2pdfGenerator";

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
    if(!report) return;
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
    if (!report || !reportTemplateRef.current) return;
    
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
          <div className="lg:col-span-2">
            <Card className="yaamur-card border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">
                  البنود والمشاكل ({report.report_issues?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.report_issues && report.report_issues.length > 0 ? (
                  report.report_issues.map((issue, index) => (
                    <Card key={issue.id} className="border-2 border-yaamur-secondary-dark">
                      <CardHeader>
                        <CardTitle className="flex justify-between items-start text-lg">
                          <div className="flex-1">
                            <span className="text-yaamur-primary">البند #{index + 1}:</span>
                            <span className="mr-2">{issue.main_items.name_ar}</span>
                          </div>
                          <span className="text-sm bg-yaamur-secondary px-3 py-1 rounded-full">
                            {issue.issue_type === "single" ? "حالة 1" : "حالة 2"}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {issue.notes && (
                          <div>
                            <h5 className="font-semibold text-yaamur-text mb-2">الملاحظات:</h5>
                            <p className="text-yaamur-text-light">{issue.notes}</p>
                          </div>
                        )}
                        
                        <div>
                          <h5 className="font-semibold text-yaamur-text mb-2">البنود الفرعية:</h5>
                          <div className="space-y-2">
                            {issue.issue_items.map(item => (
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
                    <p className="text-yaamur-text-light text-lg">لا توجد مشاكل مسجلة في هذا التقرير</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
