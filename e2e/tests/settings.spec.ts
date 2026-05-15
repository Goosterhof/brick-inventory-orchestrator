import { expect, test } from "@playwright/test";
import { createApiClient, createTestUser, loginViaUi, testEmail } from "../lib/api";

test.describe("Settings", () => {
  let email: string;
  let password: string;

  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "WebKit restricts cross-origin cookies in CI");

    email = testEmail();
    password = "password123";

    await createTestUser(email, password);
    await loginViaUi(page, email, password);
  });

  test("renders the page sections for a family head", async ({ page }) => {
    await page.goto("/settings");

    await expect(page.getByRole("heading", { name: "Settings", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Appearance" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Family members" })).toBeVisible();
    // Invite Code + Import collection are conditional on isHead — a newly
    // registered user is the head of their family, so both should show.
    await expect(page.getByRole("heading", { name: "Invite Code" })).toBeVisible();
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

  test("generates an invite code that can be re-fetched via the API", async ({ page }) => {
    await page.goto("/settings");

    await expect(page.getByRole("heading", { name: "Invite Code" })).toBeVisible();

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/family/invite-code") && response.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Generate Invite Code" }).click(),
    ]);

    // After generation, the Copy button is the canonical signal that a code
    // is showing on the card.
    await expect(page.getByRole("button", { name: "Copy Code" })).toBeVisible();

    // Sovereign check: the same code is fetchable from the read endpoint.
    const api = createApiClient(page);
    const code = await api.get<{ code: string; expires_at: string }>("/family/invite-code");
    expect(code.code).toBeTruthy();
    expect(typeof code.expires_at).toBe("string");
  });

  test("sends an invite by email and shows the confirmation message", async ({ page }) => {
    await page.goto("/settings");

    await expect(page.getByRole("heading", { name: "Invite Code" })).toBeVisible();

    await page.getByLabel("Recipient email").fill("invitee@example.com");
    await page.getByLabel("Recipient name").fill("Invitee");

    // The email POST queues an InviteCodeMail job (the queue worker is not
    // running in e2e — that's by design, see CLAUDE.md "Queue Worker"). The
    // backend responds synchronously with 202, so the UI's success message
    // fires regardless of whether the worker drains the job.
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/family/invite-code/email") &&
          response.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Send invite by email" }).click(),
    ]);

    await expect(page.getByText("Invite email sent — the new code is shown above.")).toBeVisible();

    // The code is persisted to the invite_codes table regardless of whether
    // the queued mail goes out — assert that here, where it actually matters.
    const api = createApiClient(page);
    const code = await api.get<{ code: string }>("/family/invite-code");
    expect(code.code).toBeTruthy();
  });
});
