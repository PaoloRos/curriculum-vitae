import fs from "node:fs";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { formatUpdatedDate, loadAllCv, loadSite, type Locale } from "../src/lib/content.ts";

const site = loadSite();
const all = loadAllCv();
const files: Record<Locale, string> = {
  it: "Paolo-Rossi-CV-it.pdf",
  en: "Paolo-Rossi-CV-en.pdf",
  de: "Paolo-Rossi-CV-de.pdf"
};

for (const [locale, fileName] of Object.entries(files) as [Locale, string][]) {
  const file = path.join(process.cwd(), "dist", "downloads", fileName);
  const bytes = new Uint8Array(fs.readFileSync(file));
  const pdf = await getDocument({ data: bytes }).promise;
  if (pdf.numPages > 2) throw new Error(`${fileName} has ${pdf.numPages} pages; expected at most 2`);

  let text = "";
  const linkTargets: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    text += ` ${content.items.map((item) => "str" in item ? item.str : "").join(" ")}`;
    const annotations = await page.getAnnotations();
    for (const annotation of annotations) {
      if (typeof annotation.url === "string") linkTargets.push(annotation.url);
    }
  }

  const normalizedText = text.replace(/\s+/g, " ").replace(/\s+([.,;:!?])/g, "$1").trim();
  const expectedDate = formatUpdatedDate(site.last_updated, locale);
  const expectedMoreInfo = all[locale].labels.more_info.replace("{link}", all[locale].labels.site_link);
  if (!normalizedText.includes(site.name)) throw new Error(`${fileName} does not contain the name`);
  if (!normalizedText.includes(expectedDate)) throw new Error(`${fileName} does not contain the last-update date`);
  if (!normalizedText.includes(expectedMoreInfo)) throw new Error(`${fileName} does not display the localized site invitation`);
  const expectedSiteUrl = new URL(site.site_url).href;
  if (!linkTargets.some((target) => new URL(target).href === expectedSiteUrl)) {
    throw new Error(`${fileName} does not contain a clickable site link`);
  }
  if (!normalizedText.includes(site.github_username)) throw new Error(`${fileName} does not display the GitHub username`);
  const expectedGithubUrl = new URL(site.github_url).href;
  if (!linkTargets.some((target) => new URL(target).href === expectedGithubUrl)) {
    throw new Error(`${fileName} does not contain a clickable GitHub link`);
  }
  if (normalizedText.includes(all[locale].labels.annexes_intro)) throw new Error(`${fileName} unexpectedly contains annex content`);
  if (/\+\d[\d .()-]{7,}\d/.test(normalizedText)) throw new Error(`${fileName} contains a phone-like value`);

  console.log(`✓ ${fileName}: ${pdf.numPages} page(s), content and privacy checks passed`);
}
