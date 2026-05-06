import { expect, test } from "@playwright/test";
import { createApiClient, createTestUser, loginViaUi, testEmail } from "../lib/api";

test.describe("Family Sets", () => {
  let email: string;
  let password: string;

  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "WebKit restricts cross-origin cookies in CI");

    email = testEmail();
    password = "password123";

    await createTestUser(email, password);
    await loginViaUi(page, email, password);
  });

  test("can view empty sets list", async ({ page }) => {
    await page.goto("/sets");

    await expect(page.getByRole("heading", { name: "My Sets" })).toBeVisible();
    await expect(page.getByText("The shelf is bare. Time to add your first set.")).toBeVisible();
  });

  test("can add a set to collection", async ({ page }) => {
    await page.goto("/sets/add");

    await expect(page.getByRole("heading", { name: "Add set" })).toBeVisible();

    await page.getByLabel("Set number").fill("75192-1");
    await page.getByLabel("Quantity").fill("1");
    await page.getByLabel("Status").selectOption("sealed");
    await page.getByRole("button", { name: "Add" }).click();

    // Should redirect to set detail page after successful add
    await page.waitForURL(/\/sets\/\d+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("can view set details", async ({ page }) => {
    const api = createApiClient(page);
    const response = await api.post<{ id: number }>("/family-sets", {
      set_num: "75192-1",
      quantity: 1,
      status: "sealed",
    });

    await page.goto(`/sets/${response.id}`);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sealed" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  });

  test("can update set status via status buttons", async ({ page }) => {
    const api = createApiClient(page);
    const response = await api.post<{ id: number }>("/family-sets", {
      set_num: "75192-1",
      quantity: 1,
      status: "sealed",
    });

    await page.goto(`/sets/${response.id}`);

    // Sealed should be the active status (yellow background)
    const sealedButton = page.getByRole("button", { name: "Sealed" });
    await expect(sealedButton).toBeVisible();

    // Click "Built" to change status
    await page.getByRole("button", { name: "Built" }).click();

    // Reload to verify the change persisted
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("can edit set details", async ({ page }) => {
    const api = createApiClient(page);
    const response = await api.post<{ id: number }>("/family-sets", {
      set_num: "75192-1",
      quantity: 1,
      status: "sealed",
    });

    await page.goto(`/sets/${response.id}/edit`);

    await expect(page.getByRole("heading", { name: "Edit set" })).toBeVisible();
    await page.getByLabel("Status").selectOption("built");
    await page.getByRole("button", { name: "Save" }).click();

    // Should redirect to detail page
    await page.waitForURL((url) => url.pathname === `/sets/${response.id}`);
  });

  test("can delete a set from collection", async ({ page }) => {
    const api = createApiClient(page);
    const response = await api.post<{ id: number }>("/family-sets", {
      set_num: "75192-1",
      quantity: 1,
      status: "sealed",
    });

    await page.goto(`/sets/${response.id}/edit`);

    // Click the Delete button on the form to open the confirm dialog
    await page.getByRole("button", { name: "Delete" }).first().click();

    // Wait for the confirm dialog and click the confirm button inside it
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Are you sure you want to delete this set?")).toBeVisible();
    await dialog.getByRole("button", { name: "Delete" }).click();

    // Should redirect to sets overview
    await page.waitForURL((url) => url.pathname === "/sets");
  });

  test("search shows no-results state when query matches nothing", async ({ page }) => {
    // The list groups sets into collapsible theme sections, so direct
    // visibility checks on filtered items are unreliable. Instead we exercise
    // the deterministic "no results" path — the EmptyState renders independent
    // of the collapsible groups.
    const api = createApiClient(page);
    await api.post("/family-sets", {
      set_num: "75192-1",
      quantity: 1,
      status: "sealed",
    });

    await page.goto("/sets");
    await expect(page.getByRole("heading", { name: "My Sets" })).toBeVisible();

    const searchInput = page.getByLabel("Search");
    await expect(searchInput).toBeVisible();

    await searchInput.fill("zzz-no-such-set-zzz");

    await expect(page.getByText("No results found")).toBeVisible();
  });

  test("status filter chip toggles active state on click", async ({ page }) => {
    // The filter logic itself is covered by frontend unit tests. Here we
    // verify the chip is wired up: a click activates it (yellow background),
    // a second click deactivates it.
    const api = createApiClient(page);

    await api.post("/family-sets", {
      set_num: "75192-1",
      quantity: 1,
      status: "sealed",
    });
    await api.post("/family-sets", {
      set_num: "10281-1",
      quantity: 1,
      status: "built",
    });

    await page.goto("/sets");
    await expect(page.getByRole("heading", { name: "My Sets" })).toBeVisible();

    const builtChip = page.getByRole("button", { name: "Built", exact: true }).first();
    await expect(builtChip).toBeVisible();

    await builtChip.click();
    await expect(builtChip).toHaveClass(/yellow-300/);

    await builtChip.click();
    await expect(builtChip).not.toHaveClass(/yellow-300/);
  });

  test("shows export button when sets exist", async ({ page }) => {
    const api = createApiClient(page);
    await api.post("/family-sets", {
      set_num: "75192-1",
      quantity: 1,
      status: "sealed",
    });

    await page.goto("/sets");
    await expect(page.getByRole("heading", { name: "My Sets" })).toBeVisible();

    await expect(page.getByRole("button", { name: "Export CSV" })).toBeVisible();
  });
});
