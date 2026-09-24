import fs from "node:fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export interface PdfSummary {
  numPages: number;
  /** Extracted text with collapsed whitespace. */
  text: string;
  /** Targets of the link annotations (http, mailto, tel…). */
  linkTargets: string[];
}

export async function inspectPdf(file: string): Promise<PdfSummary> {
  const loadingTask = getDocument({ data: new Uint8Array(fs.readFileSync(file)) });
  const pdf = await loadingTask.promise;
  let text = "";
  const linkTargets: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    text += ` ${content.items.map((item) => "str" in item ? item.str : "").join(" ")}`;
    for (const annotation of await page.getAnnotations()) {
      const target = annotation.url ?? annotation.unsafeUrl;
      if (typeof target === "string") linkTargets.push(target);
    }
  }
  const normalizedText = text.replace(/\s+/g, " ").replace(/\s+([.,;:!?])/g, "$1").trim();
  const summary = { numPages: pdf.numPages, text: normalizedText, linkTargets };
  await loadingTask.destroy();
  return summary;
}
