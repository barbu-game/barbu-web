import { test, expect, type Page } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { LobbyPage } from "../pages/LobbyPage";
import { playUntilStopVoteOrEnd } from "../helpers/playLoop";

async function startSoloGame(page: Page, players = 2) {
  const home = new HomePage(page);
  await home.goto();
  await home.setName("Reco");
  await home.setPlayerCount(players);
  await home.createTable();
  const lobby = new LobbyPage(page);
  await lobby.addBotUntilFull();
  await lobby.start();
  await expect(page.getByTestId("room-code")).toBeVisible();
}

test("après un reload, le joueur reprend son siège et la partie continue", async ({ page }) => {
  await startSoloGame(page);
  const code = (await page.getByTestId("room-code").innerText()).trim();
  await page.reload();
  // La session (localStorage) relance un resume : même room, on rejoue.
  await expect(page.getByTestId("room-code")).toHaveText(code);
  await expect(page.getByTestId("your-hand")).toBeVisible({ timeout: 20_000 });
});

test("le reclaim tient aussi sur un viewport mobile", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await startSoloGame(page);
  const code = (await page.getByTestId("room-code").innerText()).trim();
  await page.reload();
  await expect(page.getByTestId("room-code")).toHaveText(code);
  await ctx.close();
});

test("le vote d'arrêt à la frontière de donneur termine la partie", async ({ page }) => {
  test.setTimeout(120_000);
  // Table à 10 joueurs : la 1re frontière de donneur (après 5 contrats) est atteinte en ~25 coups.
  await startSoloGame(page, 10);
  const outcome = await playUntilStopVoteOrEnd(page, 90_000);
  if (outcome === "gameOver") {
    await expect(page.locator('[data-testid="final-standings"]:visible')).toBeVisible();
    return;
  }
  // 1 seul humain → la majorité (1×2 > 1) suffit : « Stop ici » clôt la partie.
  await page.getByTestId("vote-stop-yes").click();
  await expect(page.locator('[data-testid="final-standings"]:visible')).toBeVisible({ timeout: 30_000 });
});
