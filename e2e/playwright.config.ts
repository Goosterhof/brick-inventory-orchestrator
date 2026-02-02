import {defineConfig, devices} from "@playwright/test";

const allBrowsers = [
    {
        name: "chromium",
        use: {...devices["Desktop Chrome"]},
    },
    {
        name: "firefox",
        use: {...devices["Desktop Firefox"]},
    },
    {
        name: "webkit",
        use: {...devices["Desktop Safari"]},
    },
];

// Use all browsers in CI, only Chromium locally (fewer deps required)
const projects = process.env.CI
    ? allBrowsers
    : [allBrowsers[0]];

export default defineConfig({
    testDir: "./tests",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ["html"],
        ["list"],
    ],
    use: {
        baseURL: "http://localhost:5173",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },
    projects,
    /* Start services before running tests */
    webServer: {
        command: "cd .. && make up",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
    /* Global timeout for each test */
    timeout: 30_000,
    expect: {
        timeout: 5_000,
    },
});
