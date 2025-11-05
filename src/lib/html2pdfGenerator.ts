
import html2pdf from "html2pdf.js";
import { Report } from "@/types";

export const generatePdfFromHtml = async (
  elementRef: HTMLElement,
  fileName: string = "report.pdf"
): Promise<void> => {
  const opt = {
    margin: 0,
    filename: fileName,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { 
      scale: 2,
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
  const opt = {
    margin: 0,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { 
      scale: 2,
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
