import type { IssueItem, Report } from "@/types";

/** صف في جدول التكلفة/الكميات */
export type CostRowData = {
  no: number;
  item: string;
  /** بنود فرعية متضمّنة تُعرض داخل نفس خلية البند بدون تسعير مستقل */
  inclusions: string[];
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  isOperational?: boolean;
};

/** صف في جدول المواصفات */
export type SpecRowData = {
  no: number;
  sub_item: string;
  inclusions: string[];
  cause: string;
  spec: string;
};

export const COST_ROWS_PER_PAGE = 10;
export const SPEC_ROWS_PER_PAGE = 7;

/** كل سطر متضمّن يزن نصف صف عادي، حتى لا تتجاوز الصفحة حدودها عند تضمين بنود كثيرة */
const INCLUSION_ROW_WEIGHT = 0.5;

const OPERATIONAL_EXPENSE_RATE = 0.1;
const OPERATIONAL_EXPENSE_MIN = 2000;
const OPERATIONAL_EXPENSE_MAX = 20000;

const pickName = (
  nameTable: string | null | undefined,
  nameAr: string | null | undefined
) => (nameTable && nameTable.trim() ? nameTable : nameAr || "");

const inclusionNames = (item: IssueItem, preferTableName: boolean) =>
  [...(item.inclusions || [])]
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((inclusion) =>
      preferTableName
        ? pickName(inclusion.sub_items?.name_table, inclusion.sub_items?.name_ar)
        : inclusion.sub_items?.name_ar || ""
    )
    .filter((name) => name.trim().length > 0);

/** خيارات بناء الجداول */
export type BuildReportTableRowsOptions = {
  /**
   * يُلغي المصروفات التشغيلية كلياً: تصبح صفراً ولا تدخل في الإجمالي.
   * يُستخدم مع الجهات التي لا تقبل احتساب نسبة تشغيلية على المشروع.
   */
  hideOperationalExpense?: boolean;
};

/**
 * يبني صفوف جدولي التكلفة والمواصفات من بنود التقرير.
 * صف المصروفات التشغيلية يُضاف من كل واجهة عرض على حدة (اختلاف الصياغة بين HTML و PDF).
 */
export const buildReportTableRows = (
  report: Report,
  { hideOperationalExpense = false }: BuildReportTableRowsOptions = {}
) => {
  const issues = report.report_issues || [];
  const itemRows: CostRowData[] = [];
  const specRows: SpecRowData[] = [];
  let itemsTotal = 0;
  let itemNumber = 1;

  issues.forEach((issue) => {
    (issue.issue_items || []).forEach((item) => {
      const quantity = item.quantity || 0;
      const unitPrice =
        typeof item.unit_price === "number" && !Number.isNaN(item.unit_price)
          ? item.unit_price
          : item.sub_items?.unit_price || 0;
      const itemTotal = quantity * unitPrice;
      itemsTotal += itemTotal;

      itemRows.push({
        no: itemNumber,
        item:
          item.sub_items?.name_table ?? item.sub_items?.name_ar ?? "غير محدد",
        inclusions: inclusionNames(item, true),
        qty: quantity,
        unit: item.sub_items?.unit_ar || "غير محدد",
        unitPrice,
        total: itemTotal,
      });

      specRows.push({
        no: itemNumber,
        sub_item: item.sub_items?.name_ar || "غير محدد",
        inclusions: inclusionNames(item, false),
        cause: item.causes?.name_ar || "لا يوجد",
        spec: item.specs?.name || "لا يوجد",
      });

      itemNumber++;
    });
  });

  const operationalExpense = hideOperationalExpense
    ? 0
    : Math.min(
        Math.max(itemsTotal * OPERATIONAL_EXPENSE_RATE, OPERATIONAL_EXPENSE_MIN),
        OPERATIONAL_EXPENSE_MAX
      );

  return {
    itemRows,
    specRows,
    itemsTotal,
    operationalExpense,
    grandTotal: itemsTotal + operationalExpense,
    nextRowNo: itemNumber,
  };
};

/**
 * يوزّع الصفوف على الصفحات حسب الوزن لا حسب العدد، لأن الصف الذي يحمل بنوداً
 * متضمّنة يكون أطول. تبقى المعاينة والـ PDF متطابقين لأنهما يستخدمان نفس الحساب.
 */
export const chunkRowsByWeight = <T extends { inclusions?: string[] }>(
  rows: T[],
  capacity: number
): T[][] => {
  const pages: T[][] = [];
  let currentPage: T[] = [];
  let currentWeight = 0;

  rows.forEach((row) => {
    const weight = Math.max(
      1 + (row.inclusions?.length || 0) * INCLUSION_ROW_WEIGHT,
      1
    );

    if (currentPage.length > 0 && currentWeight + weight > capacity) {
      pages.push(currentPage);
      currentPage = [];
      currentWeight = 0;
    }

    currentPage.push(row);
    currentWeight += weight;
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
};
