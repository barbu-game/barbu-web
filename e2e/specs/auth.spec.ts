import { test, expect } from "@playwright/test";
import { AuthBarPage } from "../pages/AuthBar";
import { uniqueName } from "../helpers/api";

test("register signs the user in, then logout signs them out", async ({ page }) => {
  const u = uniqueName("acct");
  await page.goto("/");
  const auth = new AuthBarPage(page);
  await auth.register(u, "s3cret-pw");
  await expect(page.getByTestId("auth-user")).toContainText(u);
  await auth.logout();
  await expect(page.getByTestId("auth-username")).toBeVisible();
});

test("login then reload keeps the session (localStorage)", async ({ page }) => {
  const u = uniqueName("acct");
  await page.goto("/");
  const auth = new AuthBarPage(page);
  await auth.register(u, "s3cret-pw");
  await expect(page.getByTestId("auth-user")).toContainText(u);
  await page.reload();
  await expect(page.getByTestId("auth-user")).toContainText(u);
});

test("a guest can create a table without an account", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("name-input").fill("GuestOnly");
  await page.getByTestId("player-count").selectOption("2");
  await page.getByTestId("create-table").click();
  await expect(page.getByTestId("room-code")).toBeVisible();
});
