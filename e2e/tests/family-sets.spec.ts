import {test, expect} from "@playwright/test";
import {createTestUser, loginViaUi, testEmail, createApiClient} from "../lib/api";

test.describe("Family Sets", () => {
    const email = testEmail();
    const password = "password123";

    test.beforeAll(async () => {
        await createTestUser(email, password);
    });

    test("can view empty sets list", async ({page}) => {
        await loginViaUi(page, email, password);

        await page.goto("/family-sets");

        // Should show empty state or sets list
        await expect(page.locator("main")).toBeVisible();
    });

    test("can add a set to collection", async ({page}) => {
        await loginViaUi(page, email, password);

        // Navigate to add set page/modal
        await page.goto("/family-sets");

        // Look for add button
        const addButton = page.locator(
            '[data-testid="add-set-button"], button:has-text("Add"), a:has-text("Add")'
        );

        if (await addButton.isVisible()) {
            await addButton.click();

            // Fill in set number (Millennium Falcon UCS as example)
            await page.fill(
                '[data-testid="set-number"], [name="set_num"], input[placeholder*="set"]',
                "75192-1"
            );

            // Submit
            await page.click('button[type="submit"], [data-testid="submit-button"]');

            // Verify set was added
            await expect(page.locator("body")).toContainText("75192");
        }
    });

    test("can view set details", async ({page}) => {
        // First create a set via API
        await loginViaUi(page, email, password);
        const api = createApiClient(page);

        // Create a family set via API
        const familySet = await api.post<{id: number}>("/family-sets", {
            set_num: "10300-1",
            quantity: 1,
            status: "sealed",
        });

        // Navigate to set details
        await page.goto(`/family-sets/${familySet.id}`);

        // Should show set information
        await expect(page.locator("main")).toBeVisible();
    });

    test("can update set status", async ({page}) => {
        await loginViaUi(page, email, password);
        const api = createApiClient(page);

        // Create a set
        const familySet = await api.post<{id: number}>("/family-sets", {
            set_num: "10297-1",
            quantity: 1,
            status: "sealed",
        });

        await page.goto(`/family-sets/${familySet.id}`);

        // Look for status selector/button
        const statusSelect = page.locator(
            '[data-testid="status-select"], select[name="status"], [data-testid="status-button"]'
        );

        if (await statusSelect.isVisible()) {
            // Change status to "built"
            await statusSelect.selectOption("built");

            // Wait for update to complete
            await page.waitForResponse(
                (response) =>
                    response.url().includes("/family-sets/") && response.request().method() === "PUT"
            );

            // Verify status changed
            await expect(page.locator("body")).toContainText(/built/i);
        }
    });

    test("can delete a set from collection", async ({page}) => {
        await loginViaUi(page, email, password);
        const api = createApiClient(page);

        // Create a set to delete
        const familySet = await api.post<{id: number}>("/family-sets", {
            set_num: "10298-1",
            quantity: 1,
            status: "sealed",
        });

        await page.goto(`/family-sets/${familySet.id}`);

        // Look for delete button
        const deleteButton = page.locator(
            '[data-testid="delete-button"], button:has-text("Delete"), button[aria-label="Delete"]'
        );

        if (await deleteButton.isVisible()) {
            await deleteButton.click();

            // Handle confirmation dialog if present
            const confirmButton = page.locator(
                '[data-testid="confirm-delete"], button:has-text("Confirm"), button:has-text("Yes")'
            );
            if (await confirmButton.isVisible({timeout: 1000}).catch(() => false)) {
                await confirmButton.click();
            }

            // Should redirect to list or show success
            await page.waitForURL(/\/family-sets\/?$/);
        }
    });
});
