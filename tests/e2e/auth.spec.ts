import { test, expect } from "@playwright/test";

test("invalid credentials show error toast", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByPlaceholder("Enter your email").fill("invalid@example.com");
  await page.getByPlaceholder("Enter your password").fill("wrongpassword");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByText(/invalid|failed|error/i)).toBeVisible({ timeout: 10_000 });
});
