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
  /** يُملأ داخلياً عند إعادة كتابة البنود حتى لا تُفقد الأرشفة عند التعديل */
  archived_at?: string | null;
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
            archived_at: item.archived_at ?? null,
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

  /**
   * يستبدل بنود المشكلة بالكامل (المتضمنات تُحذف تلقائياً مع البنود).
   * الأرشفة تُنقل للبنود الجديدة بمطابقة البند الفرعي، لا بموضعه في المشكلة:
   * البند نفسه يبقى مؤرشفاً، والبند الفرعي الذي استبدله الفني يعود ظاهراً.
   */
  async replaceIssueItems(issueId: string, items: IssueItemInput[]) {
    const { data: existing, error: readError } = await supabase
      .from("issue_items")
      .select("sub_item_id, archived_at")
      .eq("issue_id", issueId);

    if (readError) throw readError;

    // قائمة لكل بند فرعي لا قيمة واحدة، حتى لو تكرر البند الفرعي في المشكلة
    // فلا تنتقل أرشفة صفٍّ واحد إلى نظيره غير المؤرشف.
    const archivedBySubItem = new Map<string, string[]>();
    (existing || []).forEach((row) => {
      if (!row.archived_at) return;
      const stamps = archivedBySubItem.get(row.sub_item_id) || [];
      stamps.push(row.archived_at);
      archivedBySubItem.set(row.sub_item_id, stamps);
    });

    const { error } = await supabase
      .from("issue_items")
      .delete()
      .eq("issue_id", issueId);

    if (error) throw error;

    await this.insertIssueItems(
      issueId,
      items.map((item) => {
        const stamps = archivedBySubItem.get(item.sub_item_id);
        return stamps?.length
          ? { ...item, archived_at: stamps.shift() ?? null }
          : item;
      })
    );
  },

  /**
   * يؤرشف بنداً أو يُلغي أرشفته. البند يبقى في قاعدة البيانات ويخرج من كل
   * مخرجات التقرير: جدول التكلفة والمواصفات والإجمالي وصفحة صوره.
   */
  async setItemArchived(itemId: string, archived: boolean) {
    const { error } = await supabase
      .from("issue_items")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", itemId);

    if (error) throw error;
  },

  /** أرشفة بنود المشكلة كلها أو إرجاعها — طلب واحد بدل طلب لكل بند */
  async setIssueItemsArchived(issueId: string, archived: boolean) {
    const { error } = await supabase
      .from("issue_items")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("issue_id", issueId);

    if (error) throw error;
  },

  async deleteIssue(id: string) {
    // We rely on RLS for permission; no select to avoid extra RLS requirements
    const { error } = await supabase.from("report_issues").delete().eq("id", id);
    if (error) throw error;
    return true;
  },
};
