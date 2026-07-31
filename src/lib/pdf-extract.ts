// Browser-only PDF text extraction using pdf.js.
export type PdfExtraction = {
  text: string;
  pageCount: number;
  scanned: boolean;
};

export async function extractPdfText(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<PdfExtraction> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;

  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) parts.push(pageText);
    onProgress?.(i, doc.numPages);
  }
  await doc.destroy();

  const text = parts.join("\n\n").trim();
  // A text PDF yields far more than a handful of characters per page.
  const scanned = text.length < Math.max(200, doc.numPages * 40);

  return { text, pageCount: doc.numPages, scanned };
}
