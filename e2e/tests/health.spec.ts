import {test, expect} from "@playwright/test";

test.describe("Health Checks", () => {
    test("frontend is accessible", async ({page}) => {
        await page.goto("/");

        await expect(page).toHaveTitle(/.+/);
    });

    test("backend API is healthy", async ({request}) => {
        const response = await request.get("http://localhost:8000/api/health");

        expect(response.ok()).toBe(true);

        const data = await response.json();
        expect(data.status).toBe("ok");
        expect(data.timestamp).toBeDefined();
    });

    test("backend API welcome endpoint works", async ({request}) => {
        const response = await request.get("http://localhost:8000/api");

        expect(response.ok()).toBe(true);
    });
});
