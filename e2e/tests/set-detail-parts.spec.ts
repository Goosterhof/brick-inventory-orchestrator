import { expect, test } from "@playwright/test";
import { createApiClient, createTestUser, loginViaUi, testEmail } from "../lib/api";

// 10297-1 (Boutique Hotel) is seeded with 5 SetPart rows (4 non-spare + 1 spare),
// and the parts-sync migration backfills `parts_sync_status='completed'` for any
// set that already has rows in set_parts. That means the `/sets/{setNum}/parts`
// endpoint returns a 200 with the full SetWithParts payload — no Rebrickable
// round-trip, no 202 polling state — which is what we need to exercise the
// "Load parts" UI deterministically.
const SET_WITH_PARTS = "10297-1";

test.describe("Set detail — load parts", () => {
  let email: string;
  let password: string;

  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "WebKit restricts cross-origin cookies in CI");

    email = testEmail();
    password = "password123";

    await createTestUser(email, password);
    await loginViaUi(page, email, password);
  });

  test('"Load parts" button is visible before parts are loaded', async ({ page }) => {
    const api = createApiClient(page);
    const { id } = await api.post<{ id: number }>("/family-sets", {
      set_num: SET_WITH_PARTS,
      quantity: 1,
      status: "sealed",
    });

    await page.goto(`/sets/${id}`);

    await expect(page.getByRole("heading", { name: "Boutique Hotel" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Load parts" })).toBeVisible();
  });

  test("clicking Load parts populates the parts list and build check", async ({ page }) => {
    const api = createApiClient(page);
    const { id } = await api.post<{ id: number }>("/family-sets", {
      set_num: SET_WITH_PARTS,
      quantity: 1,
      status: "sealed",
    });

    await page.goto(`/sets/${id}`);
    await expect(page.getByRole("button", { name: "Load parts" })).toBeVisible();

    // Wait for both API calls the page fires when Load parts is clicked.
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/sets/${SET_WITH_PARTS}/parts`) && response.status() === 200,
      ),
      page.getByRole("button", { name: "Load parts" }).click(),
    ]);

    // 4 non-spare SetPart rows for set_id=1 in SetPartSeeder.
    await expect(page.getByRole("heading", { name: /^Parts \(4\)/ })).toBeVisible();

    // Spare parts section: 1 spare row in SetPartSeeder.
    // The translation key `sets.spareParts` resolves to "Spare" — the heading
    // renders the literal "Spare (1)" with uppercase CSS, but accessible-name
    // is based on the underlying text content.
    await expect(page.getByRole("heading", { name: /^Spare \(1\)/ })).toBeVisible();

    // Build check appears once parts AND storage-map have resolved (build stats
    // require storage-map to be non-empty OR explicitly empty; the page renders
    // the section only when storageMap.length > 0). With no parts in storage,
    // buildStats is null and the build-check card is intentionally hidden.
    // Instead, assert the seeded part names render in the list.
    await expect(page.getByText("Brick 2 x 4")).toBeVisible();
    await expect(page.getByText("Brick 2 x 3")).toBeVisible();
  });

  test("Load parts button disappears after parts have loaded", async ({ page }) => {
    const api = createApiClient(page);
    const { id } = await api.post<{ id: number }>("/family-sets", {
      set_num: SET_WITH_PARTS,
      quantity: 1,
      status: "sealed",
    });

    await page.goto(`/sets/${id}`);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/sets/${SET_WITH_PARTS}/parts`) && response.status() === 200,
      ),
      page.getByRole("button", { name: "Load parts" }).click(),
    ]);

    await expect(page.getByRole("heading", { name: /^Parts \(4\)/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Load parts" })).not.toBeVisible();
  });

  test("build check appears once a part is placed in storage", async ({ page }) => {
    const api = createApiClient(page);
    const { id } = await api.post<{ id: number }>("/family-sets", {
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
    // Drop one of the seeded parts into storage so the storage-map endpoint
    // returns a non-empty entries array and buildStats becomes truthy.
    // First SetPartSeeder row: set_id=1, part_id=1, color_id=1, quantity=10.
    await api.post(`/storage-options/${storage.id}/parts`, {
      part_id: 1,
      color_id: 1,
      quantity: 10,
    });

    await page.goto(`/sets/${id}`);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/sets/${SET_WITH_PARTS}/storage-map`) &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Load parts" }).click(),
    ]);

    await expect(page.getByRole("heading", { name: "Build check" })).toBeVisible();
    // 4 unique non-spare parts seeded, only 1 fully covered (part 1 / color 1,
    // qty 10 placed for qty 10 needed). The others remain short.
    await expect(page.getByText("Missing parts")).toBeVisible();
  });
});
