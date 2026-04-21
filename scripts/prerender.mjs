/**
 * Post-build prerender script — no headless browser required.
 *
 * 1. Vite SSR-builds src/entry-server.tsx → dist-ssr/
 * 2. Loads the SSR bundle and calls render(route) for each public route
 * 3. Injects the rendered HTML into dist/index.html and writes per-route files
 *
 * Run automatically via the build script in package.json.
 */

import { build } from "vite";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const ROUTES = ["/", "/blog", "/privacy", "/terms", "/data-safety"];

async function buildSsr() {
  await build({
    root,
    build: {
      ssr: "src/entry-server.tsx",
      outDir: "dist-ssr",
      rollupOptions: { output: { format: "esm" } },
    },
    // Silence output
    logLevel: "warn",
  });
}

async function main() {
  console.log("🔍 Prerendering public routes...");

  // Build the SSR bundle
  await buildSsr();

  // Load the SSR bundle
  const ssrEntry = join(root, "dist-ssr", "entry-server.js");
  const { render } = await import(pathToFileURL(ssrEntry).href);

  // Read the client HTML template
  const template = readFileSync(join(root, "dist", "index.html"), "utf-8");
  const convexUrl =
    process.env.VITE_CONVEX_URL ?? "https://placeholder.convex.cloud";

  for (const route of ROUTES) {
    let appHtml = "";
    try {
      appHtml = render(route, convexUrl);
    } catch (err) {
      console.warn(`  ⚠ SSR render failed for ${route}, using shell:`, err.message);
    }

    const html = template.replace(
      '<div id="root"></div>',
      `<div id="root">${appHtml}</div>`
    );

    const routePath =
      route === "/" ? "index.html" : `${route.slice(1)}/index.html`;
    const filePath = join(root, "dist", routePath);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, html, "utf-8");
    console.log(`  ✓ ${route}`);
  }

  console.log("✅ Prerender complete.");
}

main().catch((err) => {
  console.error("Prerender failed:", err);
  process.exit(1);
});
