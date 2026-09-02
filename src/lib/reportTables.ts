import type { Issue, IssueItem, IssuePhoto, Report } from "@/types";

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

/**
 * وصف البند الفرعي في صفحات الصور: اسم البند ثم المسبب إن وُجد.
 * المسبب الغائب يُحذف تماماً ولا يُستبدل بنص بديل، كما في خلايا جدول المواصفات.
 */
export const subItemCaption = (
  item: IssueItem | undefined,
  fallbackName = ""
) =>
  [item?.sub_items?.name_ar || fallbackName, item?.causes?.name_ar || ""]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(" ");

/** البند المؤرشف يبقى محفوظاً في قاعدة البيانات ولا يظهر في أي مخرج للمتبرع */
export const isItemArchived = (item: IssueItem | undefined) =>
  !!item?.archived_at;

/** المشكلة مؤرشفة بكاملها: لا بند فيها يدخل التقرير، فصفحة صورها لا تُطبع */
export const isIssueFullyArchived = (issue: Issue) => {
  const items = issue.issue_items || [];
  return items.length > 0 && items.every((item) => isItemArchived(item));
};

/**
 * القراءة من القاعدة لا تضمن ترتيباً، وترتيب البنود والصور هو ما يحدد أي صورة
 * تقابل أي بند في حالة 2. فالترتيب بوقت الإنشاء ثم المعرّف ليثبت في كل الواجهات.
 */
export const orderedIssueItems = (issue: Issue) =>
  [...(issue.issue_items || [])].sort(
    (a, b) =>
      (a.created_at || "").localeCompare(b.created_at || "") ||
      a.id.localeCompare(b.id)
  );

/** بنود المشكلة الداخلة في التقرير */
export const activeIssueItems = (issue: Issue) =>
  orderedIssueItems(issue).filter((item) => !isItemArchived(item));

export const orderedIssuePhotos = (issue: Issue) =>
  [...(issue.issue_photos || [])].sort(
    (a, b) => (a.photo_order || 0) - (b.photo_order || 0)
  );

/**
 * صور حالة 2 مقرونة ببنودها: الصورة رقم ن تقابل البند رقم ن، لأن issue_photos
 * غير مرتبطة بالبنود في القاعدة. المقابلة تسبق إسقاط المؤرشف عمداً — لو أسقطنا
 * البنود أولاً انزلقت الصور على من بعدها وظهرت صورة بند تحت اسم بند آخر.
 */
export const activeItemPhotoPairs = (
  issue: Issue
): Array<{ item: IssueItem; photo: IssuePhoto }> => {
  const photos = orderedIssuePhotos(issue);

  return orderedIssueItems(issue)
    .map((item, index) => ({ item, photo: photos[index] }))
    .filter(
      (pair): pair is { item: IssueItem; photo: IssuePhoto } =>
        !!pair.photo && !isItemArchived(pair.item)
    );
};

/**
 * صور المشكلة التي لن تظهر في التقرير لأن بنودها مؤرشفة. تُعكس نفس قواعد
 * ReportTemplate: حالة 1 صورها الثلاث لبند واحد فأرشفته تُخرجها كلها،
 * وحالة 2 كل صورة لبندها فتخرج وحدها.
 */
export const archivedPhotoIds = (issue: Issue): Set<string> => {
  const photos = orderedIssuePhotos(issue);
  const items = orderedIssueItems(issue);

  if (issue.issue_type === "single") {
    return isItemArchived(items[0])
      ? new Set(photos.map((photo) => photo.id))
      : new Set();
  }

  return new Set(
    photos
      .filter((_, index) => isItemArchived(items[index]))
      .map((photo) => photo.id)
  );
};

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
    activeIssueItems(issue).forEach((item) => {
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
        cause: item.causes?.name_ar || "",
        spec: item.specs?.name || "",
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
