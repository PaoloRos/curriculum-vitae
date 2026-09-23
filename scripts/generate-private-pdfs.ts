import { execFileSync } from "node:child_process";
import path from "node:path";
import type { Locale } from "../src/lib/content.ts";
import { inspectPdf } from "./pdf-inspect.ts";
import { dist, renderPdfs } from "./pdf-renderer.ts";
import { loadPrivateContact, privateContactFile, privatePdfDir } from "./private-contact.ts";

const telephoneLabel: Record<Locale, string> = {
  it: "Telefono",
  en: "Phone",
  de: "Telefon"
};

const contact = loadPrivateContact();
if (!contact) {
  throw new Error(
    `Missing ${path.relative(process.cwd(), privateContactFile)}. `
    + "Copy private.example.yml to that path and write your number in it."
  );
}

// Refuse to run unless Git is guaranteed to ignore both the number and the output.
for (const target of [privateContactFile, privatePdfDir]) {
  try {
    execFileSync("git", ["check-ignore", "--quiet", path.relative(process.cwd(), target)], { stdio: "ignore" });
  } catch {
    throw new Error(`${path.relative(process.cwd(), target)} is not ignored by Git: add /private/ to .gitignore first`);
  }
}
if (!path.relative(dist, privatePdfDir).startsWith("..")) {
  throw new Error("Private PDFs must never be written inside dist/");
}

// Printable width of an A4 page with the 9 mm side margins of @page in global.css.
const printableWidth = Math.floor(((210 - 2 * 9) * 96) / 25.4);

const files = await renderPdfs(privatePdfDir, async (page, locale) => {
  await page.setViewportSize({ width: printableWidth, height: 1123 });
  const overflowing = await page.evaluate(({ label, telephone, href }) => {
    const emailRow = document.querySelector(".identity-card .identity-email");
    if (!emailRow?.parentElement) throw new Error("Email row not found in the identity card");
    const row = document.createElement("div");
    row.className = "identity-telephone";
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    const link = document.createElement("a");
    link.href = href;
    link.textContent = telephone;
    description.append(link);
    row.append(term, description);
    emailRow.after(row);

    // Every item must share the first row and show its label and value on one line within its column.
    const items = [...emailRow.parentElement.children];
    const rowTop = items[0].getBoundingClientRect().top;
    return items.filter((item) => {
      const box = item.getBoundingClientRect();
      if (box.top !== rowTop) return true;
      return [...item.children].some((child) => {
        const range = document.createRange();
        range.selectNodeContents(child);
        // A wrapped value is about twice as tall as its tallest fragment (text or icon).
        const tallest = Math.max(...[...range.getClientRects()].map((rect) => rect.height));
        const bounds = range.getBoundingClientRect();
        return bounds.height > 1.5 * tallest || bounds.right > box.right + 0.5;
      });
    }).map((item) => item.querySelector("dt")?.textContent ?? "?");
  }, { label: telephoneLabel[locale], telephone: contact.telephone, href: contact.telephoneHref });
  if (overflowing.length > 0) {
    throw new Error(`${locale}: identity card items no longer fit on one row: ${overflowing.join(", ")}`);
  }
});

const occurrences = new RegExp(contact.leakPattern.source, "g");
for (const file of files) {
  const name = path.basename(file);
  const { numPages, text, linkTargets } = await inspectPdf(file);
  if (numPages > 2) throw new Error(`${name} has ${numPages} pages; expected at most 2`);
  const count = text.match(occurrences)?.length ?? 0;
  if (count !== 1) throw new Error(`${name} shows the telephone number ${count} times; expected exactly once`);
  if (!linkTargets.includes(contact.telephoneHref)) throw new Error(`${name} does not contain a clickable telephone link`);
  console.log(`✓ ${name}: ${numPages} page(s), telephone shown once and clickable`);
}

console.log(`\nPrivate PDFs are in ${path.relative(process.cwd(), privatePdfDir)}/ — do not publish them.`);
