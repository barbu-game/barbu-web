import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: false, // un seul backend partagé : on garde l'exécution en série
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
      // Serveur autoritaire réel : bots instantanés, H2 en mémoire (reset à chaque run).
      // Le moteur cible Java 21 ; en local le JDK par défaut peut différer, alors on résout
      // un JAVA_HOME 21 via /usr/libexec/java_home s'il n'est pas déjà fourni par l'environnement.
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
      // Le repo est configuré en `output: standalone`, avec lequel `next start` n'est pas
      // supporté ; `next dev` sert la même app réelle contre le vrai backend/WS et démarre
      // plus vite. Le typecheck/drift du build de prod reste couvert par la CI (`pnpm build`).
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
