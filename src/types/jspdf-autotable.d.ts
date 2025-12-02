
declare module "jspdf-autotable" {
  import type { jsPDF } from "jspdf";

  // Minimal option shape; library accepts many fields so allow an index signature
  interface AutoTableOptions {
    [key: string]: unknown;
  }

  const autoTable: (doc: jsPDF, options: AutoTableOptions) => void;
  export default autoTable;
}
