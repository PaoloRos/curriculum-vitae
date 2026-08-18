import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "src", "content", "site.yml");
const current = fs.readFileSync(file, "utf8");
const today = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Europe/Rome"
}).format(new Date());

if (!/^last_updated: \d{4}-\d{2}-\d{2}$/m.test(current)) {
  throw new Error("Could not find a valid last_updated field in src/content/site.yml");
}

fs.writeFileSync(file, current.replace(/^last_updated: \d{4}-\d{2}-\d{2}$/m, `last_updated: ${today}`));
console.log(`✓ Updated last_updated to ${today}`);

