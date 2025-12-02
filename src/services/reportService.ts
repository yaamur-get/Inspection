import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Report } from "@/types";

type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"] & {
  map_photo_url?: string | null;
};
type ReportUpdate = Database["public"]["Tables"]["reports"]["Update"] & {
  map_photo_url?: string | null;
};

export const reportService = {
  async getAllReports(): Promise<Report[]> {
    const { data, error } = await supabase
      .from("reports")
      .select(`
        *,
        mosques (*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error);
      throw error;
    }
    return (data as Report[]) || [];
  },

  async getReportById(id: string): Promise<Report | null> {
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select(`
        *,
        mosques (*)
      `)
      .eq("id", id)
      .single();

    if (reportError) {
      console.error("Error fetching report:", reportError);
      throw reportError;
    }

    const { data: issues, error: issuesError } = await supabase
      .from("report_issues")
      .select(`
        *,
        main_items (*)
      `)
      .eq("report_id", id);

    if (issuesError) {
      console.error("Error fetching issues:", issuesError);
      throw issuesError;
    }

    const enrichedIssues = await Promise.all(
      (issues || []).map(async (issue) => {
        const [itemsData, photosData] = await Promise.all([
          supabase
            .from("issue_items")
            .select(`
              *,
              sub_items (*)
            `)
            .eq("issue_id", issue.id),
          supabase
            .from("issue_photos")
            .select("*")
            .eq("issue_id", issue.id)
        ]);

        return {
          ...issue,
          issue_items: itemsData.data || [],
          issue_photos: photosData.data || []
        };
      })
    );

    return {
      ...report,
      report_issues: enrichedIssues
    } as Report;
  },

  async createReport(report: ReportInsert): Promise<Report> {
    const { data, error } = await supabase
      .from("reports")
      .insert([report])
      .select()
      .single();

    if (error) {
      console.error("Error creating report:", error);
      throw error;
    }
    return data as Report;
  },

  async updateReport(id: string, updates: ReportUpdate): Promise<Report> {
    const { data, error } = await supabase
      .from("reports")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating report:", error);
      throw error;
    }
    return data as Report;
  },

  async deleteReport(id: string) {
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting report:", error);
      throw error;
    }
    return true;
  },

  async getReportStats() {
    const { data: allReports, error: allError } = await supabase
      .from("reports")
      .select("status");

    if (allError) throw allError;

    const totalReports = allReports?.length || 0;
    const completedReports = allReports?.filter(r => r.status === "completed").length || 0;
    const pendingReports = allReports?.filter(r => r.status === "pending").length || 0;

    const { data: mosquesData, error: mosquesError } = await supabase
      .from("mosques")
      .select("id");

    if (mosquesError) throw mosquesError;

    return {
      totalMosques: mosquesData?.length || 0,
      totalReports,
      completedReports,
      pendingReports
    };
  }
};
