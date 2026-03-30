import { test, expect } from "@playwright/test";

test.describe("Public Pages", () => {
	test("marketing page loads without errors", async ({ page }) => {
		const consoleErrors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") consoleErrors.push(msg.text());
		});

		await page.goto("/ar");
		await expect(page.locator("main")).toBeVisible();

		// Filter out benign errors (favicon, HMR, etc.)
		const realErrors = consoleErrors.filter(
			(e) => !e.includes("favicon") && !e.includes("HMR") && !e.includes("webpack"),
		);
		expect(realErrors).toHaveLength(0);
	});

	test("English marketing page loads", async ({ page }) => {
		await page.goto("/en");
		await expect(page.locator("main")).toBeVisible();
	});

	test("invalid share token returns non-500 response", async ({ page }) => {
		const response = await page.goto("/share/invalid-token-12345");
		expect(response?.status()).toBeLessThan(500);
	});

	test("invalid owner portal token returns non-500 response", async ({ page }) => {
		const response = await page.goto("/owner/invalid-token-12345");
		expect(response?.status()).toBeLessThan(500);
	});

	test("non-existent route returns 404", async ({ page }) => {
		const response = await page.goto("/this-page-does-not-exist-xyz");
		expect(response?.status()).toBe(404);
	});
});
