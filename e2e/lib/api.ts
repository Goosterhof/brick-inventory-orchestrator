import type { Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const API_BASE = "http://localhost:8000/api";

/**
 * Generate a unique identifier for test isolation
 */
export function uniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Generate a unique test email address
 */
export function testEmail(): string {
  return `test-${uniqueId()}@example.com`;
}

interface HealthResponse {
  status: string;
  timestamp: string;
}

/**
 * Create a test user (heading a new family) with the backend's operator command.
 * BIO has no registration route (WR-2118), so provisioning needs a shell in the
 * backend container — the same `docker compose exec` the e2e workflow migrates with.
 */
export function createTestUser(
  email: string,
  password: string,
  options: { name?: string; familyName?: string } = {},
): void {
  const { name = "Test User", familyName = "Test Family" } = options;

  execFileSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "backend",
      "php",
      "artisan",
      "account:create",
      email,
      password,
      `--name=${name}`,
      `--family=${familyName}`,
    ],
    { cwd: resolve(__dirname, "..", ".."), stdio: "pipe" },
  );
}

/**
 * Login via the UI and return the authenticated page
 */
export async function loginViaUi(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /log\s*in|sign\s*in|submit/i }).click();

  // Wait for redirect after successful login
  await page.waitForURL((url) => !url.pathname.includes("/login"));
}

/**
 * Check if the API is healthy
 */
export async function waitForApi(maxAttempts = 30, intervalMs = 1000): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (response.ok) {
        const data: HealthResponse = await response.json();
        if (data.status === "ok") {
          return;
        }
      }
    } catch {
      // API not ready yet
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error(`API not healthy after ${maxAttempts} attempts`);
}

/**
 * Create authenticated API request helper
 * Use this when you need to make API calls with authentication cookies from a page context
 */
export function createApiClient(page: Page) {
  // Origin must match SANCTUM_STATEFUL_DOMAINS — Playwright's page.request does
  // not set it automatically, and without it Sanctum's stateful middleware
  // skips the session cookie and the request is treated as unauthenticated.
  // Accept: application/json keeps unauth responses as JSON 401 instead of a
  // redirect to a non-existent "login" route (which surfaces as 500).
  const jsonHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    Origin: "http://localhost:5173",
  };

  return {
    async get<T>(endpoint: string): Promise<T> {
      const response = await page.request.get(`${API_BASE}${endpoint}`, {
        headers: jsonHeaders,
      });
      if (!response.ok()) {
        throw new Error(`GET ${endpoint} failed: ${response.status()}`);
      }
      return response.json();
    },

    async post<T>(endpoint: string, data: unknown): Promise<T> {
      const response = await page.request.post(`${API_BASE}${endpoint}`, {
        data,
        headers: jsonHeaders,
      });
      if (!response.ok()) {
        throw new Error(`POST ${endpoint} failed: ${response.status()}`);
      }
      return response.json();
    },

    async put<T>(endpoint: string, data: unknown): Promise<T> {
      const response = await page.request.put(`${API_BASE}${endpoint}`, {
        data,
        headers: jsonHeaders,
      });
      if (!response.ok()) {
        throw new Error(`PUT ${endpoint} failed: ${response.status()}`);
      }
      return response.json();
    },

    async delete(endpoint: string): Promise<void> {
      const response = await page.request.delete(`${API_BASE}${endpoint}`, {
        headers: jsonHeaders,
      });
      if (!response.ok()) {
        throw new Error(`DELETE ${endpoint} failed: ${response.status()}`);
      }
    },
  };
}
