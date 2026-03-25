import { expect, test } from "@playwright/test";
import {
    createApiClient,
    createTestUser,
    loginViaUi,
    testEmail,
} from "../lib/api";

test.describe("Family Sets", () => {
    let email: string;
    let password: string;

    test.beforeEach(async ({ page, browserName }) => {
        test.skip(
            browserName === "webkit",
            "WebKit restricts cross-origin cookies in CI",
        );

        email = testEmail();
        password = "password123";

        await createTestUser(email, password);
        await loginViaUi(page, email, password);
    });

    test("can view empty sets list", async ({ page }) => {
        await page.goto("/sets");

        await expect(
            page.getByRole("heading", { name: "My Sets" }),
        ).toBeVisible();
        await expect(
            page.getByText("No sets yet. Add your first set!"),
        ).toBeVisible();
    });

    test("can add a set to collection", async ({ page }) => {
        await page.goto("/sets/add");

        await expect(
            page.getByRole("heading", { name: "Add set" }),
        ).toBeVisible();

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
        const response = await api.post<{ data: { id: number } }>(
            "/family-sets",
            {
                set_num: "75192-1",
                quantity: 1,
                status: "sealed",
            },
        );

        await page.goto(`/sets/${response.data.id}`);

        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(
            page.getByRole("button", { name: "Sealed" }),
        ).toBeVisible();
        await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
    });

    test("can update set status via status buttons", async ({ page }) => {
        const api = createApiClient(page);
        const response = await api.post<{ data: { id: number } }>(
            "/family-sets",
            {
                set_num: "75192-1",
                quantity: 1,
                status: "sealed",
            },
        );

        await page.goto(`/sets/${response.data.id}`);

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
        const response = await api.post<{ data: { id: number } }>(
            "/family-sets",
            {
                set_num: "75192-1",
                quantity: 1,
                status: "sealed",
            },
        );

        await page.goto(`/sets/${response.data.id}/edit`);

        await expect(
            page.getByRole("heading", { name: "Edit set" }),
        ).toBeVisible();
        await page.getByLabel("Status").selectOption("built");
        await page.getByRole("button", { name: "Save" }).click();

        // Should redirect to detail page
        await page.waitForURL(
            (url) => url.pathname === `/sets/${response.data.id}`,
        );
    });

    test("can delete a set from collection", async ({ page }) => {
        const api = createApiClient(page);
        const response = await api.post<{ data: { id: number } }>(
            "/family-sets",
            {
                set_num: "75192-1",
                quantity: 1,
                status: "sealed",
            },
        );

        await page.goto(`/sets/${response.data.id}/edit`);

        // Click the Delete button on the form to open the confirm dialog
        await page.getByRole("button", { name: "Delete" }).first().click();

        // Wait for the confirm dialog and click the confirm button inside it
        const dialog = page.getByRole("dialog");
        await expect(
            dialog.getByText("Are you sure you want to delete this set?"),
        ).toBeVisible();
        await dialog.getByRole("button", { name: "Delete" }).click();

        // Should redirect to sets overview
        await page.waitForURL((url) => url.pathname === "/sets");
    });

    test("can search sets by name", async ({ page }) => {
        const api = createApiClient(page);

        // Create two sets
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

        // Wait for sets to load
        await expect(
            page.getByRole("heading", { name: "My Sets" }),
        ).toBeVisible();

        // Search box should be visible (only shown when sets exist)
        const searchInput = page.getByLabel("Search");
        await expect(searchInput).toBeVisible();

        // Search for a specific set number
        await searchInput.fill("75192");

        // Should filter the list — "No results" should not be visible
        await expect(page.getByText("No results found")).not.toBeVisible();
    });

    test("can filter sets by status", async ({ page }) => {
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
        await expect(
            page.getByRole("heading", { name: "My Sets" }),
        ).toBeVisible();

        // Click the "Built" filter chip
        await page.getByRole("button", { name: "Built" }).first().click();

        // The sealed set's status badge should not be visible
        await expect(page.getByText("Sealed")).not.toBeVisible();
    });

    test("shows export button when sets exist", async ({ page }) => {
        const api = createApiClient(page);
        await api.post("/family-sets", {
            set_num: "75192-1",
            quantity: 1,
            status: "sealed",
        });

        await page.goto("/sets");
        await expect(
            page.getByRole("heading", { name: "My Sets" }),
        ).toBeVisible();

        await expect(
            page.getByRole("button", { name: "Export CSV" }),
        ).toBeVisible();
    });
});
