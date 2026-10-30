import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents/PPR assume mostly-static content; VITA reads SQLite + the
  // current date on every request (dashboard, sessions, nutrition), so classic
  // per-request dynamic rendering fits better than sprinkling `"use cache"`.
  devIndicators: false,
  // E2E runs a production build in its own directory (.next-e2e) so building for tests never
  // overwrites the .next served by the production server on :3900. See playwright.config.ts.
  distDir: process.env.VITA_DIST_DIR ?? ".next",
  // /ajustes replaced /perfil as the single profile/preferences editor (Phase 3).
  async redirects() {
    return [{ source: "/perfil", destination: "/ajustes", permanent: true }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
