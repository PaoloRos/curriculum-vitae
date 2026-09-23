import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";

// Local-only contact data. The whole private/ folder is ignored by Git and
// never read by Astro, so nothing in it can reach dist/ or GitHub Pages.
export const privateDir = path.join(process.cwd(), "private");
export const privateContactFile = path.join(privateDir, "contact.yml");
export const privatePdfDir = path.join(privateDir, "pdf");

const privateContactSchema = z.object({
  telephone: z.string()
    .regex(/^\+?[\d\s().-]+$/, "Use only digits, spaces, '+', '(', ')', '.' or '-'")
    .refine((value) => value.replace(/\D/g, "").length >= 8, "The number needs at least 8 digits")
}).strict();

export interface PrivateContact {
  /** Number as it should be displayed, e.g. "+39 333 123 4567". */
  telephone: string;
  /** RFC 3966 link target, e.g. "tel:+393331234567". */
  telephoneHref: string;
  /** Matches the last 8 digits with any common separator in between. */
  leakPattern: RegExp;
}

export function loadPrivateContact(): PrivateContact | undefined {
  if (!fs.existsSync(privateContactFile)) return undefined;
  const { telephone } = privateContactSchema.parse(YAML.parse(fs.readFileSync(privateContactFile, "utf8")));
  const display = telephone.trim().replace(/\s+/g, " ");
  const digits = display.replace(/\D/g, "");
  const tail = digits.slice(-8).split("").join("[\\s.()/-]*");
  return {
    telephone: display,
    telephoneHref: `tel:${display.startsWith("+") ? "+" : ""}${digits}`,
    leakPattern: new RegExp(`${tail}(?!\\d)`)
  };
}
