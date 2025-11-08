
// html2pdf.js is a browser-only library that references window/self.
// To keep Next.js SSR builds working, load it dynamically on the client.
import { Report } from "@/types";

async function loadHtml2Pdf() {
  if (typeof window === "undefined") {
    throw new Error("html2pdf is only available in the browser");
  }
  const mod: any = await import("html2pdf.js");
  return mod?.default ?? mod;
}

export const generatePdfFromHtml = async (
  elementRef: HTMLElement,
  fileName: string = "report.pdf"
): Promise<void> => {
  const html2pdf = await loadHtml2Pdf();
  // Ensure custom fonts are loaded before rendering
  if (typeof document !== "undefined") {
    try {
      const anyDoc: any = document as any;
      if (anyDoc.fonts && anyDoc.fonts.ready && typeof anyDoc.fonts.ready.then === "function") {
        await anyDoc.fonts.ready;
      }
    } catch {}
  }
  const opt = {
    margin: 0,
    filename: fileName,
    image: { type: "jpeg" as const, quality: 1 },
    html2canvas: { 
      scale: 4,
      useCORS: true,
      logging: false,
      letterRendering: true
    },
    jsPDF: { 
      unit: "mm", 
      format: "a4", 
      orientation: "landscape" as const
    },
    pagebreak: { mode: "css", after: ".pdf-page" }
  };

  try {
    await html2pdf().set(opt).from(elementRef).save();
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

export const generatePdfBlob = async (
  elementRef: HTMLElement
): Promise<Blob> => {
  const html2pdf = await loadHtml2Pdf();
  // Ensure custom fonts are loaded before rendering
  if (typeof document !== "undefined") {
    try {
      const anyDoc: any = document as any;
      if (anyDoc.fonts && anyDoc.fonts.ready && typeof anyDoc.fonts.ready.then === "function") {
        await anyDoc.fonts.ready;
      }
    } catch {}
  }
  const opt = {
    margin: 0,
    image: { type: "jpeg" as const, quality: 1 },
    html2canvas: { 
      scale: 4,
      useCORS: true,
      logging: false,
      letterRendering: true
    },
    jsPDF: { 
      unit: "mm", 
      format: "a4", 
      orientation: "landscape" as const
    },
    pagebreak: { mode: "css", after: ".pdf-page" }
  };

  try {
    const pdf = await html2pdf().set(opt).from(elementRef).toPdf().get("pdf");
    return pdf.output("blob");
  } catch (error) {
    console.error("Error generating PDF blob:", error);
    throw error;
  }
};
