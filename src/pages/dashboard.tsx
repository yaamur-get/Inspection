import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, FileText, Clock, Plus, Search, MapPin, Calendar, User, LogOut, Edit } from "lucide-react";
import Link from "next/link";
import { reportService } from "@/services/reportService";
import { mosqueService } from "@/services/mosqueService";
import { Report } from "@/types";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface DashboardStats {
  totalMosques: number;
  totalReports: number;
  pendingReports: number;
}

export default function Dashboard() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalMosques: 0,
    totalReports: 0,
    pendingReports: 0,
  });
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [reportsData, mosquesData] = await Promise.all([
        reportService.getAllReports(),
        mosqueService.getAllMosques(),
      ]);

      setReports(reportsData);
      setFilteredReports(reportsData);

      const pendingCount = reportsData.filter(r => r.status === "pending").length;

      setStats({
        totalMosques: mosquesData.length,
        totalReports: reportsData.length,
        pendingReports: pendingCount,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({ title: "Failed to load dashboard data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = reports.filter(report =>
        report.mosques?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.mosques?.supervisor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.mosques?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.mosques?.district?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReports(filtered);
    } else {
      setFilteredReports(reports);
    }
  }, [searchTerm, reports]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yaamur-secondary via-white to-yaamur-secondary/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yaamur-primary mx-auto mb-4"></div>
          <p className="text-yaamur-text-light">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "إجمالي المساجد",
      value: stats.totalMosques,
      icon: Building2,
      color: "text-yaamur-primary",
      bgColor: "bg-gradient-to-br from-yaamur-secondary to-yaamur-secondary/50",
    },
    {
      title: "إجمالي التقارير",
      value: stats.totalReports,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
    },
    {
      title: "تقارير معلقة",
      value: stats.pendingReports,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yaamur-secondary via-white to-yaamur-secondary/50" dir="rtl">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-yaamur-secondary-dark/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-15 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-lg">
                <Image
                  src="/logo/logo-brand.svg"
                  alt="Yaamur logo"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-yaamur-text">نظام المعاينة</h1>
                <p className="text-xs md:text-sm text-yaamur-text-light font-medium hidden sm:block">Mosque Inspection</p>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
              <div className="text-right hidden md:block">
                <p className="text-sm md:text-base font-semibold text-yaamur-text">{user.fullName}</p>
                <p className="text-xs md:text-sm text-yaamur-text-light">
                  {user.role === "admin" ? "مدير النظام" : "فني ميداني"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center gap-2 h-9 md:h-10 px-3 md:px-4 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200 rounded-xl border-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium hidden sm:inline">تسجيل خروج</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
        <div className="fade-in-up text-center .text-right ">
          <h2 className="text-2xl md:text-4xl font-bold text-yaamur-text mb-2">
            مرحباً، {user.fullName}
          </h2>
          <p className="text-yaamur-text-light text-sm md:text-lg">
            لوحة التحكم
          </p>
          <div className="w-32 h-1 yaamur-gradient rounded-full mx-auto md:mr-0 mt-4"></div>
                          {user.role === "admin" && (
                  <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                    <Link href="/admin/users">
                      <Button
                        variant="outline"
                        className="h-10 px-4 rounded-xl border-2 border-yaamur-secondary-dark text-sm md:text-base"
                      >
                        إدارة المستخدمين
                      </Button>
                    </Link>
                    <Link href="/admin/items">
                      <Button
                        variant="outline"
                        className="h-10 px-4 rounded-xl border-2 border-yaamur-secondary-dark text-sm md:text-base"
                      >
                        إدارة العناصر
                      </Button>
                    </Link>
                  </div>
                )}

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {statCards.map((card, index) => (
            <Card key={card.title} className="yaamur-card interactive-hover fade-in-up border-0 shadow-lg" style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs md:text-sm font-semibold text-yaamur-text-light mb-2">{card.title}</p>
                    <p className="text-2xl md:text-4xl font-bold text-yaamur-text">{card.value}</p>
                  </div>
                  <div className={`w-12 h-12 md:w-16 md:h-16 ${card.bgColor} rounded-2xl flex items-center justify-center shadow-sm`}>
                    <card.icon className={`w-6 h-6 md:w-8 md:h-8 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <Link href="/field/new-report" className="w-full">
            <Button className="w-full yaamur-button-primary h-14 md:h-16 text-base md:text-lg font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-all">
              <Plus className="w-5 h-5 md:w-6 md:h-6 ml-2" />
              إضافة تقرير جديد
            </Button>
          </Link>

          <div className="relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-yaamur-text-light w-5 h-5" />
            <Input
              type="text"
              placeholder="ابحث عن مسجد، مشرف، مدينة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 md:h-14 pr-12 text-base rounded-xl border-2 border-yaamur-secondary-dark focus:border-yaamur-primary transition-all"
            />
          </div>
        </div>

        <Card className="yaamur-card border-0 shadow-xl">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg md:text-2xl font-bold text-yaamur-text flex items-center">
                <FileText className="w-5 h-5 md:w-6 md:h-6 ml-2 text-yaamur-primary" />
                التقارير الميدانية
              </h3>
              <p className="text-xs md:text-sm text-yaamur-text-light">
                {filteredReports.length} تقرير
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yaamur-primary mx-auto mb-4"></div>
                <p className="text-yaamur-text-light">جاري تحميل التقارير...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 md:w-16 md:h-16 text-yaamur-text-light mx-auto mb-4 opacity-50" />
                <p className="text-yaamur-text-light text-base md:text-lg">
                  {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد تقارير حتى الآن"}
                </p>
                {!searchTerm && (
                  <Link href="/field/new-report">
                    <Button className="mt-4 yaamur-button-primary">
                      <Plus className="w-5 h-5 ml-2" />
                      إضافة تقرير جديد
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report, index) => (
                  <Card key={report.id} className="interactive-hover border-2 border-yaamur-secondary-dark hover:border-yaamur-primary transition-all fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-yaamur-secondary to-yaamur-secondary-dark rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                            {report.mosques?.main_photo_url ? (
                              <Image
                                src={report.mosques.main_photo_url}
                                alt={report.mosques.name || "Mosque main photo"}
                                fill
                                className="object-cover"
                                sizes="96px"
                              />
                            ) : (
                              <Building2 className="w-8 h-8 md:w-10 md:h-10 text-yaamur-primary" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-base md:text-xl font-bold text-yaamur-text mb-2 truncate">
                              {report.mosques?.name || "مسجد غير محدد"}
                            </h4>
                            
                            <div className="flex flex-col gap-2 text-xs md:text-sm text-yaamur-text-light">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                                <span className="truncate">{report.mosques?.supervisor_name || "غير محدد"}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                                <span className="truncate">
                                  {report.mosques?.city && report.mosques?.district 
                                    ? `${report.mosques.district}، ${report.mosques.city}`
                                    : "الموقع غير محدد"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                                <span>{new Date(report.created_at).toLocaleDateString("ar-SA")}</span>
                              </div>
                            </div>

                            <div className="mt-2">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                report.status === "completed" 
                                  ? "bg-green-100 text-green-700" 
                                  : report.status === "pending"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}>
                                {report.status === "completed" 
                                  ? "مكتمل" 
                                  : report.status === "pending"
                                  ? "قيد المراجعة"
                                  : "جاري العمل"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Link href={`/field/report/${report.id}`} className="flex-1">
                            <Button className="w-full yaamur-button-primary text-sm h-10">
                              <Edit className="w-4 h-4 ml-2" />
                              عرض التفاصيل
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
