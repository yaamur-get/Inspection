// html2pdf.js is a browser-only library that references window/self.
// To keep Next.js SSR builds working, load it dynamically on the client.

// Match the CSS .page size in ReportTemplate (approx A4 landscape at 96dpi)
const PAGE_WIDTH = 1123;
const PAGE_HEIGHT = 794;

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
  get: (type: "pdf") => Promise<{ output: (type: "blob") => Blob }>;
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

export const generatePdfFromHtml = async (
  elementRef: HTMLElement,
  fileName: string = "report.pdf"
): Promise<void> => {
  const html2pdf = await loadHtml2Pdf();
  await ensureFontsReady();

  const opt: Html2PdfOptions = {
    margin: 0,
    filename: fileName,
    image: { type: "jpeg", quality: 1 },
    html2canvas: {
      // 2x is usually enough quality and keeps file size reasonable
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
    },
    jsPDF: {
      unit: "px",
      format: [PAGE_WIDTH, PAGE_HEIGHT],
      orientation: "landscape",
    },
    pagebreak: { mode: "css", after: ".pdf-page" },
  };

  try {
    await html2pdf().set(opt).from(elementRef).save();
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

export const generatePdfBlob = async (elementRef: HTMLElement): Promise<Blob> => {
  const html2pdf = await loadHtml2Pdf();
  await ensureFontsReady();

  const opt: Html2PdfOptions = {
    margin: 0,
    image: { type: "jpeg", quality: 1 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
    },
    jsPDF: {
      unit: "px",
      format: [PAGE_WIDTH, PAGE_HEIGHT],
      orientation: "landscape",
    },
    pagebreak: { mode: "css", after: ".pdf-page" },
  };

  try {
    const pdf = await html2pdf().set(opt).from(elementRef).toPdf().get("pdf");
    return pdf.output("blob");
  } catch (error) {
    console.error("Error generating PDF blob:", error);
    throw error;
  }
};
