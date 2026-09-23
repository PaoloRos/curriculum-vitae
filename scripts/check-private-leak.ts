import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { inspectPdf } from "./pdf-inspect.ts";
import { dist } from "./pdf-renderer.ts";
import { loadPrivateContact } from "./private-contact.ts";

const root = process.cwd();
const contact = loadPrivateContact();
if (!contact) {
  console.log("✓ No private contact file: private-number leak check skipped");
  process.exit(0);
}

function filesBelow(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(target) : [target];
  });
}

// Everything `git add -A` could publish: tracked files plus untracked, non-ignored ones.
const gitFiles = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean)
  .map((file) => path.join(root, file));
const candidates = [...new Set([...gitFiles, ...filesBelow(dist)])].filter((file) => fs.existsSync(file));

const leaks: string[] = [];
for (const file of candidates) {
  const bytes = fs.readFileSync(file);
  const text = file.endsWith(".pdf")
    ? (await inspectPdf(file)).text
    : bytes.includes(0) ? "" : bytes.toString("utf8");
  if (contact.leakPattern.test(text)) leaks.push(path.relative(root, file));
}

// Never print the number itself: only where it was found.
if (leaks.length > 0) {
  throw new Error(`The private telephone number appears in publishable files:\n  ${leaks.join("\n  ")}`);
}
console.log(`✓ Private telephone number absent from ${candidates.length} publishable files`);
