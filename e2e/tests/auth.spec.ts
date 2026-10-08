import { expect, test } from "@playwright/test";
import { createTestUser, testEmail } from "../lib/api";

test.describe("Authentication", () => {
  test("can login with existing user", async ({ page }) => {
    const email = testEmail();
    const password = "password123";

    createTestUser(email, password);

    await page.goto("/login");

    await page.getByRole("textbox", { name: /email/i }).fill(email);
    await page.getByRole("textbox", { name: /password/i }).fill(password);
    await page.getByRole("button", { name: /log\s*in|sign\s*in|submit/i }).click();

    await page.waitForURL((url) => !url.pathname.includes("/login"));
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("textbox", { name: /email/i }).fill("nonexistent@example.com");
    await page.getByRole("textbox", { name: /password/i }).fill("wrongpassword");
    await page.getByRole("button", { name: /log\s*in|sign\s*in|submit/i }).click();

    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("can logout", async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "WebKit restricts cross-origin cookies in CI");
    const email = testEmail();
    const password = "password123";

    createTestUser(email, password);

    await page.goto("/login");
    await page.getByRole("textbox", { name: /email/i }).fill(email);
    await page.getByRole("textbox", { name: /password/i }).fill(password);
    await page.getByRole("button", { name: /log\s*in|sign\s*in|submit/i }).click();
    await page.waitForURL((url) => !url.pathname.includes("/login"));

    // Verify logout button is visible when logged in
    const logoutButton = page.getByRole("button", {
      name: /logout|sign\s*out/i,
    });
    await expect(logoutButton).toBeVisible();

    // Click logout and wait for redirect to login page
    await logoutButton.click();
    await page.waitForURL((url) => url.pathname.includes("/login"));
  });
});
