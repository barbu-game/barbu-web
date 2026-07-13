import { test as base, type Page } from "@playwright/test";

type Fixtures = { twoClients: { a: Page; b: Page } };

export const test = base.extend<Fixtures>({
  twoClients: async ({ browser }, provide) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const a = await ctxA.newPage();
    const b = await ctxB.newPage();
    await provide({ a, b });
    await ctxA.close();
    await ctxB.close();
  },
});

export { expect } from "@playwright/test";
