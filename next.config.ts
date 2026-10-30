import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents/PPR assume mostly-static content; VITA reads SQLite + the
  // current date on every request (dashboard, sessions, nutrition), so classic
  // per-request dynamic rendering fits better than sprinkling `"use cache"`.
  devIndicators: false,
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
