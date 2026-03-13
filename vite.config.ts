import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true, // enable SW in dev so you can test installability
      },
      includeAssets: [
        "icon.svg",
        "favicon-16x16.png",
        "favicon-32x32.png",
        "apple-touch-icon.png",
      ],
      manifest: {
        name: "GaurCity-HCL Carpool",
        short_name: "GC Carpool",
        description: "Fixed-route carpooling between Gaur City and HCL campus — ₹80 per seat",
        theme_color: "#1d4ed8",
        background_color: "#1d4ed8",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "en",
        categories: ["travel", "lifestyle"],
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Cache the app shell and static assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Network-first for Convex API calls (real-time data must stay fresh)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.convex\.cloud\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
});
