import { expect, test } from "@playwright/test";
import { createTestUser, loginViaUi, testEmail } from "../lib/api";

test.describe("Settings", () => {
  let email: string;
  let password: string;

  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "WebKit restricts cross-origin cookies in CI");

    email = testEmail();
    password = "password123";

    createTestUser(email, password);
    await loginViaUi(page, email, password);
  });

  test("renders the page sections for a family head", async ({ page }) => {
    await page.goto("/settings");

    await expect(page.getByRole("heading", { name: "Settings", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Appearance" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Family members" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Invite Code" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Rebrickable API" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Import collection" })).toBeVisible();
  });

  test("saves the Rebrickable user token and surfaces the success message", async ({ page }) => {
    await page.goto("/settings");

    await expect(page.getByRole("heading", { name: "Rebrickable API" })).toBeVisible();

    const tokenInput = page.getByLabel("Rebrickable user token");
    await expect(tokenInput).toBeVisible();
    await tokenInput.fill("e2e-test-rebrickable-token-abc123");

    // Wait for the PUT to complete so the assertion below catches the
    // success message after the request resolves.
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/family/rebrickable-token") &&
          response.request().method() === "PUT",
      ),
      page.getByRole("button", { name: "Save token" }).click(),
    ]);

    await expect(page.getByText("Token saved successfully.")).toBeVisible();
  });
});
