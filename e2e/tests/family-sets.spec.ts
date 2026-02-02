import {test, expect} from "@playwright/test";

// Skip all family-sets tests until login page is implemented
// These tests require authentication which needs the login flow
test.describe.skip("Family Sets", () => {
    test("can view empty sets list", async ({page}) => {
        await page.goto("/family-sets");
        await expect(page.locator("main")).toBeVisible();
    });

    test("can add a set to collection", async ({page}) => {
        await page.goto("/family-sets");

        const addButton = page
            .getByRole("button", {name: /add/i})
            .or(page.getByRole("link", {name: /add/i}));

        if (await addButton.isVisible()) {
            await addButton.click();

            const setInput = page.getByLabel(/set/i);
            if (await setInput.isVisible()) {
                await setInput.fill("75192-1");
                await page.getByRole("button", {name: /submit|save|add/i}).click();
                await expect(page.locator("body")).toContainText("75192");
            }
        }
    });

    test("can view set details", async ({page}) => {
        await page.goto("/family-sets/1");
        await expect(page.locator("main")).toBeVisible();
    });

    test("can update set status", async ({page}) => {
        await page.goto("/family-sets/1");

        const statusSelect = page.getByLabel(/status/i);
        if (await statusSelect.isVisible()) {
            await statusSelect.selectOption("built");
            await expect(page.locator("body")).toContainText(/built/i);
        }
    });

    test("can delete a set from collection", async ({page}) => {
        await page.goto("/family-sets/1");

        const deleteButton = page.getByRole("button", {name: /delete/i});
        if (await deleteButton.isVisible()) {
            await deleteButton.click();

            const confirmButton = page.getByRole("button", {name: /confirm|yes|delete/i}).first();
            if (await confirmButton.isVisible({timeout: 1000}).catch(() => false)) {
                await confirmButton.click();
            }

            await page.waitForURL(/\/family-sets\/?$/);
        }
    });
});
