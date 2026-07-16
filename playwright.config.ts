import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: false, // single shared backend: keep execution serial
  workers: 1,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // Real authoritative server: instant bots, in-memory H2 (reset on each run).
      // The engine needs Java 21; resolve a JAVA_HOME 21 unless the environment already provides one.
      command:
        "cd ../barbu-server && " +
        'JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 21 2>/dev/null || echo "$JAVA_HOME")}" ' +
        "./gradlew --console=plain :app:run",
      url: "http://localhost:8080/health",
      timeout: 240_000,
      reuseExistingServer: !CI,
      env: { BARBU_BOT_DELAY_MS: "0" },
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      // `output: standalone` doesn't support `next start`; `next dev` serves the same app against
      // the real backend/WS and starts faster. Prod typecheck/drift stays covered by CI.
      command: "pnpm dev",
      url: "http://localhost:3000",
      timeout: 180_000,
      reuseExistingServer: !CI,
      env: {
        NEXT_PUBLIC_API_URL: "http://localhost:8080",
        NEXT_PUBLIC_WS_URL: "ws://localhost:8080/ws/game",
      },
    },
  ],
});
