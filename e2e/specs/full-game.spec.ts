import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { LobbyPage } from "../pages/LobbyPage";
import { GameTablePage } from "../pages/GameTablePage";
import { playUntilEnd } from "../helpers/playLoop";

// Une partie complète = ~260 coups humains joués via l'UI (constant quel que soit N :
// cartes_par_main × manches ≈ 52/N × 5N). On laisse le temps à ce smoke de fond.
test("partie complète 2 joueurs vs bot → classement final", async ({ page }) => {
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
