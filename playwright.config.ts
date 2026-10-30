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
  webServer: {
    command: "npm run seed:e2e && npm run dev:e2e",
    url: "http://localhost:3901",
    reuseExistingServer: false,
    env: { ...process.env, VITA_DB_PATH: "data/vita.e2e.db" },
  },
});
