import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";
import { loadSite, type Locale } from "../src/lib/content.ts";

export const dist = path.join(process.cwd(), "dist");

export const pdfFiles: Record<Locale, string> = {
  it: "Paolo-Rossi-CV-it.pdf",
  en: "Paolo-Rossi-CV-en.pdf",
  de: "Paolo-Rossi-CV-de.pdf"
};

const basePath = new URL(loadSite().site_url).pathname.replace(/\/$/, "");
const pages: { locale: Locale; route: string }[] = [
  { locale: "it", route: `${basePath}/` },
  { locale: "en", route: `${basePath}/en/` },
  { locale: "de", route: `${basePath}/de/` }
];

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

export type BeforePrint = (page: Page, locale: Locale) => Promise<void>;

/**
 * Serves the built site from dist/ and prints each CV page to outDir.
 * beforePrint runs after the page is fully loaded and before printing.
 */
export async function renderPdfs(outDir: string, beforePrint?: BeforePrint): Promise<string[]> {
  if (!fs.existsSync(path.join(dist, "index.html"))) {
    throw new Error("The site has not been built. Run npm run build:site first.");
  }
  fs.mkdirSync(outDir, { recursive: true });

  const server = http.createServer((request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url ?? "/", "http://127.0.0.1").pathname);
    const sitePath = basePath && (requestPath === basePath || requestPath.startsWith(`${basePath}/`))
      ? requestPath.slice(basePath.length) || "/"
      : requestPath;
    const relative = sitePath.endsWith("/") ? `${sitePath}index.html` : sitePath;
    const resolved = path.resolve(dist, `.${relative}`);
    if (!resolved.startsWith(`${dist}${path.sep}`) || !fs.existsSync(resolved)) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.setHeader("Content-Type", contentTypes[path.extname(resolved)] ?? "application/octet-stream");
    fs.createReadStream(resolved).pipe(response);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not start the local PDF server");

  const written: string[] = [];
  try {
    for (const item of pages) {
      const browser = await chromium.launch();
      try {
        const page = await browser.newPage();
        await page.emulateMedia({ media: "print" });
        const response = await page.goto(`http://127.0.0.1:${address.port}${item.route}`, { waitUntil: "networkidle" });
        if (!response?.ok()) throw new Error(`Could not load ${item.route} for PDF generation`);
        await page.locator("img").evaluateAll(async (images) => {
          await Promise.all(images.map((image) => image instanceof HTMLImageElement ? image.decode() : Promise.resolve()));
        });
        if (beforePrint) await beforePrint(page, item.locale);
        await page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        });
        const pdfOptions = {
          format: "A4" as const,
          printBackground: true,
          preferCSSPageSize: true
        };
        const target = path.join(outDir, pdfFiles[item.locale]);
        await page.pdf(pdfOptions);
        await page.pdf({ ...pdfOptions, path: target });
        await page.close();
        written.push(target);
        console.log(`✓ Generated ${path.relative(process.cwd(), target)}`);
      } finally {
        await browser.close();
      }
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
  return written;
}
