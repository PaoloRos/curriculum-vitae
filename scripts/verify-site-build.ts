import fs from "node:fs";
import path from "node:path";
import { loadSite } from "../src/lib/content.ts";

const dist = path.join(process.cwd(), "dist");
const site = loadSite();
const publishedUrl = new URL(site.site_url);
const basePath = publishedUrl.pathname.replace(/\/$/, "");

function filesBelow(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(target) : [target];
  });
}

const htmlFiles = filesBelow(dist).filter((file) => file.endsWith(".html"));
if (htmlFiles.length === 0) throw new Error("No generated HTML files found in dist");

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const relativeFile = path.relative(dist, file);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical?.startsWith(site.site_url)) {
    throw new Error(`${relativeFile} has a canonical URL outside ${site.site_url}`);
  }

  const references = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const reference of references) {
    if (!reference.startsWith("/")) continue;
    if (!reference.startsWith(`${basePath}/`)) {
      throw new Error(`${relativeFile} contains a root-relative path outside ${basePath}: ${reference}`);
    }

    const pathname = new URL(reference, publishedUrl.origin).pathname.slice(basePath.length) || "/";
    const target = path.join(dist, pathname.endsWith("/") ? pathname.slice(1, -1) + "/index.html" : pathname.slice(1));
    if (!fs.existsSync(target)) {
      throw new Error(`${relativeFile} references a missing generated file: ${reference}`);
    }
  }
}

console.log(`✓ ${htmlFiles.length} generated pages use ${basePath}/ and reference existing files`);
