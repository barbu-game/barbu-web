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
 * Joue un coup du siège humain si c'est possible et renvoie true ; sinon renvoie false.
 * On attend que la carte jouée quitte la main (ou, pour une passe, un court instant) afin
 * de ne pas re-cliquer une carte périmée avant que le serveur ait pris le coup en compte.
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
 * Joue le siège humain jusqu'à l'écran de classement final. Les bots étant à délai 0, une
 * partie complète tient en ~2 min via l'UI. On vote « continuer » aux frontières de donneur
 * (un vote d'arrêt s'y ouvre automatiquement) pour dérouler la partie jusqu'à sa fin.
 * On ne s'appuie sur aucune valeur de carte.
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
  throw new Error("la partie ne s'est pas terminée dans le délai imparti");
}

/**
 * Comme playUntilEnd, mais s'arrête aussi dès qu'un vote d'arrêt s'ouvre (frontière de
 * donneur). Renvoie "stopVote" si le panneau est apparu, "gameOver" si la partie a fini.
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
  throw new Error("ni vote d'arrêt ni fin de partie dans le délai imparti");
}
