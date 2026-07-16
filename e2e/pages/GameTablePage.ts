import { expect, type Page } from "@playwright/test";

export class GameTablePage {
  constructor(private page: Page) {}
  async roomCode(): Promise<string> {
    const el = this.page.getByTestId("room-code");
    await expect(el).toBeVisible();
    return (await el.innerText()).trim();
  }
  // GameTable renders its center twice (mobile block `sm:hidden` + desktop block `hidden sm:block`):
  // we target the actually visible instance so we don't count the hidden duplicates.
  private standings() {
    return this.page.locator('[data-testid="final-standings"]:visible');
  }
  async waitForStandings() {
    await expect(this.standings()).toBeVisible({ timeout: 60_000 });
  }
  standingCount() {
    return this.standings().locator('[data-testid="standing-row"]').count();
  }
}
