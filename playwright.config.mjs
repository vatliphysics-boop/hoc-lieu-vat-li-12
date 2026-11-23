import { defineConfig, devices } from "@playwright/test";

// Start the application separately, preferably from an isolated checkout. Set
// E2E_BASE_URL to target it and, optionally, E2E_CHROMIUM_PATH to a local Chrome.
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  fullyParallel: false,
  reporter: "list",
  outputDir: process.env.E2E_OUTPUT_DIR || "test-results",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3223",
    launchOptions: process.env.E2E_CHROMIUM_PATH ? { executablePath: process.env.E2E_CHROMIUM_PATH } : {},
    trace: "retain-on-failure",
  },
});
