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

test("quick match in Rami seats the player at a Rami table with bots", async ({ page }) => {
  test.setTimeout(90_000);
  const home = new HomePage(page);
  await home.goto();
  await home.setName("E2E-Rami-Quick");
  await page.getByTestId("game-rami").click();
  await home.quickMatch();
  // The casual queue waits out its fill timeout, then completes the table with bots.
  await expect(page.getByTestId("rami-stock").first()).toBeVisible({ timeout: 45_000 });
});

test("the Rami rules open from the lobby", async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();
  await page.getByTestId("game-rami").click();
  await page.getByTestId("rami-rules-link").click();
  await expect(page.getByTestId("rami-rules")).toBeVisible();
  await expect(page.getByTestId("rami-rules")).toContainText("51");
});

test("a card dragged across the hand changes its place", async ({ page }) => {
  test.setTimeout(60_000);
  const home = new HomePage(page);
  await home.goto();
  await home.setName("E2E-Rami-Drag");
  await page.getByTestId("game-rami").click();
  await home.createTable();
  const lobby = new LobbyPage(page);
  await lobby.addBotUntilFull();
  await lobby.start();

  const cards = page.locator('[data-testid="rami-hand-card"]');
  await expect(cards.first()).toBeVisible({ timeout: 20_000 });
  const firstId = await cards.first().getAttribute("data-card-id");
  const from = (await cards.first().boundingBox())!;
  const to = (await cards.last().boundingBox())!;
  await page.mouse.move(from.x + 6, from.y + 24);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width, to.y + 24, { steps: 8 });
  await page.mouse.up();
  await expect(cards.last()).toHaveAttribute("data-card-id", firstId!);
});

test("the leaderboard has a Rami tab", async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();
  await page.getByRole("button", { name: /leaderboard|classement/i }).click();
  await page.getByTestId("leaderboard-rami").click();
  await expect(page.getByTestId("leaderboard-rami")).toHaveAttribute("aria-selected", "true");
});

test("on a narrow phone a card can be dragged to the hand's second row", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 320, height: 720 });
  const home = new HomePage(page);
  await home.goto();
  await home.setName("E2E-Rami-Rows");
  await page.getByTestId("game-rami").click();
  await home.createTable();
  const lobby = new LobbyPage(page);
  await lobby.addBotUntilFull();
  await lobby.start();

  const cards = page.locator('[data-testid="rami-hand-card"]');
  await expect(cards.first()).toBeVisible({ timeout: 20_000 });
  const first = (await cards.first().boundingBox())!;
  const last = (await cards.last().boundingBox())!;
  expect(last.y).toBeGreaterThan(first.y + 10); // the hand really is on two rows
  const firstId = await cards.first().getAttribute("data-card-id");
  await page.mouse.move(first.x + 6, first.y + 20);
  await page.mouse.down();
  await page.mouse.move(last.x + last.width - 4, last.y + 20, { steps: 10 });
  await page.mouse.up();
  await expect(cards.last()).toHaveAttribute("data-card-id", firstId!);
});
