import { test, expect } from "@playwright/test";

test("the stack boots and the home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "LE BARBU" })).toBeVisible();
});
