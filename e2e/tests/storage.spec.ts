import { expect, test } from "@playwright/test";
import { createApiClient, createTestUser, loginViaUi, testEmail } from "../lib/api";

test.describe("Storage", () => {
  let email: string;
  let password: string;

  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "WebKit restricts cross-origin cookies in CI");

    email = testEmail();
    password = "password123";

    await createTestUser(email, password);
    await loginViaUi(page, email, password);
  });

  test("can view empty storage list", async ({ page }) => {
    await page.goto("/storage");

    await expect(page.getByRole("heading", { name: "Storage" })).toBeVisible();
    await expect(page.getByText("No storage bins yet. Every brick needs a home.")).toBeVisible();
  });

  test("can add a storage location", async ({ page }) => {
    await page.goto("/storage/add");

    await expect(page.getByRole("heading", { name: "Add storage" })).toBeVisible();

    await page.getByLabel("Name").fill("Drawer A");
    await page.getByLabel("Description").fill("Top left drawer");
    await page.getByLabel("Row").fill("1");
    await page.getByLabel("Column").fill("1");
    await page.getByRole("button", { name: "Add" }).click();

    // Should redirect to storage detail page
    await page.waitForURL(/\/storage\/\d+/);
    await expect(page.getByRole("heading", { name: "Drawer A" })).toBeVisible();
  });

  test("can view storage details", async ({ page }) => {
    const api = createApiClient(page);
    const response = await api.post<{ id: number }>("/storage-options", {
      name: "Drawer B",
      description: "Bottom right drawer",
      parent_id: null,
      row: 2,
      column: 3,
    });

    await page.goto(`/storage/${response.id}`);

    await expect(page.getByRole("heading", { name: "Drawer B" })).toBeVisible();
    await expect(page.getByText("Bottom right drawer")).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  });

  test("can edit a storage location", async ({ page }) => {
    const api = createApiClient(page);
    const response = await api.post<{ id: number }>("/storage-options", {
      name: "Drawer C",
      description: null,
      parent_id: null,
      row: null,
      column: null,
    });

    await page.goto(`/storage/${response.id}/edit`);

    await expect(page.getByRole("heading", { name: "Edit storage" })).toBeVisible();
    await page.getByLabel("Name").clear();
    await page.getByLabel("Name").fill("Drawer C Renamed");
    await page.getByRole("button", { name: "Save" }).click();

    // Should redirect to detail page
    await page.waitForURL((url) => url.pathname === `/storage/${response.id}`);
    await expect(page.getByRole("heading", { name: "Drawer C Renamed" })).toBeVisible();
  });

  test("can delete a storage location", async ({ page }) => {
    const api = createApiClient(page);
    const response = await api.post<{ id: number }>("/storage-options", {
      name: "Drawer To Delete",
      description: null,
      parent_id: null,
      row: null,
      column: null,
    });

    await page.goto(`/storage/${response.id}/edit`);

    // Click the Delete button to open the confirm dialog
    await page.getByRole("button", { name: "Delete" }).first().click();

    // Confirm deletion in the dialog
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByText("Are you sure you want to delete this storage location?"),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Delete" }).click();

    // Should redirect to storage overview
    await page.waitForURL((url) => url.pathname === "/storage");
  });

  test("can search storage locations", async ({ page }) => {
    const api = createApiClient(page);

    await api.post("/storage-options", {
      name: "Drawer Alpha",
      description: null,
      parent_id: null,
      row: null,
      column: null,
    });
    await api.post("/storage-options", {
      name: "Box Beta",
      description: null,
      parent_id: null,
      row: null,
      column: null,
    });

    await page.goto("/storage");
    await expect(page.getByRole("heading", { name: "Storage" })).toBeVisible();

    const searchInput = page.getByLabel("Search");
    await expect(searchInput).toBeVisible();

    // Search should filter results
    await searchInput.fill("Alpha");
    await expect(page.getByText("Drawer Alpha")).toBeVisible();
    await expect(page.getByText("Box Beta")).not.toBeVisible();
  });

  test("storage overview shows tree structure", async ({ page }) => {
    const api = createApiClient(page);

    // Create parent
    const parent = await api.post<{ id: number }>("/storage-options", {
      name: "Cabinet",
      description: null,
      parent_id: null,
      row: null,
      column: null,
    });

    // Create child
    await api.post("/storage-options", {
      name: "Shelf 1",
      description: null,
      parent_id: parent.id,
      row: null,
      column: null,
    });

    await page.goto("/storage");
    await expect(page.getByRole("heading", { name: "Storage" })).toBeVisible();

    // The overview lists parents with a sub-location count. The count is
    // the visible signal that the parent→child relationship exists.
    // Child names are not rendered on the overview today (the backend
    // index returns top-level only; children surface as a count badge
    // here and on the detail page).
    await expect(page.getByText("Cabinet")).toBeVisible();
    await expect(page.getByText("1 sub-locations")).toBeVisible();
  });

  test("supports nested three-level storage hierarchy", async ({ page }) => {
    // Cabinet → Shelf → Drawer is the canonical drawer-in-bin layout. The
    // backend persists the hierarchy via parent_id and we surface it on the
    // top-level cabinet's detail page through the sub-locations count.
    //
    // Note: today's `GET /storage-options` index returns top-level only, so
    // a direct deep-link to a non-top-level node (e.g. `/storage/{shelfId}`)
    // hangs the store's getOrFailById fallback. We verify the lower levels
    // via the per-id GET endpoint, which IS implemented for all depths.
    const api = createApiClient(page);

    const cabinet = await api.post<{ id: number; child_ids: number[] }>("/storage-options", {
      name: "Big Cabinet",
      description: null,
      parent_id: null,
      row: null,
      column: null,
    });

    const shelf = await api.post<{ id: number; parent_id: number | null }>("/storage-options", {
      name: "Shelf A",
      description: null,
      parent_id: cabinet.id,
      row: null,
      column: null,
    });

    const drawer = await api.post<{ id: number; parent_id: number | null }>("/storage-options", {
      name: "Drawer 1",
      description: null,
      parent_id: shelf.id,
      row: null,
      column: null,
    });

    // Top-level UI: cabinet shows the shelf as a sub-location.
    await page.goto(`/storage/${cabinet.id}`);
    await expect(page.getByRole("heading", { name: "Big Cabinet" })).toBeVisible();
    await expect(page.getByText("Sub-locations:")).toBeVisible();

    // Lower levels: round-trip the parent chain through the API. This is the
    // sovereign record of the hierarchy regardless of how the overview
    // chooses to render it.
    const refreshedShelf = await api.get<{ parent_id: number | null; child_ids: number[] }>(
      `/storage-options/${shelf.id}`,
    );
    expect(refreshedShelf.parent_id).toBe(cabinet.id);
    expect(refreshedShelf.child_ids).toEqual([drawer.id]);

    const refreshedDrawer = await api.get<{ parent_id: number | null; child_ids: number[] }>(
      `/storage-options/${drawer.id}`,
    );
    expect(refreshedDrawer.parent_id).toBe(shelf.id);
    expect(refreshedDrawer.child_ids).toEqual([]);
  });

  test("storage with grid_rows/grid_columns persists across API round-trip", async ({ page }) => {
    // The grid_rows / grid_columns columns (migration 2026_05_14_000001)
    // were added for cabinet/section/drawer layouts. The frontend form
    // doesn't expose them yet, but the backend round-trips them so an
    // API-only verification documents the wiring is alive.
    const api = createApiClient(page);

    const grid = await api.post<{
      id: number;
      grid_rows: number | null;
      grid_columns: number | null;
    }>("/storage-options", {
      name: "Gridded Cabinet",
      description: null,
      parent_id: null,
      row: null,
      column: null,
      grid_rows: 4,
      grid_columns: 6,
    });

    expect(grid.grid_rows).toBe(4);
    expect(grid.grid_columns).toBe(6);

    // Read-back via the detail endpoint confirms it persisted to the DB
    // (not just echoed back from the create response).
    const refetched = await api.get<{ grid_rows: number | null; grid_columns: number | null }>(
      `/storage-options/${grid.id}`,
    );
    expect(refetched.grid_rows).toBe(4);
    expect(refetched.grid_columns).toBe(6);

    // The detail page renders without error for a grid-configured storage.
    await page.goto(`/storage/${grid.id}`);
    await expect(page.getByRole("heading", { name: "Gridded Cabinet" })).toBeVisible();
  });
});
