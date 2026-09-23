import path from "node:path";
import { formatUpdatedDate, loadAllCv, loadSite, type Locale } from "../src/lib/content.ts";
import { inspectPdf } from "./pdf-inspect.ts";
import { dist, pdfFiles } from "./pdf-renderer.ts";

const site = loadSite();
const all = loadAllCv();

for (const [locale, fileName] of Object.entries(pdfFiles) as [Locale, string][]) {
  const { numPages, text: normalizedText, linkTargets } = await inspectPdf(path.join(dist, "downloads", fileName));
  if (numPages > 2) throw new Error(`${fileName} has ${numPages} pages; expected at most 2`);

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
  if (linkTargets.some((target) => target.startsWith("tel:"))) throw new Error(`${fileName} contains a telephone link`);

  console.log(`✓ ${fileName}: ${numPages} page(s), content and privacy checks passed`);
}
