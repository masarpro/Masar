import { test as base, expect, type Page } from "@playwright/test";

/**
 * Test user credentials.
 * Must exist in the database (create via seed or manually).
 */
const TEST_USER = {
	email: process.env.TEST_USER_EMAIL || "test@masar-test.com",
	password: process.env.TEST_USER_PASSWORD || "TestPassword123!",
};

/**
 * Fixture that provides a pre-authenticated page.
 */
export const test = base.extend<{ authenticatedPage: Page }>({
	authenticatedPage: async ({ page }, use) => {
		await page.goto("/auth/login");
		await page.fill('input[name="email"]', TEST_USER.email);
		await page.fill('input[name="password"]', TEST_USER.password);
		await page.click('button[type="submit"]');
		await page.waitForURL(/\/app\//, { timeout: 15_000 });
		await use(page);
	},
});

export { expect };
