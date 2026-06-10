// html2pdf.js is a browser-only library that references window/self.
// To keep Next.js SSR builds working, load it dynamically on the client.
import type { Report } from "@/types";
import type { jsPDF } from "jspdf";
import ArabicReshaper from "arabic-reshaper";
import * as bidiJS from "bidi-js";

// Match the CSS .page size in ReportTemplate (approx A4 landscape at 96dpi)
const PAGE_WIDTH = 1123;
const PAGE_HEIGHT = 794;
const COST_ROWS_PER_PAGE = 10;
const SPEC_ROWS_PER_PAGE = 7;
const PDF_ARABIC_FONT_FILE = "NeoSansArabicMedium.ttf";
const PDF_ARABIC_FONT_NAME = "NeoSansArabicPdf";
const PAGE_BG_RGB: [number, number, number] = [243, 247, 238];
const PAGE_BORDER_RGB: [number, number, number] = [224, 231, 228];
const HEADER_LINE_RGB: [number, number, number] = [45, 111, 95];
const FOOTER_LINE_RGB: [number, number, number] = [31, 45, 42];

const BRAND_LINE_LEFT = 64;
const BRAND_LINE_RIGHT = PAGE_WIDTH - 64;
const TOP_LINE_Y = 78;
const BOTTOM_LINE_Y = PAGE_HEIGHT - 88;
const CONTENT_LEFT = 32;
const CONTENT_RIGHT = PAGE_WIDTH - 32;
const CONTENT_TOP = 105;
const CONTENT_BOTTOM_MARGIN = 110;

type PdfGenerationOptions = {
  report?: Report;
  reportDate?: string;
  hybridTables?: boolean;
  hideCostDetails?: boolean;
};

type CostRow = {
  no: number;
  item: string;
  qty: number;
  unit: string;
  unit_price: string;
  total: string;
  isOperational?: boolean;
};

type SpecRow = {
  no: number;
  sub_item: string;
  spec: string;
  cause: string;
};

type Html2PdfOptions = {
  margin: number;
  filename?: string;
  image: { type: "jpeg"; quality: number };
  html2canvas: {
    scale: number;
    useCORS: boolean;
    logging: boolean;
    letterRendering: boolean;
  };
  jsPDF: {
    unit: "px";
    format: [number, number];
    orientation: "landscape";
  };
  pagebreak: { mode: string; after?: string };
};

type Html2PdfInstance = {
  set: (options: Html2PdfOptions) => Html2PdfInstance;
  from: (element: HTMLElement) => Html2PdfInstance;
  save: () => Promise<void>;
  toPdf: () => Html2PdfInstance;
  get: (type: "pdf") => Promise<jsPDF>;
};

type Html2PdfFactory = () => Html2PdfInstance;

async function loadHtml2Pdf(): Promise<Html2PdfFactory> {
  if (typeof window === "undefined") {
    throw new Error("html2pdf is only available in the browser");
  }

  const mod = (await import("html2pdf.js")) as {
    default?: Html2PdfFactory;
  } & Partial<Html2PdfFactory>;

  return (mod.default ?? (mod as unknown as Html2PdfFactory));
}

async function ensureFontsReady() {
  if (typeof document === "undefined") return;

  const doc = document as Document & { fonts?: { ready?: Promise<unknown> } };
  const fontsReady = doc.fonts?.ready;

  if (fontsReady && typeof fontsReady.then === "function") {
    await fontsReady;
  }
}

const chunkRows = <T,>(rows: T[], size: number): T[][] => {
  const chunks: T[][] = [];

  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }

  return chunks;
};

const getTableTitle = (baseTitle: string, pageIndex: number) =>
  pageIndex === 0 ? baseTitle : `استكمال ${baseTitle}`;

const configureArabicPdf = (pdf: jsPDF) => {
  pdf.setFont(PDF_ARABIC_FONT_NAME, "normal");
};

const formatPdfText = (value: string) => {
  const reshaped = ArabicReshaper.convertArabic(value);
  const getReorderedString = (bidiJS as { getReorderedString?: (text: string) => string })
    .getReorderedString;

  return getReorderedString ? getReorderedString(reshaped) : reshaped;
};

const createPdfSourceElement = (
  elementRef: HTMLElement,
  removeHtmlTables: boolean
): { sourceElement: HTMLElement; cleanup: () => void } => {
  if (!removeHtmlTables || typeof document === "undefined") {
    return { sourceElement: elementRef, cleanup: () => undefined };
  }

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-20000px";
  host.style.top = "0";
  host.style.width = `${PAGE_WIDTH}px`;
  host.style.opacity = "0";
  host.style.pointerEvents = "none";

  const clone = elementRef.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[data-pdf-table-page="true"]').forEach((node) => {
    node.remove();
  });

  host.appendChild(clone);
  document.body.appendChild(host);

  return {
    sourceElement: clone,
    cleanup: () => {
      host.remove();
    },
  };
};

const buildReportTableData = (report: Report) => {
  const issues = report.report_issues || [];
  const tableRows: CostRow[] = [];
  const specRows: SpecRow[] = [];

  let itemNumber = 1;
  let itemsTotal = 0;
  const opExpenseRate = 0.1;

  issues.forEach((issue) => {
    (issue.issue_items || []).forEach((item) => {
      const quantity = item.quantity || 0;
      const unitPrice =
        typeof item.unit_price === "number" && !Number.isNaN(item.unit_price)
          ? item.unit_price
          : item.sub_items?.unit_price || 0;

      const itemTotal = quantity * unitPrice;
      itemsTotal += itemTotal;

      const itemName =
        item.sub_items?.name_table ??
        item.sub_items?.name_ar ??
        "غير محدد";

      tableRows.push({
        no: itemNumber,
        item: formatPdfText(itemName),
        qty: quantity,
        unit: formatPdfText(item.sub_items?.unit_ar || "غير محدد"),
        unit_price: unitPrice.toFixed(2),
        total: itemTotal.toFixed(2),
      });

      specRows.push({
        no: itemNumber,
        sub_item: formatPdfText(item.sub_items?.name_ar || "غير محدد"),
        cause: formatPdfText(item.causes?.name_ar || "لا يوجد"),
        spec: formatPdfText(item.specs?.name || "لا يوجد"),
      });

      itemNumber++;
    });
  });

  const operationalExpense = itemsTotal * opExpenseRate;
  const grandTotal = itemsTotal + operationalExpense;

  tableRows.push({
    no: itemNumber,
    item: formatPdfText("10% "+"مصروفات تشغيلية بنسبة"),
    qty: 1,
    unit: formatPdfText("عملية"),
    unit_price: operationalExpense.toFixed(2),
    total: operationalExpense.toFixed(2),
    isOperational: true,
  });

  return { tableRows, specRows, grandTotal };
};

let arabicFontBase64: string | null = null;
let yaamurLogoDataUrl: string | null = null;
let ministryLogoDataUrl: string | null = null;

const ensurePdfArabicFont = async (pdf: jsPDF) => {
  if (!arabicFontBase64) {
    const response = await fetch(`/fonts/${PDF_ARABIC_FONT_FILE}`);
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";

    for (let index = 0; index < bytes.length; index++) {
      binary += String.fromCharCode(bytes[index]);
    }

    arabicFontBase64 = btoa(binary);
  }

  try {
    pdf.addFileToVFS(PDF_ARABIC_FONT_FILE, arabicFontBase64);
    pdf.addFont(PDF_ARABIC_FONT_FILE, PDF_ARABIC_FONT_NAME, "normal");
  } catch {
    // Font can already exist in VFS for this instance.
  }

  pdf.setFont(PDF_ARABIC_FONT_NAME, "normal");
};

const captureTemplatePageBackground = async (
  elementRef: HTMLElement
): Promise<string | null> => {
  if (typeof document === "undefined") return null;

  const basePage = elementRef.querySelector(".page") as HTMLElement | null;
  if (!basePage) return null;

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-20000px";
  host.style.top = "0";
  host.style.width = `${PAGE_WIDTH}px`;
  host.style.height = `${PAGE_HEIGHT}px`;
  host.style.opacity = "0";
  host.style.pointerEvents = "none";

  const pageClone = basePage.cloneNode(true) as HTMLElement;
  pageClone.style.width = `${PAGE_WIDTH}px`;
  pageClone.style.height = `${PAGE_HEIGHT}px`;

  const contentNode = pageClone.querySelector(".content") as HTMLElement | null;
  if (contentNode) {
    contentNode.innerHTML = "";
  }

  host.appendChild(pageClone);
  document.body.appendChild(host);

  try {
    const html2canvasModule = await import("html2canvas");
    const html2canvas = html2canvasModule.default;
    const canvas = await html2canvas(pageClone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#f3f7ee",
    });

    return canvas.toDataURL("image/jpeg", 1);
  } catch {
    return null;
  } finally {
    host.remove();
  }
};

const captureFullPageImage = async (
  pageElement: HTMLElement
): Promise<string | null> => {
  if (typeof document === "undefined") return null;

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-20000px";
  host.style.top = "0";
  host.style.width = `${PAGE_WIDTH}px`;
  host.style.height = `${PAGE_HEIGHT}px`;
  host.style.opacity = "0";
  host.style.pointerEvents = "none";

  const pageClone = pageElement.cloneNode(true) as HTMLElement;
  pageClone.style.width = `${PAGE_WIDTH}px`;
  pageClone.style.height = `${PAGE_HEIGHT}px`;

  host.appendChild(pageClone);
  document.body.appendChild(host);

  try {
    const html2canvasModule = await import("html2canvas");
    const html2canvas = html2canvasModule.default;
    const canvas = await html2canvas(pageClone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#f3f7ee",
    });

    return canvas.toDataURL("image/jpeg", 1);
  } catch {
    return null;
  } finally {
    host.remove();
  }
};

const loadSvgAsPngDataUrl = async (
  src: string,
  width: number,
  height: number
): Promise<string | null> => {
  if (typeof document === "undefined") return null;

  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.crossOrigin = "anonymous";

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        resolve(null);
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png"));
    };

    image.onerror = () => resolve(null);
    image.src = src;
  });
};

const ensureBrandAssets = async () => {
  if (!yaamurLogoDataUrl) {
    yaamurLogoDataUrl = await loadSvgAsPngDataUrl("/logo/logo-topline.svg", 300, 34);
  }

  if (!ministryLogoDataUrl) {
    ministryLogoDataUrl = await loadSvgAsPngDataUrl(
      "/logo/Ministry_of_islamic_affairs_in_saudi_arabia_Logo.svg",
      80,
      80
    );
  }
};

const drawHybridPageBrandFrame = (pdf: jsPDF, reportDate?: string) => {
  configureArabicPdf(pdf);

  pdf.setFillColor(...PAGE_BG_RGB);
  pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");

  pdf.setDrawColor(...PAGE_BORDER_RGB);
  pdf.setLineWidth(1);
  pdf.rect(0.5, 0.5, PAGE_WIDTH - 1, PAGE_HEIGHT - 1);

  pdf.setDrawColor(...HEADER_LINE_RGB);
  pdf.setLineWidth(2);
  pdf.line(BRAND_LINE_LEFT, TOP_LINE_Y, BRAND_LINE_RIGHT, TOP_LINE_Y);

  if (yaamurLogoDataUrl) {
    pdf.addImage(yaamurLogoDataUrl, "PNG", 742, 38, 300, 34, undefined, "FAST");
  }

  if (ministryLogoDataUrl) {
    pdf.addImage(ministryLogoDataUrl, "PNG", 190, 4, 80, 80, undefined, "FAST");
  }

  pdf.setDrawColor(...FOOTER_LINE_RGB);
  pdf.setLineWidth(2);
  pdf.line(BRAND_LINE_LEFT, BOTTOM_LINE_Y, BRAND_LINE_RIGHT, BOTTOM_LINE_Y);

  pdf.setTextColor(14, 77, 59);
  pdf.setFontSize(13);
  const dateText = reportDate ? `تاريخ إعداد التقرير: ${reportDate}` : "تاريخ إعداد التقرير";
  pdf.text(dateText, PAGE_WIDTH - 64, PAGE_HEIGHT - 102, {
    align: "right",
  });

  pdf.setTextColor(0, 91, 54);
  pdf.setFontSize(10);
  pdf.text("Yaamur_org", 500, PAGE_HEIGHT - 36, { align: "center" });
  pdf.text("https://yaamur.org.sa", 625, PAGE_HEIGHT - 36, { align: "center" });
  pdf.text("info@yaamur.org.sa", 770, PAGE_HEIGHT - 36, { align: "center" });
  pdf.text("https://store.yaamur.org.sa", 930, PAGE_HEIGHT - 36, { align: "center" });

  pdf.setFontSize(9);
  pdf.text(
    "جمعية متخصصة في تلبية احتياج المساجد في البناء-الصيانة-التشغيل-العناية-السقيا وجميع مايخدم بيوت الله",
    260,
    PAGE_HEIGHT - 44,
    { align: "left" }
  );

  pdf.setTextColor(31, 45, 42);
};

const appendProgrammaticTables = async (
  pdf: jsPDF,
  elementRef: HTMLElement,
  report: Report,
  reportDate?: string,
  insertBeforePage?: number,
  hideCostDetails: boolean = false
) => {
  await ensurePdfArabicFont(pdf);
  configureArabicPdf(pdf);
  const templatePageBackground = await captureTemplatePageBackground(elementRef);

  if (!templatePageBackground) {
    await ensureBrandAssets();
  }

  const autoTableModule = await import("jspdf-autotable");
  const autoTable = autoTableModule.default as (
    doc: jsPDF,
    options: Record<string, unknown>
  ) => void;

  const { tableRows, specRows, grandTotal } = buildReportTableData(report);
  const visibleCostRows = hideCostDetails
    ? tableRows.filter((row) => !row.isOperational)
    : tableRows;
  const costTableBaseTitle = hideCostDetails ? "جدول الكميات" : "جدول التكلفة";
  const costPages = chunkRows(visibleCostRows, COST_ROWS_PER_PAGE);
  if (costPages.length === 0) {
    costPages.push([]);
  }
  const specPages = chunkRows(specRows, SPEC_ROWS_PER_PAGE);

  const baseStyles = {
    font: PDF_ARABIC_FONT_NAME,
    valign: "middle",
    textColor: [31, 45, 42],
    lineColor: [45, 111, 95],
    lineWidth: 0.4,
  };

  const costStyles = {
    ...baseStyles,
    fontSize: 16,
    halign: "center",
    minCellHeight: 38,
    cellPadding: { top: 8, right: 10, bottom: 8, left: 10 },
  };

  const specsStyles = {
    ...baseStyles,
    fontSize: 16,
    halign: "center",
    minCellHeight: 38,
    cellPadding: { top: 8, right: 10, bottom: 8, left: 10 },
  };

  const costColumnStyles = hideCostDetails
    ? {
        0: { cellWidth: 180, halign: "center" },
        1: { cellWidth: 180, halign: "center" },
        2: { cellWidth: 699, halign: "center" },
      }
    : {
        0: { cellWidth: 205, halign: "center" },
        1: { cellWidth: 195, halign: "center" },
        2: { cellWidth: 90, halign: "center" },
        3: { cellWidth: 90, halign: "center" },
        4: { cellWidth: 430, halign: "center" },
        5: { cellWidth: 49, halign: "center" },
      };

  const specsColumnStyles = {
    0: { cellWidth: 360, halign: "center" },
    1: { cellWidth: 250, halign: "center" },
    2: { cellWidth: 365, halign: "center" },
    3: { cellWidth: 84, halign: "center" },
  };

  costPages.forEach((rows, pageIndex) => {
    pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT], "landscape");
    pdf.setFont(PDF_ARABIC_FONT_NAME, "normal");

    if (templatePageBackground) {
      pdf.addImage(
        templatePageBackground,
        "JPEG",
        0,
        0,
        PAGE_WIDTH,
        PAGE_HEIGHT,
        undefined,
        "FAST"
      );
    } else {
      drawHybridPageBrandFrame(pdf, reportDate);
    }

    pdf.setTextColor(14, 77, 59);
    pdf.setFontSize(24);
    pdf.text(formatPdfText(getTableTitle(costTableBaseTitle, pageIndex)), PAGE_WIDTH / 2, 128, {
      align: "center",
    });

    const costBody: Array<Array<string | Record<string, unknown>>> = hideCostDetails
      ? rows.map((row) => [
          row.unit,
          String(row.qty),
          row.item,
        ])
      : rows.map((row) => {
          if (row.isOperational) {
            return [
              row.total,
              { content: row.item, colSpan: 4, styles: { halign: "center" } },
              String(row.no),
            ];
          }

          return [
            row.total,
            row.unit_price,
            row.unit,
            String(row.qty),
            row.item,
            String(row.no),
          ];
        });

    if (!hideCostDetails && pageIndex === costPages.length - 1) {
      costBody.push([
        grandTotal.toFixed(2),
        {
          content: "إجمالي التكلفة",
          colSpan: 5,
          styles: {
            halign: "center",
            fillColor: [217, 240, 224],
          },
        },
      ]);
    }

    autoTable(pdf, {
      startY: 146,
      theme: "grid",
      margin: {
        left: CONTENT_LEFT,
        right: PAGE_WIDTH - CONTENT_RIGHT,
        bottom: CONTENT_BOTTOM_MARGIN,
      },
      styles: costStyles,
      bodyStyles: {
        fillColor: [255, 255, 255],
      },
      alternateRowStyles: {
        fillColor: [243, 247, 238],
      },
      headStyles: {
        font: PDF_ARABIC_FONT_NAME,
        fontSize: 16,
        fillColor: [74, 140, 95],
        textColor: [255, 255, 255],
        fontStyle: "normal",
        halign: "center",
        valign: "middle",
        minCellHeight: 42,
      },
      columnStyles: costColumnStyles,
      head: hideCostDetails
        ? [["الوحدة", "العدد", "البند"]]
        : [["التكلفة الإجمالية بالريال", "التكلفة الفردية بالريال", "الوحدة", "العدد", "البند", "م"]],
      body: costBody,
    });
  });

  specPages.forEach((rows, pageIndex) => {
    pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT], "landscape");
    pdf.setFont(PDF_ARABIC_FONT_NAME, "normal");

    if (templatePageBackground) {
      pdf.addImage(
        templatePageBackground,
        "JPEG",
        0,
        0,
        PAGE_WIDTH,
        PAGE_HEIGHT,
        undefined,
        "FAST"
      );
    } else {
      drawHybridPageBrandFrame(pdf, reportDate);
    }

    pdf.setTextColor(14, 77, 59);
    pdf.setFontSize(24);
    pdf.text(formatPdfText(getTableTitle("جدول المواصفات", pageIndex)), PAGE_WIDTH / 2, 128, {
      align: "center",
    });

    const specBody = rows.map((row) => [
      row.spec,
      row.cause,
      row.sub_item,
      String(row.no),
    ]);

    autoTable(pdf, {
      startY: 146,
      theme: "grid",
      margin: {
        left: CONTENT_LEFT,
        right: PAGE_WIDTH - CONTENT_RIGHT,
        bottom: CONTENT_BOTTOM_MARGIN,
      },
      styles: specsStyles,
      bodyStyles: {
        fillColor: [255, 255, 255],
        halign: "center",
      },
      alternateRowStyles: {
        fillColor: [243, 247, 238],
      },
      headStyles: {
        font: PDF_ARABIC_FONT_NAME,
        fontSize: 16,
        fillColor: [74, 140, 95],
        textColor: [255, 255, 255],
        fontStyle: "normal",
        halign: "center",
        valign: "middle",
        minCellHeight: 42,
      },
      columnStyles: specsColumnStyles,
      head: [["المواصفات", "المسبب", "البند الفرعي", "رقم البند"]],
      body: specBody,
    });
  });

  const insertedTablePages = costPages.length + specPages.length;
  const pdfWithMove = pdf as jsPDF & {
    movePage?: (targetPage: number, beforePage: number) => void;
  };

  if (
    insertedTablePages > 0 &&
    insertBeforePage &&
    insertBeforePage > 0 &&
    typeof pdfWithMove.movePage === "function"
  ) {
    const totalPagesAfterInsert = pdf.getNumberOfPages();
    const firstInsertedPage = totalPagesAfterInsert - insertedTablePages + 1;

    for (let movedCount = 0; movedCount < insertedTablePages; movedCount++) {
      pdfWithMove.movePage(
        firstInsertedPage + movedCount,
        insertBeforePage + movedCount
      );
    }
  }
};

export const generatePdfFromHtml = async (
  elementRef: HTMLElement,
  fileName: string = "report.pdf",
  options?: PdfGenerationOptions
): Promise<void> => {
  const html2pdf = await loadHtml2Pdf();
  await ensureFontsReady();

  const useHybridTables = Boolean(options?.hybridTables && options?.report);
  const thanksNodeForCapture = elementRef.querySelector(".thanks-page") as HTMLElement | null;
  const thanksPageImage = useHybridTables && thanksNodeForCapture
    ? await captureFullPageImage(thanksNodeForCapture)
    : null;
  const { sourceElement, cleanup } = createPdfSourceElement(
    elementRef,
    useHybridTables
  );

  if (useHybridTables) {
    const thanksNodeInSource = sourceElement.querySelector(".thanks-page")?.closest(".page");
    if (thanksNodeInSource) {
      thanksNodeInSource.remove();
    }
  }

  const pageNodes = Array.from(sourceElement.querySelectorAll(".page"));
  const firstTermsNode = sourceElement
    .querySelector(".terms-wrap")
    ?.closest(".page");
  const insertTablesBeforePage = firstTermsNode
    ? pageNodes.indexOf(firstTermsNode) + 1
    : undefined;

  const opt: Html2PdfOptions = {
    margin: 0,
    filename: fileName,
    image: { type: "jpeg", quality: 1 },
    html2canvas: {
      // 2x is usually enough quality and keeps file size reasonable
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: false,
    },
    jsPDF: {
      unit: "px",
      format: [PAGE_WIDTH, PAGE_HEIGHT],
      orientation: "landscape",
    },
    pagebreak: { mode: "css", after: ".pdf-page" },
  };

  try {
    const worker = html2pdf().set(opt).from(sourceElement).toPdf();
    const pdf = await worker.get("pdf");

    configureArabicPdf(pdf);

    if (useHybridTables && options?.report) {
      await appendProgrammaticTables(
        pdf,
        elementRef,
        options.report,
        options.reportDate,
        insertTablesBeforePage,
        Boolean(options.hideCostDetails)
      );
    }

    if (thanksPageImage) {
      pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT], "landscape");
      pdf.addImage(
        thanksPageImage,
        "JPEG",
        0,
        0,
        PAGE_WIDTH,
        PAGE_HEIGHT,
        undefined,
        "FAST"
      );
    }

    pdf.save(fileName);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  } finally {
    cleanup();
  }
};

export const generatePdfBlob = async (
  elementRef: HTMLElement,
  options?: PdfGenerationOptions
): Promise<Blob> => {
  const html2pdf = await loadHtml2Pdf();
  await ensureFontsReady();

  const useHybridTables = Boolean(options?.hybridTables && options?.report);
  const thanksNodeForCapture = elementRef.querySelector(".thanks-page") as HTMLElement | null;
  const thanksPageImage = useHybridTables && thanksNodeForCapture
    ? await captureFullPageImage(thanksNodeForCapture)
    : null;
  const { sourceElement, cleanup } = createPdfSourceElement(
    elementRef,
    useHybridTables
  );

  if (useHybridTables) {
    const thanksNodeInSource = sourceElement.querySelector(".thanks-page")?.closest(".page");
    if (thanksNodeInSource) {
      thanksNodeInSource.remove();
    }
  }

  const pageNodes = Array.from(sourceElement.querySelectorAll(".page"));
  const firstTermsNode = sourceElement
    .querySelector(".terms-wrap")
    ?.closest(".page");
  const insertTablesBeforePage = firstTermsNode
    ? pageNodes.indexOf(firstTermsNode) + 1
    : undefined;

  const opt: Html2PdfOptions = {
    margin: 0,
    image: { type: "jpeg", quality: 1 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: false,
    },
    jsPDF: {
      unit: "px",
      format: [PAGE_WIDTH, PAGE_HEIGHT],
      orientation: "landscape",
    },
    pagebreak: { mode: "css", after: ".pdf-page" },
  };

  try {
    const pdf = await html2pdf().set(opt).from(sourceElement).toPdf().get("pdf");

    configureArabicPdf(pdf);

    if (useHybridTables && options?.report) {
      await appendProgrammaticTables(
        pdf,
        elementRef,
        options.report,
        options.reportDate,
        insertTablesBeforePage,
        Boolean(options.hideCostDetails)
      );
    }

    if (thanksPageImage) {
      pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT], "landscape");
      pdf.addImage(
        thanksPageImage,
        "JPEG",
        0,
        0,
        PAGE_WIDTH,
        PAGE_HEIGHT,
        undefined,
        "FAST"
      );
    }

    return pdf.output("blob") as Blob;
  } catch (error) {
    console.error("Error generating PDF blob:", error);
    throw error;
  } finally {
    cleanup();
  }
};
