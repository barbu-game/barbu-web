import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { LobbyPage } from "../pages/LobbyPage";
import { GameTablePage } from "../pages/GameTablePage";
import { playUntilEnd } from "../helpers/playLoop";

// A full game = ~260 human moves played via the UI (constant regardless of N:
// cards_per_hand × rounds ≈ 52/N × 5N). We give this background smoke test time.
test("full game, 2 players vs bot → final standings", async ({ page }) => {
  test.setTimeout(240_000);
  const home = new HomePage(page);
  await home.goto();
  await home.setName("E2E-Host");
  await home.setPlayerCount(2);
  await home.createTable();

  const lobby = new LobbyPage(page);
  await lobby.addBotUntilFull();
  await lobby.start();

  const table = new GameTablePage(page);
  await playUntilEnd(page, 210_000);
  await table.waitForStandings();
  expect(await table.standingCount()).toBe(2);
});
