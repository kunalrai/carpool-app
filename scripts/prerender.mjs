/**
 * Post-build prerender script.
 * Spins up a local server, visits each public route with Puppeteer,
 * and writes the rendered HTML back into dist/ so Google can index it.
 *
 * Run automatically via the "postbuild" npm script.
 */

import puppeteer from "puppeteer";
import { createServer } from "http";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "..", "dist");
const PORT = 3099;

const ROUTES = ["/", "/blog", "/privacy", "/terms", "/data-safety"];

// Minimal SPA-aware static file server
function startServer() {
  const server = createServer((req, res) => {
    let filePath = join(distDir, req.url.split("?")[0]);

    // Serve index.html for directories or unknown extensions (SPA fallback)
    if (!existsSync(filePath) || extname(filePath) === "") {
      filePath = join(distDir, "index.html");
    }

    try {
      const content = readFileSync(filePath);
      const ext = extname(filePath).slice(1);
      const mime = {
        html: "text/html", js: "application/javascript",
        css: "text/css", png: "image/png", svg: "image/svg+xml",
        ico: "image/x-icon", json: "application/json", woff2: "font/woff2",
      }[ext] ?? "application/octet-stream";
      res.writeHead(200, { "Content-Type": mime });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

async function main() {
  console.log("🔍 Prerendering public routes...");

  const server = await startServer();

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      await page.goto(`http://localhost:${PORT}${route}`, {
        waitUntil: "networkidle0",
        timeout: 15000,
      });

      // Wait for the main content to appear
      await page.waitForSelector("#root > *", { timeout: 8000 }).catch(() => {});

      const html = await page.content();

      const routePath = route === "/" ? "index.html" : `${route.slice(1)}/index.html`;
      const filePath = join(distDir, routePath);
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, html, "utf-8");

      console.log(`  ✓ ${route}`);
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log("✅ Prerender complete.");
}

main().catch((err) => {
  console.error("Prerender failed:", err);
  process.exit(1);
});
