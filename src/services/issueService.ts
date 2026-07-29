import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Issue } from "@/types";

type IssueInsert = Database["public"]["Tables"]["report_issues"]["Insert"];
type IssueUpdate = Database["public"]["Tables"]["report_issues"]["Update"];

/** بند فرعي داخل مشكلة + البنود الفرعية المتضمّنة تحته (بدون تسعير مستقل) */
export type IssueItemInput = {
  sub_item_id: string;
  cause_id: string | null;
  spec_id: string | null;
  quantity: number;
  unit_price: number;
  inclusion_sub_item_ids: string[];
};

const ISSUE_SELECT = `
        *,
        main_items (*),
        issue_items (
          *,
          sub_items (*),
          causes (*),
          specs (*),
          inclusions:issue_item_inclusions (
            *,
            sub_items (*)
          )
        ),
        issue_photos (*)
      `;

export const issueService = {
  async getAllIssuesForReport(reportId: string): Promise<Issue[]> {
    const { data, error } = await supabase
      .from("report_issues")
      .select(ISSUE_SELECT)
      .eq("report_id", reportId);

    if (error) throw error;
    return (data as unknown as Issue[]) || [];
  },

  async createIssue(issue: IssueInsert): Promise<Issue> {
    const { data, error } = await supabase
      .from("report_issues")
      .insert(issue)
      .select(ISSUE_SELECT)
      .single();

    if (error) throw error;
    return data as unknown as Issue;
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

  /**
   * يحفظ بنود المشكلة مع البنود الفرعية المتضمّنة تحت كل بند.
   * الإدخال يتم صفاً صفاً لأننا نحتاج معرّف كل بند لربط متضمناته به.
   */
  async insertIssueItems(issueId: string, items: IssueItemInput[]) {
    for (const item of items) {
      const { data, error } = await supabase
        .from("issue_items")
        .insert([
          {
            issue_id: issueId,
            sub_item_id: item.sub_item_id,
            cause_id: item.cause_id,
            spec_id: item.spec_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
          },
        ])
        .select("id")
        .single();

      if (error) throw error;

      const inclusionIds = Array.from(
        new Set(item.inclusion_sub_item_ids.filter(Boolean))
      ).filter((subItemId) => subItemId !== item.sub_item_id);

      if (inclusionIds.length === 0) continue;

      const { error: inclusionError } = await supabase
        .from("issue_item_inclusions")
        .insert(
          inclusionIds.map((subItemId, index) => ({
            issue_item_id: data.id,
            sub_item_id: subItemId,
            sort_order: index,
          }))
        );

      if (inclusionError) throw inclusionError;
    }
  },

  /** يستبدل بنود المشكلة بالكامل (المتضمنات تُحذف تلقائياً مع البنود) */
  async replaceIssueItems(issueId: string, items: IssueItemInput[]) {
    const { error } = await supabase
      .from("issue_items")
      .delete()
      .eq("issue_id", issueId);

    if (error) throw error;

    await this.insertIssueItems(issueId, items);
  },

  async deleteIssue(id: string) {
    // We rely on RLS for permission; no select to avoid extra RLS requirements
    const { error } = await supabase.from("report_issues").delete().eq("id", id);
    if (error) throw error;
    return true;
  },
};
