import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
	test("login page renders correctly", async ({ page }) => {
		await page.goto("/auth/login");
		await expect(page.locator('input[name="email"]')).toBeVisible();
		await expect(page.locator('input[name="password"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test("login with wrong credentials shows error", async ({ page }) => {
		await page.goto("/auth/login");
		await page.fill('input[name="email"]', "wrong@test.com");
		await page.fill('input[name="password"]', "wrongpassword");
		await page.click('button[type="submit"]');
		await expect(
			page.locator('[role="alert"], .text-destructive, [data-sonner-toast][data-type="error"]'),
		).toBeVisible({ timeout: 10_000 });
	});

	test("register page renders correctly", async ({ page }) => {
		await page.goto("/auth/register");
		await expect(page.locator('input[name="email"]')).toBeVisible();
	});

	test("forgot password page renders correctly", async ({ page }) => {
		await page.goto("/auth/forgot-password");
		await expect(page.locator('input[name="email"]')).toBeVisible();
	});

	test("protected routes redirect to login", async ({ page }) => {
		await page.goto("/app");
		await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
	});
});
