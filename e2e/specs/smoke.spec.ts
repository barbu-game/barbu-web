import { test, expect } from "@playwright/test";

test("le stack boote et la home s'affiche", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "LE BARBU" })).toBeVisible();
});
