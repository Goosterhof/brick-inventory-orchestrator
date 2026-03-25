import { expect, test } from "@playwright/test";
import { createTestUser, testEmail } from "../lib/api";

test.describe("Authentication", () => {
  test("can register a new account", async ({ page }) => {
    const email = testEmail();
    const password = "password123";

    await page.goto("/register");

    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();

    await page.getByRole("textbox", { name: /family name/i }).fill("Test Family");
    await page.getByRole("textbox", { name: /^name/i }).fill("Test User");
    await page.getByRole("textbox", { name: /email/i }).fill(email);
    await page.getByRole("textbox", { name: /^password$/i }).fill(password);
    await page.getByRole("textbox", { name: /password confirmation/i }).fill(password);

    await page.getByRole("button", { name: "Register" }).click();

    // After successful registration, the user should be redirected away from /register
    await page.waitForURL((url) => !url.pathname.includes("/register"), { timeout: 10000 });

    // Verify we landed on an authenticated page (not redirected back to login)
    await expect(page.getByRole("button", { name: /logout|sign\s*out/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test("can login with existing user", async ({ page }) => {
    const email = testEmail();
    const password = "password123";

    await createTestUser(email, password);

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

    await createTestUser(email, password);

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
