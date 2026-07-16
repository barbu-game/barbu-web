import { expect, type Page } from "@playwright/test";

export class LobbyPage {
  constructor(private page: Page) {}
  async roomCode(): Promise<string> {
    const el = this.page.getByTestId("room-code");
    await expect(el).toBeVisible();
    return (await el.innerText()).trim();
  }
  seatCount() {
    return this.page.getByTestId("lobby-seat").count();
  }
  hasHostControls() {
    return this.page.getByTestId("start-game").isVisible().catch(() => false);
  }
  async addBotUntilFull() {
    const start = this.page.getByTestId("start-game");
    const addBot = this.page.getByTestId("add-bot");
    // The server enables Start as soon as all seats are taken; we fill with bots.
    for (let i = 0; i < 12; i++) {
      if (await start.isEnabled().catch(() => false)) return;
      await addBot.click();
      await this.page.waitForTimeout(100);
    }
    await expect(start).toBeEnabled();
  }
  start() {
    return this.page.getByTestId("start-game").click();
  }
  leave() {
    return this.page.getByTestId("leave-table").click();
  }
}
