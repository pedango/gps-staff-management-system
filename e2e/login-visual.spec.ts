import { expect, test } from "@playwright/test";

test.describe("Login page visual", () => {
  test("1366x768 screenshot", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/login", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /Welcome Back/i })).toBeVisible();
    await expect(page).toHaveScreenshot("login-1366x768.png", {
      fullPage: true,
      maxDiffPixels: 250,
    });
  });

  test("mobile viewport screenshot", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login", { waitUntil: "load" });
    await expect(page.getByRole("button", { name: /Sign in to dashboard/i })).toBeVisible();
    await expect(page).toHaveScreenshot("login-mobile.png", {
      fullPage: true,
      maxDiffPixels: 400,
    });
  });
});
