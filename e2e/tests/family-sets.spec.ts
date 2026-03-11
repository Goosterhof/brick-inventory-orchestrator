import {test, expect} from "@playwright/test";
import {createApiClient, createTestUser, loginViaUi, testEmail} from "../lib/api";

test.describe("Family Sets", () => {
    let email: string;
    let password: string;

    test.beforeEach(async ({page, browserName}) => {
        test.skip(browserName === "webkit", "WebKit restricts cross-origin cookies in CI");

        email = testEmail();
        password = "password123";

        await createTestUser(email, password);
        await loginViaUi(page, email, password);
    });

    test("can view empty sets list", async ({page}) => {
        await page.goto("/sets");

        await expect(page.getByRole("heading", {name: "Mijn Sets"})).toBeVisible();
        await expect(page.getByText("Noch geen sets")).toBeVisible();
    });

    test("can add a set to collection", async ({page}) => {
        await page.goto("/sets/add");

        await expect(page.getByRole("heading", {name: "Set toevoegen"})).toBeVisible();

        await page.getByLabel("Setnummer").fill("75192-1");
        await page.getByLabel("Aantal").fill("1");
        await page.getByLabel("Status").selectOption("sealed");
        await page.getByRole("button", {name: "Toevoegen"}).click();

        // Should redirect to set detail page after successful add
        await page.waitForURL(/\/sets\/\d+/);
        await expect(page.getByRole("heading", {level: 1})).toBeVisible();
    });

    test("can view set details", async ({page}) => {
        // Create a set via API first
        const api = createApiClient(page);
        const response = await api.post<{data: {id: number}}>("/family-sets", {
            set_num: "75192-1",
            quantity: 1,
            status: "sealed",
        });

        await page.goto(`/sets/${response.data.id}`);

        await expect(page.getByRole("heading", {level: 1})).toBeVisible();
        await expect(page.getByText("Verzegeld")).toBeVisible();
        await expect(page.getByRole("button", {name: "Bewerken"})).toBeVisible();
    });

    test("can update set status", async ({page}) => {
        // Create a set via API first
        const api = createApiClient(page);
        const response = await api.post<{data: {id: number}}>("/family-sets", {
            set_num: "75192-1",
            quantity: 1,
            status: "sealed",
        });

        await page.goto(`/sets/${response.data.id}/edit`);

        await expect(page.getByRole("heading", {name: "Set bewerken"})).toBeVisible();
        await page.getByLabel("Status").selectOption("built");
        await page.getByRole("button", {name: "Opslaan"}).click();

        // Should redirect to detail page (not edit)
        await page.waitForURL((url) => url.pathname === `/sets/${response.data.id}`);
        await expect(page.getByText("Gebouwd")).toBeVisible();
    });

    test("can delete a set from collection", async ({page}) => {
        // Create a set via API first
        const api = createApiClient(page);
        const response = await api.post<{data: {id: number}}>("/family-sets", {
            set_num: "75192-1",
            quantity: 1,
            status: "sealed",
        });

        await page.goto(`/sets/${response.data.id}/edit`);

        // Accept the confirm dialog before clicking delete
        page.on("dialog", (dialog) => dialog.accept());
        await page.getByRole("button", {name: "Verwijderen"}).click();

        // Should redirect to sets overview
        await page.waitForURL((url) => url.pathname === "/sets");
    });
});
