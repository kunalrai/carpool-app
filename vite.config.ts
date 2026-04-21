import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";
import path from "path";

/** Writes firebase-messaging-sw.js into /public at build/dev time using env vars. */
function fcmSwPlugin(): Plugin {
  return {
    name: "fcm-sw",
    configResolved(config) {
      const env = loadEnv(config.mode, config.root, "VITE_");
      const sw = `
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "${env.VITE_FIREBASE_API_KEY}",
  authDomain: "${env.VITE_FIREBASE_AUTH_DOMAIN}",
  projectId: "${env.VITE_FIREBASE_PROJECT_ID}",
  messagingSenderId: "${env.VITE_FIREBASE_SENDER_ID}",
  appId: "${env.VITE_FIREBASE_APP_ID}",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "CarPool";
  const body = payload.notification?.body ?? "";
  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
  });
});
`.trimStart();
      fs.writeFileSync(
        path.resolve(config.publicDir, "firebase-messaging-sw.js"),
        sw
      );
    },
  };
}

export default defineConfig({
  plugins: [
    fcmSwPlugin(),
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
        name: "CarPool",
        short_name: "CarPool",
        description: "Community carpooling app — share rides with your community",
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
        // Network-only for real-time and external API calls
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.convex\.cloud\/.*/i,
            handler: "NetworkOnly",
          },
          {
            // Google Maps JS API — must not be cached by SW
            urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
            handler: "NetworkOnly",
          },
          {
            // Google Maps static assets
            urlPattern: /^https:\/\/maps\.gstatic\.com\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
});
