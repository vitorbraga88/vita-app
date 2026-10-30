import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3901",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // E2E runs against a production build (`next start`), the same runtime as :3900.
  // `next dev` drops SQLite's POSIX locks after the first Server Action (measured via
  // /proc/locks), so an external connection closing would delete the WAL and silently lose
  // the server's later writes. Separate distDir keeps the production .next untouched.
  webServer: {
    command: "npm run seed:e2e && npm run build:e2e && npm run start:e2e",
    url: "http://localhost:3901",
    reuseExistingServer: false,
    timeout: 240_000,
    env: { ...process.env, VITA_DB_PATH: "data/vita.e2e.db" },
  },
});
