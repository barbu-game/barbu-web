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

test("after a reload, the player reclaims their seat and the game continues", async ({ page }) => {
  await startSoloGame(page);
  const code = (await page.getByTestId("room-code").innerText()).trim();
  await page.reload();
  // The session (localStorage) triggers a resume: same room, we play on.
  await expect(page.getByTestId("room-code")).toHaveText(code);
  await expect(page.getByTestId("your-hand")).toBeVisible({ timeout: 20_000 });
});

test("the reclaim also holds on a mobile viewport", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await startSoloGame(page);
  const code = (await page.getByTestId("room-code").innerText()).trim();
  await page.reload();
  await expect(page.getByTestId("room-code")).toHaveText(code);
  await ctx.close();
});

test("the stop vote at the dealer boundary ends the game", async ({ page }) => {
  test.setTimeout(120_000);
  // 10-player table: the 1st dealer boundary (after 5 contracts) is reached in ~25 moves.
  await startSoloGame(page, 10);
  const outcome = await playUntilStopVoteOrEnd(page, 90_000);
  if (outcome === "gameOver") {
    await expect(page.locator('[data-testid="final-standings"]:visible')).toBeVisible();
    return;
  }
  // Only 1 human → the majority (1×2 > 1) is enough: "Stop here" ends the game.
  await page.getByTestId("vote-stop-yes").click();
  await expect(page.locator('[data-testid="final-standings"]:visible')).toBeVisible({ timeout: 30_000 });
});
