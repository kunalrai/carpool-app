/**
 * SSR entry point — used only at build time by scripts/prerender.mjs.
 * Renders each public route to an HTML string using react-dom/server.
 * Convex queries return undefined (loading state) synchronously, which is
 * fine: static pages (landing, legal) have no queries and render fully;
 * blog pages render their structure with empty data slots.
 */

import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { ConvexProvider, ConvexReactClient } from "convex/react";

import LandingPage from "./screens/LandingPage";
import BlogsPage from "./screens/BlogsPage";
import PrivacyPolicy from "./screens/PrivacyPolicy";
import TermsOfService from "./screens/TermsOfService";
import DataSafety from "./screens/DataSafety";

const ROUTE_COMPONENTS: Record<string, React.ComponentType> = {
  "/": LandingPage,
  "/blog": BlogsPage,
  "/privacy": PrivacyPolicy,
  "/terms": TermsOfService,
  "/data-safety": DataSafety,
};

let _convex: ConvexReactClient | null = null;

function getConvex(url: string) {
  if (!_convex) _convex = new ConvexReactClient(url);
  return _convex;
}

export function render(route: string, convexUrl: string): string {
  const Component = ROUTE_COMPONENTS[route] ?? LandingPage;
  const convex = getConvex(convexUrl);

  return renderToString(
    React.createElement(
      ConvexProvider,
      { client: convex },
      React.createElement(
        StaticRouter,
        { location: route },
        React.createElement(Component)
      )
    )
  );
}
