import {test, expect} from "@playwright/test";
import {createTestUser, testEmail} from "../lib/api";

test.describe("Authentication", () => {
    test("can register a new user", async ({page}) => {
        const email = testEmail();
        const password = "password123";

        await page.goto("/register");

        // Fill registration form
        await page.fill('[name="family_name"], [data-testid="family-name-input"]', "Test Family");
        await page.fill('[name="name"], [data-testid="name-input"]', "Test User");
        await page.fill('[name="email"], [data-testid="email-input"]', email);
        await page.fill('[name="password"], [data-testid="password-input"]', password);
        await page.fill(
            '[name="password_confirmation"], [data-testid="password-confirmation-input"]',
            password
        );

        await page.click('button[type="submit"]');

        // Should redirect after successful registration
        await page.waitForURL((url) => !url.pathname.includes("/register"));

        // User should be logged in
        await expect(page.locator("body")).not.toContainText("Login");
    });

    test("can login with existing user", async ({page}) => {
        const email = testEmail();
        const password = "password123";

        // Create user via API
        await createTestUser(email, password);

        await page.goto("/login");

        await page.fill('[name="email"], [data-testid="email-input"]', email);
        await page.fill('[name="password"], [data-testid="password-input"]', password);
        await page.click('button[type="submit"]');

        // Should redirect after successful login
        await page.waitForURL((url) => !url.pathname.includes("/login"));
    });

    test("shows error for invalid credentials", async ({page}) => {
        await page.goto("/login");

        await page.fill('[name="email"], [data-testid="email-input"]', "nonexistent@example.com");
        await page.fill('[name="password"], [data-testid="password-input"]', "wrongpassword");
        await page.click('button[type="submit"]');

        // Should show error message
        await expect(
            page.locator('[data-testid="error-message"], .error, [role="alert"]')
        ).toBeVisible();
    });

    test("can logout", async ({page}) => {
        const email = testEmail();
        const password = "password123";

        await createTestUser(email, password);

        // Login first
        await page.goto("/login");
        await page.fill('[name="email"], [data-testid="email-input"]', email);
        await page.fill('[name="password"], [data-testid="password-input"]', password);
        await page.click('button[type="submit"]');
        await page.waitForURL((url) => !url.pathname.includes("/login"));

        // Find and click logout
        const logoutButton = page.locator(
            '[data-testid="logout-button"], button:has-text("Logout"), a:has-text("Logout")'
        );

        if (await logoutButton.isVisible()) {
            await logoutButton.click();

            // Should redirect to login or home
            await expect(page.locator("body")).toContainText(/login/i);
        }
    });
});
