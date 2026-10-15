import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { LobbyPage } from "../pages/LobbyPage";
import { GameTablePage } from "../pages/GameTablePage";
import { playRamiUntilEnd } from "../helpers/ramiLoop";

test("Rami 51 table vs bots plays to the final standings", async ({ page }) => {
  test.setTimeout(260_000);
  const home = new HomePage(page);
  await home.goto();
  await home.setName("E2E-Rami");
  await page.getByTestId("game-rami").click();
  await expect(page.getByTestId("quick-match")).toHaveCount(0);
  await home.setPlayerCount(4);
  await home.createTable();

  const lobby = new LobbyPage(page);
  await expect(page.getByTestId("lobby-seat")).toHaveCount(4);
  await lobby.addBotUntilFull();
  await lobby.start();

  await expect(page.getByTestId("rami-stock").first()).toBeVisible({ timeout: 20_000 });
  await playRamiUntilEnd(page, 230_000);

  const table = new GameTablePage(page);
  await table.waitForStandings();
  expect(await table.standingCount()).toBe(4);
});

// Cards inside a meld are disabled buttons; they must not swallow the tap meant for the meld.
test("a tap on a meld on the table reaches it", async ({ page }) => {
  test.setTimeout(120_000);
  const home = new HomePage(page);
  await home.goto();
  await home.setName("E2E-Rami-Tap");
  await page.getByTestId("game-rami").click();
  await home.createTable();
  const lobby = new LobbyPage(page);
  await lobby.addBotUntilFull();
  await lobby.start();

  const meld = page.getByTestId("rami-meld-on-table").first();
  for (let i = 0; i < 1000 && !(await meld.isVisible().catch(() => false)); i++) {
    if (await page.getByTestId("rami-draw").isVisible().catch(() => false)) {
      await page.getByTestId("rami-draw").click().catch(() => {});
      await page.getByTestId("rami-discard").waitFor({ timeout: 5_000 }).catch(() => {});
      await page.locator('[data-testid="rami-hand-card"] button').first().click({ position: { x: 6, y: 24 } }).catch(() => {});
      await page.getByTestId("rami-discard").click().catch(() => {});
    }
    await page.waitForTimeout(50);
  }
  await expect(meld).toBeVisible();
  await meld.evaluate((el) => {
    el.setAttribute("data-taps", "0");
    el.addEventListener("click", () => el.setAttribute("data-taps", String(Number(el.getAttribute("data-taps")) + 1)));
  });
  const box = (await meld.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(meld).toHaveAttribute("data-taps", "1");
});
