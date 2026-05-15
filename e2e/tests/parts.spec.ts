import { expect, test } from "@playwright/test";
import { createApiClient, createTestUser, loginViaUi, testEmail } from "../lib/api";

// Set 10297-1 (Boutique Hotel) has 5 SetPart rows seeded by SetPartSeeder
// (4 non-spare + 1 spare). Adding a family-set for this set is the only
// way to populate the missing-parts shortfall list without a real
// Rebrickable API key.
const SET_WITH_PARTS = "10297-1";

test.describe("Parts", () => {
  let email: string;
  let password: string;

  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "WebKit restricts cross-origin cookies in CI");

    email = testEmail();
    password = "password123";

    await createTestUser(email, password);
    await loginViaUi(page, email, password);
  });

  test("parts inventory shows the empty state for a new family", async ({ page }) => {
    await page.goto("/parts");

    await expect(page.getByRole("heading", { name: "Parts Inventory" })).toBeVisible();
    // EmptyState message comes from translation key parts.noParts (lines 194-196
    // in families/services/translation.ts).
    await expect(
      page.getByText("No loose bricks yet. Assign parts from a set's detail page to start sorting."),
    ).toBeVisible();
  });

  test("inventory CTAs route to missing-list and parts-to-place pages", async ({ page }) => {
    await page.goto("/parts");

    await page.getByTestId("parts-missing-cta").click();
    await page.waitForURL(/\/parts\/missing$/);
    await expect(page.getByRole("heading", { name: "Master Shopping List" })).toBeVisible();

    await page.goto("/parts");
    await page.getByTestId("parts-unsorted-cta").click();
    await page.waitForURL(/\/parts\/unsorted$/);
    await expect(page.getByRole("heading", { name: "Parts to Place" })).toBeVisible();
  });

  test("missing-list shows shortfall summary after adding a family-set", async ({ page }) => {
    const api = createApiClient(page);
    await api.post("/family-sets", {
      set_num: SET_WITH_PARTS,
      quantity: 1,
      status: "sealed",
    });

    await page.goto("/parts/missing");

    await expect(page.getByRole("heading", { name: "Master Shopping List" })).toBeVisible();
    // SetPartSeeder rows for set_id 1: 10+8+15+20 = 53 non-spare parts across
    // 1 set. The 5th row (qty 5, is_spare=true) is excluded — the shortfall
    // tracker is for buildable parts only. The data attributes live on the
    // inner <p>, not the wrapper testid div.
    const summary = page.getByTestId("missing-summary");
    await expect(summary).toBeVisible();
    const summaryLine = summary.locator("[data-total-shortfall]");
    await expect(summaryLine).toHaveAttribute("data-total-shortfall", "53");
    await expect(summaryLine).toHaveAttribute("data-affected-sets", "1");
  });

  test("parts-to-place lists shortfalls and shows the export CSV button", async ({ page }) => {
    const api = createApiClient(page);
    await api.post("/family-sets", {
      set_num: SET_WITH_PARTS,
      quantity: 1,
      status: "sealed",
    });

    await page.goto("/parts/unsorted");

    await expect(page.getByRole("heading", { name: "Parts to Place" })).toBeVisible();
    // The same 4 non-spare SetPart rows surface as 4 place-triggers.
    await expect(page.getByTestId("unsorted-place-trigger")).toHaveCount(4);
    // The summary is only rendered when entries > 0.
    await expect(page.getByTestId("unsorted-summary")).toBeVisible();
    // Export button appears when there's something to export.
    await expect(page.getByTestId("export-csv")).toBeVisible();
  });

  test("place-part flow moves a part from unsorted into a storage location", async ({ page }) => {
    const api = createApiClient(page);

    // Set up: family owns one Boutique Hotel, has one storage bin.
    await api.post("/family-sets", {
      set_num: SET_WITH_PARTS,
      quantity: 1,
      status: "sealed",
    });
    const storage = await api.post<{ id: number; name: string }>("/storage-options", {
      name: "Drawer A",
      description: null,
      parent_id: null,
      row: null,
      column: null,
    });

    await page.goto("/parts/unsorted");
    await expect(page.getByRole("heading", { name: "Parts to Place" })).toBeVisible();
    await expect(page.getByTestId("unsorted-place-trigger").first()).toBeVisible();

    // Open the modal for the first unsorted entry.
    await page.getByTestId("unsorted-place-trigger").first().click();

    // The PlacePartModal label "Storage location" comes from the
    // sets.selectStorage translation key (line 133).
    const storageSelect = page.getByLabel("Storage location");
    await expect(storageSelect).toBeVisible();
    await storageSelect.selectOption({ label: "Drawer A" });

    // Wait for the POST so the modal's @assigned event has fired before we
    // query the API. waitForResponse is more reliable than a fixed delay.
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/storage-options/${storage.id}/parts`) &&
          response.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Place in storage" }).click(),
    ]);

    // Verify the part was assigned: the API returns the storage's parts.
    // We could also verify by visiting the storage detail page UI, but the
    // API call is the sovereign confirmation that the assignment persisted.
    const storageParts = await api.get<unknown[]>(`/storage-options/${storage.id}/parts`);
    expect(storageParts.length).toBeGreaterThan(0);
  });

  test("parts inventory page shows stored parts after a place-part flow", async ({ page }) => {
    // The whole loop: own a set → place one of its parts in storage →
    // the part appears on the global parts inventory page.
    const api = createApiClient(page);

    await api.post("/family-sets", {
      set_num: SET_WITH_PARTS,
      quantity: 1,
      status: "sealed",
    });
    const storage = await api.post<{ id: number }>("/storage-options", {
      name: "Drawer A",
      description: null,
      parent_id: null,
      row: null,
      column: null,
    });

    // First SetPartSeeder row: set_id=1, part_id=1, color_id=1, quantity=10.
    await api.post(`/storage-options/${storage.id}/parts`, {
      part_id: 1,
      color_id: 1,
      quantity: 10,
    });

    await page.goto("/parts");
    await expect(page.getByRole("heading", { name: "Parts Inventory" })).toBeVisible();
    // The seeded part 1 is "Brick 2 x 4" (PartSeeder line 17). With at least
    // one part stored, the empty-state must NOT be rendered.
    await expect(
      page.getByText("No loose bricks yet. Assign parts from a set's detail page to start sorting."),
    ).not.toBeVisible();
    await expect(page.getByText("Brick 2 x 4")).toBeVisible();
  });
});
