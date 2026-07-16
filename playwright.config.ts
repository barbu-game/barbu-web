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
      // The engine targets Java 21; locally the default JDK may differ, so we resolve
      // a JAVA_HOME 21 via /usr/libexec/java_home unless the environment already provides one.
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
      // The repo is configured with `output: standalone`, under which `next start` is not
      // supported; `next dev` serves the same real app against the real backend/WS and starts
      // faster. The prod build's typecheck/drift stays covered by CI (`pnpm build`).
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
