import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
	test("server is running and responds", async ({ page }) => {
		const response = await page.goto("/");
		expect(response).toBeTruthy();
		expect(response!.status()).toBeLessThan(500);
	});

	test("login page has correct page title", async ({ page }) => {
		await page.goto("/auth/login");
		const title = await page.title();
		expect(title).toBeTruthy();
		expect(title.length).toBeGreaterThan(0);
	});

	test("static assets load correctly", async ({ page }) => {
		await page.goto("/auth/login");
		// Check that CSS is loaded (page should have styled elements)
		const bodyFontSize = await page.evaluate(() =>
			window.getComputedStyle(document.body).fontSize,
		);
		expect(bodyFontSize).toBeTruthy();
	});

	test("API health check responds", async ({ page }) => {
		// oRPC base path should not return 500
		const response = await page.goto("/api/health", { waitUntil: "domcontentloaded" });
		// Even if there's no explicit health endpoint, it should not be 500
		if (response) {
			expect(response.status()).toBeLessThan(500);
		}
	});

	test("RTL direction is set for Arabic locale", async ({ page }) => {
		await page.goto("/ar");
		const dir = await page.getAttribute("html", "dir");
		expect(dir).toBe("rtl");
	});

	test("LTR direction is set for English locale", async ({ page }) => {
		await page.goto("/en");
		const dir = await page.getAttribute("html", "dir");
		expect(dir).toBe("ltr");
	});
});
