import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

type ApiError = { error: string };

type FinalReportResponse = {
  report: Record<string, unknown>;
  issues: Array<Record<string, unknown>>;
};

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FinalReportResponse | ApiError>
) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rqParam = req.query.rq_number;
  const rqNumber = Array.isArray(rqParam) ? rqParam[0] : rqParam;

  if (!rqNumber || !rqNumber.trim()) {
    return res.status(400).json({ error: "rq_number is required" });
  }

  try {
    // نفس منطق reportService: نبدأ من reports + mosque
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select(
        `
        *,
        mosques (*)
      `
      )
      .filter("rq_number", "eq", rqNumber.trim())
      .filter("report_type", "eq", "linked")
      .single();

    if (reportError || !report) {
      return res.status(404).json({ error: "Linked report not found" });
    }

    // نفس منطق reportService: نجلب المشكلات + البند الرئيسي
    const { data: issues, error: issuesError } = await supabase
      .from("report_issues")
      .select(
        `
        *,
        main_items (*)
      `
      )
      .eq("report_id", report.id);

    if (issuesError) {
      console.error("Error fetching issues:", issuesError);
      return res.status(500).json({ error: "Failed to fetch report issues" });
    }

    // نفس منطق reportService: لكل مشكلة نجلب البنود الفرعية + الصور + lookups
    const enrichedIssues = await Promise.all(
      (issues || []).map(async (issue) => {
        const [itemsData, photosData] = await Promise.all([
          supabase
            .from("issue_items")
            .select(
              `
              *,
              sub_items (*),
              causes (*),
              specs (*),
              inclusions:issue_item_inclusions (
                *,
                sub_items (*)
              )
            `
            )
            .eq("issue_id", issue.id),
          supabase
            .from("issue_photos")
            .select("*")
            .eq("issue_id", issue.id),
        ]);

        return {
          ...issue,
          issue_items: itemsData.data || [],
          issue_photos: photosData.data || [],
        };
      })
    );

    // Export shape نهائي جاهز للعرض/PDF بدون queries إضافية
    const finalIssues = enrichedIssues.map((issue) => {
      const issueRecord = toRecord(issue);
      const mainItem = toRecord(issueRecord.main_items);
      const items = Array.isArray(issueRecord.issue_items)
        ? issueRecord.issue_items.map((item) => {
            const itemRecord = toRecord(item);
            const subItem = toRecord(itemRecord.sub_items);
            const cause = toRecord(itemRecord.causes);
            const spec = toRecord(itemRecord.specs);
            const inclusions = Array.isArray(itemRecord.inclusions)
              ? itemRecord.inclusions
                  .map((inclusion) => toRecord(inclusion))
                  .sort(
                    (a, b) =>
                      (typeof a.sort_order === "number" ? a.sort_order : 0) -
                      (typeof b.sort_order === "number" ? b.sort_order : 0)
                  )
                  .map((inclusion) => {
                    const inclusionSubItem = toRecord(inclusion.sub_items);

                    return {
                      id: inclusion.id,
                      sub_item: {
                        id: inclusionSubItem.id,
                        name_ar: inclusionSubItem.name_ar,
                        name_table: inclusionSubItem.name_table,
                        unit_ar: inclusionSubItem.unit_ar,
                      },
                    };
                  })
              : [];

            const rawUnitPrice =
              typeof itemRecord.unit_price === "number"
                ? itemRecord.unit_price
                : typeof subItem.unit_price === "number"
                  ? subItem.unit_price
                  : 0;

            return {
              ...itemRecord,
              quantity:
                typeof itemRecord.quantity === "number" ? itemRecord.quantity : 0,
              unit_price: rawUnitPrice,
              sub_item: {
                id: subItem.id,
                name_ar: subItem.name_ar,
                name_table: subItem.name_table,
                unit_ar: subItem.unit_ar,
                unit_price: subItem.unit_price,
              },
              cause: Object.keys(cause).length ? cause : null,
              spec: Object.keys(spec).length ? spec : null,
              inclusions,
            };
          })
        : [];

      const photos = Array.isArray(issueRecord.issue_photos)
        ? issueRecord.issue_photos
        : [];

      return {
        id: issueRecord.id,
        report_id: issueRecord.report_id,
        issue_type: issueRecord.issue_type,
        notes: issueRecord.notes,
        main_item: {
          id: mainItem.id,
          name_ar: mainItem.name_ar,
        },
        items,
        photos,
      };
    });

    const reportRecord = toRecord(report);

    return res.status(200).json({
      report: {
        ...reportRecord,
        mosques: toRecord(reportRecord.mosques),
      },
      issues: finalIssues,
    });
  } catch (error: unknown) {
    console.error("GET /api/reports/[rq_number] error", error);
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return res.status(500).json({ error: message });
  }
}
