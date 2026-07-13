import { expect, type Page } from "@playwright/test";

export class GameTablePage {
  constructor(private page: Page) {}
  async roomCode(): Promise<string> {
    const el = this.page.getByTestId("room-code");
    await expect(el).toBeVisible();
    return (await el.innerText()).trim();
  }
  // GameTable rend son centre deux fois (bloc mobile `sm:hidden` + bloc desktop `hidden sm:block`) :
  // on cible l'instance réellement visible pour ne pas compter les doublons cachés.
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
