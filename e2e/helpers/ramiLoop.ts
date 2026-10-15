import type { Page } from "@playwright/test";

const visible = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .isVisible()
    .catch(() => false);

/**
 * Plays the human seat through a whole Rami game with the simplest legal turn: draw from the stock,
 * then discard the first card of the hand. It never opens, so bots go out and the human pays.
 */
export async function playRamiUntilEnd(page: Page, timeoutMs = 220_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await visible(page, '[data-testid="final-standings"]:visible')) return;
    if (await visible(page, '[data-testid="rami-draw"]')) {
      await page.getByTestId("rami-draw").click().catch(() => {});
      await page.getByTestId("rami-discard").waitFor({ timeout: 5_000 }).catch(() => {});
      continue;
    }
    if (await visible(page, '[data-testid="rami-discard"]')) {
      const first = page.locator('[data-testid="rami-hand-card"]').first();
      const id = await first.getAttribute("data-card-id").catch(() => null);
      // Tight fan: only each card's left edge is uncovered.
      await first.locator("button").click({ position: { x: 6, y: 24 }, timeout: 5_000 }).catch(() => {});
      await page.getByTestId("rami-discard").click({ timeout: 5_000 }).catch(() => {});
      if (id) {
        await page
          .locator(`[data-testid="rami-hand-card"][data-card-id="${id}"]`)
          .waitFor({ state: "detached", timeout: 5_000 })
          .catch(() => {});
      }
      continue;
    }
    await page.waitForTimeout(100);
  }
  throw new Error("Rami game did not reach the final standings in time");
}
