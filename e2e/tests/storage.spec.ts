import {test, expect} from "@playwright/test";
import {createApiClient, createTestUser, loginViaUi, testEmail} from "../lib/api";

test.describe("Storage", () => {
    let email: string;
    let password: string;

    test.beforeEach(async ({page, browserName}) => {
        test.skip(browserName === "webkit", "WebKit restricts cross-origin cookies in CI");

        email = testEmail();
        password = "password123";

        await createTestUser(email, password);
        await loginViaUi(page, email, password);
    });

    test("can view empty storage list", async ({page}) => {
        await page.goto("/storage");

        await expect(page.getByRole("heading", {name: "Storage"})).toBeVisible();
        await expect(page.getByText("No storage locations yet.")).toBeVisible();
    });

    test("can add a storage location", async ({page}) => {
        await page.goto("/storage/add");

        await expect(page.getByRole("heading", {name: "Add storage"})).toBeVisible();

        await page.getByLabel("Name").fill("Drawer A");
        await page.getByLabel("Description").fill("Top left drawer");
        await page.getByLabel("Row").fill("1");
        await page.getByLabel("Column").fill("1");
        await page.getByRole("button", {name: "Add"}).click();

        // Should redirect to storage detail page
        await page.waitForURL(/\/storage\/\d+/);
        await expect(page.getByRole("heading", {name: "Drawer A"})).toBeVisible();
    });

    test("can view storage details", async ({page}) => {
        const api = createApiClient(page);
        const response = await api.post<{data: {id: number}}>("/storage-options", {
            name: "Drawer B",
            description: "Bottom right drawer",
            parent_id: null,
            row: 2,
            column: 3,
        });

        await page.goto(`/storage/${response.data.id}`);

        await expect(page.getByRole("heading", {name: "Drawer B"})).toBeVisible();
        await expect(page.getByText("Bottom right drawer")).toBeVisible();
        await expect(page.getByRole("button", {name: "Edit"})).toBeVisible();
    });

    test("can edit a storage location", async ({page}) => {
        const api = createApiClient(page);
        const response = await api.post<{data: {id: number}}>("/storage-options", {
            name: "Drawer C",
            description: null,
            parent_id: null,
            row: null,
            column: null,
        });

        await page.goto(`/storage/${response.data.id}/edit`);

        await expect(page.getByRole("heading", {name: "Edit storage"})).toBeVisible();
        await page.getByLabel("Name").clear();
        await page.getByLabel("Name").fill("Drawer C Renamed");
        await page.getByRole("button", {name: "Save"}).click();

        // Should redirect to detail page
        await page.waitForURL((url) => url.pathname === `/storage/${response.data.id}`);
        await expect(page.getByRole("heading", {name: "Drawer C Renamed"})).toBeVisible();
    });

    test("can delete a storage location", async ({page}) => {
        const api = createApiClient(page);
        const response = await api.post<{data: {id: number}}>("/storage-options", {
            name: "Drawer To Delete",
            description: null,
            parent_id: null,
            row: null,
            column: null,
        });

        await page.goto(`/storage/${response.data.id}/edit`);

        // Click the Delete button to open the confirm dialog
        await page.getByRole("button", {name: "Delete"}).first().click();

        // Confirm deletion in the dialog
        const dialog = page.getByRole("dialog");
        await expect(dialog.getByText("Are you sure you want to delete this storage location?")).toBeVisible();
        await dialog.getByRole("button", {name: "Delete"}).click();

        // Should redirect to storage overview
        await page.waitForURL((url) => url.pathname === "/storage");
    });

    test("can search storage locations", async ({page}) => {
        const api = createApiClient(page);

        await api.post("/storage-options", {name: "Drawer Alpha", description: null, parent_id: null, row: null, column: null});
        await api.post("/storage-options", {name: "Box Beta", description: null, parent_id: null, row: null, column: null});

        await page.goto("/storage");
        await expect(page.getByRole("heading", {name: "Storage"})).toBeVisible();

        const searchInput = page.getByLabel("Search");
        await expect(searchInput).toBeVisible();

        // Search should filter results
        await searchInput.fill("Alpha");
        await expect(page.getByText("Drawer Alpha")).toBeVisible();
        await expect(page.getByText("Box Beta")).not.toBeVisible();
    });

    test("storage overview shows tree structure", async ({page}) => {
        const api = createApiClient(page);

        // Create parent
        const parent = await api.post<{data: {id: number}}>("/storage-options", {
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
            parent_id: parent.data.id,
            row: null,
            column: null,
        });

        await page.goto("/storage");
        await expect(page.getByRole("heading", {name: "Storage"})).toBeVisible();

        // Both parent and child should be visible
        await expect(page.getByText("Cabinet")).toBeVisible();
        await expect(page.getByText("Shelf 1")).toBeVisible();

        // Parent should show sub-location count
        await expect(page.getByText("1 sub-locations")).toBeVisible();
    });
});
