import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "@playwright/test";
import { loadSite } from "../src/lib/content.ts";

const dist = path.join(process.cwd(), "dist");
const downloads = path.join(dist, "downloads");
const basePath = new URL(loadSite().site_url).pathname.replace(/\/$/, "");
const pages = [
  { route: `${basePath}/`, file: "Paolo-Rossi-CV-it.pdf" },
  { route: `${basePath}/en/`, file: "Paolo-Rossi-CV-en.pdf" },
  { route: `${basePath}/de/`, file: "Paolo-Rossi-CV-de.pdf" }
];

if (!fs.existsSync(path.join(dist, "index.html"))) {
  throw new Error("The site has not been built. Run npm run build:site first.");
}
fs.mkdirSync(downloads, { recursive: true });

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml"
};

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
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      });
      const pdfOptions = {
        format: "A4" as const,
        printBackground: true,
        preferCSSPageSize: true
      };
      await page.pdf(pdfOptions);
      await page.pdf({ ...pdfOptions, path: path.join(downloads, item.file) });
      await page.close();
      console.log(`✓ Generated ${item.file}`);
    } finally {
      await browser.close();
    }
  }
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
