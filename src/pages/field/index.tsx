import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Badge, MapPin, Calendar, MoreVertical, Trash2, Edit, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Report } from "@/types";
import { reportService } from "@/services/reportService";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function FieldHomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const loadReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const data = await reportService.getAllReports();
      setReports(data);
    } catch (error) {
      console.error("Failed to load reports:", error);
      toast({ title: "Failed to load reports", variant: "destructive" });
    } finally {
      setLoadingReports(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    } else if (user) {
      loadReports();
    }
  }, [user, isLoading, router, loadReports]);

  const handleDeleteReport = async (reportId: string) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        await reportService.deleteReport(reportId);
        setReports(reports.filter(report => report.id !== reportId));
        toast({ title: "Report deleted successfully" });
      } catch (error) {
        console.error("Failed to delete report:", error);
        toast({ title: "Could not delete the report", variant: "destructive" });
      }
    }
  };

  if (isLoading || loadingReports || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 yaamur-gradient rounded-3xl flex items-center justify-center mx-auto mb-4 floating-animation">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <p className="text-yaamur-text font-medium">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center fade-in-up">
        <div>
          <h1 className="text-4xl font-bold text-yaamur-text mb-3">Field Reports</h1>
          <p className="text-yaamur-text-light text-lg">Manage mosque inspection reports</p>
          <div className="w-32 h-1 yaamur-gradient rounded-full mt-4"></div>
        </div>
        <Link href="/field/new-report">
          <Button className="yaamur-button-primary flex items-center space-x-2 h-14 px-6 text-base font-semibold rounded-xl shadow-lg">
            <Plus className="w-5 h-5" />
            <span>Create New Report</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {reports.map((report, index) => (
          <Card key={report.id} className="yaamur-card interactive-hover fade-in-up border-0 shadow-xl overflow-hidden" style={{ animationDelay: `${index * 150}ms` }}>
            <div className="relative">
              <div className="relative h-56 overflow-hidden">
                <Image
                  src={report.mosques.main_photo_url || "/placeholder.png"}
                  alt={report.mosques.name}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-110"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute top-4 right-4">
                  <Badge 
                    className={`${
                      report.status === "completed" 
                        ? "bg-green-500 hover:bg-green-600 text-white shadow-lg" 
                        : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
                    } font-semibold px-3 py-1`}
                  >
                    {report.status}
                  </Badge>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold mb-1">{report.mosques.name}</h3>
                  <div className="flex items-center text-white/90 text-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{report.mosques.district}, {report.mosques.city}</span>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-yaamur-text-light text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-yaamur-primary" />
                      <span>Last modified: {new Date(report.updated_at).toLocaleDateString()}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-yaamur-secondary rounded-lg">
                          <MoreVertical className="w-4 h-4 text-yaamur-text" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link href={`/field/report/${report.id}`} className="flex items-center">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Report
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteReport(report.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-yaamur-secondary-dark/20">
                    <div>
                      <p className="text-sm font-semibold text-yaamur-text mb-1">Supervisor</p>
                      <p className="text-sm text-yaamur-text-light">{report.mosques.supervisor_name}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
        
        {reports.length === 0 && !loadingReports && (
          <div className="col-span-full">
            <Card className="yaamur-card p-16 text-center fade-in-up border-0 shadow-xl">
              <div className="w-20 h-20 bg-gradient-to-br from-yaamur-secondary to-yaamur-secondary/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-yaamur-primary" />
              </div>
              <h3 className="text-2xl font-bold text-yaamur-text mb-3">No Reports Yet</h3>
              <p className="text-yaamur-text-light text-lg mb-8 max-w-md mx-auto">Start by creating your first mosque inspection report to track maintenance needs and costs</p>
              <Link href="/field/new-report">
                <Button className="yaamur-button-primary h-14 px-8 text-lg font-semibold rounded-xl shadow-lg">
                  <Plus className="w-5 h-5 mr-3" />
                  Create New Report
                </Button>
              </Link>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
