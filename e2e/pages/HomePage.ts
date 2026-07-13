import type { Page } from "@playwright/test";

export class HomePage {
  constructor(private page: Page) {}
  async goto() {
    await this.page.goto("/");
  }
  async setName(name: string) {
    await this.page.getByTestId("name-input").fill(name);
  }
  async setPlayerCount(n: number) {
    await this.page.getByTestId("player-count").selectOption(String(n));
  }
  createTable() {
    return this.page.getByTestId("create-table").click();
  }
  quickMatch() {
    return this.page.getByTestId("quick-match").click();
  }
  rankedMatch() {
    return this.page.getByTestId("ranked-match").click();
  }
  async joinByCode(code: string) {
    await this.page.getByTestId("join-code").fill(code);
    await this.page.getByTestId("join-button").click();
  }
}
