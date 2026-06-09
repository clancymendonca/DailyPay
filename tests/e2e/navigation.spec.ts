import { test, expect } from "@playwright/test";

test("sign-in page loads", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
});

test("protected route redirects to sign-in", async ({ page }) => {
  await page.goto("/my-banks");
  await expect(page).toHaveURL(/sign-in/);
});
