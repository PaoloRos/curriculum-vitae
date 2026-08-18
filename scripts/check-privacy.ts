import fs from "node:fs";
import path from "node:path";
import { loadSite } from "../src/lib/content.ts";

const root = process.cwd();
const publicSources = ["src", "public"];
const forbiddenField = /^\s*(phone|telephone|mobile|street|street_address|postal_code|birth_date|date_of_birth)\s*:/im;
const forbiddenContact = /(?:href\s*=\s*["']tel:|\btel:\s*\+?\d)/i;
const phoneLike = /\+\d[\d .()-]{7,}\d/g;
const postalCode = /\b\d{5}\b/g;

function filesBelow(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(target) : [target];
  });
}

for (const base of publicSources) {
  for (const file of filesBelow(path.join(root, base))) {
    if (!/\.(astro|css|html|js|mjs|ts|tsx|ya?ml|json|md)$/i.test(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    if (forbiddenField.test(text)) throw new Error(`Forbidden private-data field in ${path.relative(root, file)}`);
    if (forbiddenContact.test(text)) throw new Error(`Telephone contact in ${path.relative(root, file)}`);
    if (phoneLike.test(text)) throw new Error(`Phone-like value in ${path.relative(root, file)}`);
    if (postalCode.test(text)) throw new Error(`Postal-code-like value in ${path.relative(root, file)}`);
  }
}

const site = loadSite();
if (!/^\d{4}$/.test(String(site.birth_year))) throw new Error("Birth information must contain only a year");

const photoPath = path.join(root, "public", "photo-paolo-rossi.jpg");
if (!fs.existsSync(photoPath)) throw new Error("Sanitised public photo is missing");
const photoText = fs.readFileSync(photoPath).toString("latin1");
for (const marker of ["Exif", "DateTimeOriginal", "GPSLatitude", "GPSLongitude", "xmpmeta"]) {
  if (photoText.includes(marker)) throw new Error(`Public photo still contains metadata marker '${marker}'`);
}

console.log("✓ Public sources contain only the approved contact and identity fields");
console.log("✓ Public photograph contains no EXIF, GPS or XMP markers");
