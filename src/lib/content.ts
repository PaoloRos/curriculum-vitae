import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";

export const locales = ["it", "en", "de"] as const;
export type Locale = (typeof locales)[number];

const labelsSchema = z.object({
  skip: z.string().min(1),
  cv: z.string().min(1),
  annexes: z.string().min(1),
  download_pdf: z.string().min(1),
  language: z.string().min(1),
  contents: z.string().min(1),
  profile: z.string().min(1),
  birth_year: z.string().min(1),
  location: z.string().min(1),
  nationality: z.string().min(1),
  mother_tongue: z.string().min(1),
  email: z.string().min(1),
  last_updated: z.string().includes("{date}"),
  more_info: z.string().includes("{link}"),
  site_link: z.string().min(1),
  back_to_cv: z.string().min(1),
  annex_link: z.string().includes("{number}"),
  annexes_intro: z.string().min(1)
});

const entrySchema = z.object({
  heading: z.string().min(1),
  meta: z.string().min(1).optional(),
  paragraphs: z.array(z.string().min(1)).optional(),
  bullets: z.array(z.string().min(1)).optional(),
  annex_ids: z.array(z.string().min(1)).optional()
}).refine((entry) => entry.paragraphs?.length || entry.bullets?.length, {
  message: "Each entry needs at least one paragraph or bullet"
});

const sectionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  entries: z.array(entrySchema).min(1)
});

const annexSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  number: z.number().int().positive(),
  title: z.string().min(1),
  paragraphs: z.array(z.string().min(1)).min(1),
  bullets: z.array(z.string().min(1)).optional()
});

export const cvSchema = z.object({
  locale: z.enum(locales),
  seo_title: z.string().min(1),
  seo_description: z.string().min(1),
  labels: labelsSchema,
  identity: z.object({
    location: z.string().min(1),
    nationality: z.string().min(1),
    mother_tongue: z.string().min(1)
  }),
  intro: z.array(z.string().min(1)).min(1),
  sections: z.array(sectionSchema).min(1),
  annexes: z.array(annexSchema).min(1)
});

export const siteSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  github_url: z.url(),
  github_username: z.string().min(1),
  birth_year: z.number().int().min(1900).max(2100),
  last_updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  photo: z.string().startsWith("/"),
  site_url: z.url()
});

export type CvContent = z.infer<typeof cvSchema>;
export type SiteContent = z.infer<typeof siteSchema>;

const contentRoot = path.join(process.cwd(), "src", "content");

function parseYaml(filePath: string): unknown {
  return YAML.parse(fs.readFileSync(filePath, "utf8"));
}

export function loadSite(): SiteContent {
  return siteSchema.parse(parseYaml(path.join(contentRoot, "site.yml")));
}

export function loadCv(locale: Locale): CvContent {
  const data = cvSchema.parse(parseYaml(path.join(contentRoot, "cv", `${locale}.yml`)));
  if (data.locale !== locale) throw new Error(`Locale mismatch in ${locale}.yml`);
  return data;
}

export function loadAllCv(): Record<Locale, CvContent> {
  const all = Object.fromEntries(locales.map((locale) => [locale, loadCv(locale)])) as Record<Locale, CvContent>;
  validateAlignedContent(all);
  return all;
}

export function validateAlignedContent(all: Record<Locale, CvContent>): void {
  const canonical = all.it;
  const sectionIds = canonical.sections.map(({ id }) => id).join("|");
  const annexIds = canonical.annexes.map(({ id }) => id).join("|");
  const annexNumbers = canonical.annexes.map(({ number }) => number).join("|");

  for (const locale of locales) {
    const cv = all[locale];
    if (cv.sections.map(({ id }) => id).join("|") !== sectionIds) {
      throw new Error(`${locale}.yml has different section IDs or ordering`);
    }
    if (cv.annexes.map(({ id }) => id).join("|") !== annexIds) {
      throw new Error(`${locale}.yml has different annex IDs or ordering`);
    }
    if (cv.annexes.map(({ number }) => number).join("|") !== annexNumbers) {
      throw new Error(`${locale}.yml has different annex numbering`);
    }

    const knownAnnexes = new Set(cv.annexes.map(({ id }) => id));
    for (const section of cv.sections) {
      for (const entry of section.entries) {
        for (const annexId of entry.annex_ids ?? []) {
          if (!knownAnnexes.has(annexId)) {
            throw new Error(`${locale}.yml references unknown annex '${annexId}'`);
          }
        }
      }
    }
  }
}

export function formatUpdatedDate(isoDate: string, locale: Locale): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const languageTag = { it: "it-IT", en: "en-GB", de: "de-DE" }[locale];
  return new Intl.DateTimeFormat(languageTag, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
