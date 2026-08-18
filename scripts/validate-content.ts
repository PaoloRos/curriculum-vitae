import { loadAllCv, loadSite } from "../src/lib/content.ts";

const site = loadSite();
const all = loadAllCv();

for (const [locale, cv] of Object.entries(all)) {
  const sectionCount = cv.sections.length;
  const annexCount = cv.annexes.length;
  console.log(`✓ ${locale}: ${sectionCount} sections, ${annexCount} annexes`);
}

console.log(`✓ Shared metadata valid; last update ${site.last_updated}`);
