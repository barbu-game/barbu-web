import type { Page } from "@playwright/test";

export class AuthBarPage {
  constructor(private page: Page) {}
  private async submit(mode: "login" | "register", u: string, p: string) {
    await this.page.getByTestId(`auth-tab-${mode}`).click();
    await this.page.getByTestId("auth-username").fill(u);
    await this.page.getByTestId("auth-password").fill(p);
    await this.page.getByTestId("auth-submit").click();
  }
  register(u: string, p: string) {
    return this.submit("register", u, p);
  }
  login(u: string, p: string) {
    return this.submit("login", u, p);
  }
  logout() {
    return this.page.getByTestId("logout").click();
  }
  async signedInAs(): Promise<string | null> {
    const el = this.page.getByTestId("auth-user");
    if (!(await el.isVisible().catch(() => false))) return null;
    return el.innerText();
  }
}
