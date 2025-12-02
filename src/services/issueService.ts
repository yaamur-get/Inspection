import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Issue } from "@/types";

type IssueInsert = Database["public"]["Tables"]["report_issues"]["Insert"];
type IssueUpdate = Database["public"]["Tables"]["report_issues"]["Update"];

export const issueService = {
  async getAllIssuesForReport(reportId: string): Promise<Issue[]> {
    const { data, error } = await supabase
      .from("report_issues")
      .select(
        `
        *,
        main_items (*),
        issue_items (
          *,
          sub_items (*)
        ),
        issue_photos (*)
      `
      )
      .eq("report_id", reportId);

    if (error) throw error;
    return (data as Issue[]) || [];
  },

  async createIssue(issue: IssueInsert): Promise<Issue> {
    const { data, error } = await supabase
      .from("report_issues")
      .insert(issue)
      .select(
        `
        *,
        main_items (*),
        issue_items (
          *,
          sub_items (*)
        ),
        issue_photos (*)
      `
      )
      .single();

    if (error) throw error;
    return data as Issue;
  },

  async updateIssue(id: string, updates: IssueUpdate): Promise<Issue> {
    const { data, error } = await supabase
      .from("report_issues")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Issue;
  },

  async deleteIssue(id: string) {
    // We rely on RLS for permission; no select to avoid extra RLS requirements
    const { error } = await supabase.from("report_issues").delete().eq("id", id);
    if (error) throw error;
    return true;
  },
};
