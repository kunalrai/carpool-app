import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const svgBuffer = readFileSync(resolve(root, "public/icon.svg"));

const icons = [
  { name: "pwa-192x192.png",    size: 192 },
  { name: "pwa-512x512.png",    size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "favicon-32x32.png",  size: 32  },
  { name: "favicon-16x16.png",  size: 16  },
];

for (const { name, size } of icons) {
  const out = resolve(root, "public", name);
  await sharp(svgBuffer).resize(size, size).png().toFile(out);
  console.log(`✓ ${name} (${size}×${size})`);
}

// Also write a maskable icon (512 with 10% safe-zone padding = icon at 80% scale on white bg)
const maskable = resolve(root, "public", "pwa-maskable-512x512.png");
await sharp({
  create: { width: 512, height: 512, channels: 4, background: { r: 29, g: 78, b: 216, alpha: 1 } },
})
  .composite([{
    input: await sharp(svgBuffer).resize(410, 410).png().toBuffer(),
    gravity: "center",
  }])
  .png()
  .toFile(maskable);
console.log("✓ pwa-maskable-512x512.png (512×512, maskable)");

console.log("\nAll icons generated in public/");
