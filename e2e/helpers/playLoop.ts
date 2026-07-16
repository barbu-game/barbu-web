import type { Page } from "@playwright/test";

const PLAYABLE = '[data-testid="your-hand"] [data-testid="card"][data-playable="true"]';

function visible(page: Page, selector: string): Promise<boolean> {
  return page
    .locator(selector)
    .first()
    .isVisible()
    .catch(() => false);
}

/**
 * Plays one move for the human seat, returning whether it played. Waits for the card to leave
 * the hand (or a brief moment for a pass) to avoid re-clicking a stale card before the server
 * registers the move.
 */
async function playOneMove(page: Page): Promise<boolean> {
  const first = page.locator(PLAYABLE).first();
  if (await first.isVisible().catch(() => false)) {
    const dataCard = await first.getAttribute("data-card").catch(() => null);
    await first.click().catch(() => {});
    if (dataCard) {
      await page
        .locator(`[data-testid="your-hand"] [data-card="${dataCard}"]`)
        .waitFor({ state: "detached", timeout: 5_000 })
        .catch(() => {});
    }
    return true;
  }
  if (await visible(page, '[data-testid="pass-button"]')) {
    await page.getByTestId("pass-button").click().catch(() => {});
    await page.waitForTimeout(80);
    return true;
  }
  return false;
}

/**
 * Plays the human seat through to the final standings screen, voting "continue" at dealer
 * boundaries (where a stop vote opens automatically). Does not rely on any card value.
 */
export async function playUntilEnd(page: Page, timeoutMs = 200_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await visible(page, '[data-testid="final-standings"]:visible')) return;
    if (await visible(page, '[data-testid="vote-stop-no"]')) {
      await page.getByTestId("vote-stop-no").click().catch(() => {});
      await page.waitForTimeout(80);
      continue;
    }
    if (await playOneMove(page)) continue;
    await page.waitForTimeout(100);
  }
  throw new Error("the game did not finish within the allotted time");
}

/**
 * Like playUntilEnd, but also stops as soon as a stop vote opens (dealer
 * boundary). Returns "stopVote" if the panel appeared, "gameOver" if the game ended.
 */
export async function playUntilStopVoteOrEnd(
  page: Page,
  timeoutMs = 200_000,
): Promise<"stopVote" | "gameOver"> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await visible(page, '[data-testid="vote-stop-yes"]')) return "stopVote";
    if (await visible(page, '[data-testid="final-standings"]:visible')) return "gameOver";
    if (await playOneMove(page)) continue;
    await page.waitForTimeout(100);
  }
  throw new Error("neither a stop vote nor game end within the allotted time");
}
