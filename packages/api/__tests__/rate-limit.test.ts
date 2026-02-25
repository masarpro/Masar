/**
 * Rate Limiting Tests — Sprint 4.2 Verification
 * Tests in-memory fallback (no REDIS_URL), presets, error class
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Ensure no REDIS_URL so tests exercise the in-memory fallback path
delete process.env.REDIS_URL;

const {
	checkRateLimit,
	enforceRateLimit,
	rateLimitChecker,
	rateLimitToken,
	createRateLimitKey,
	createIpRateLimitKey,
	RATE_LIMITS,
	RateLimitError,
} = await import("../lib/rate-limit");

describe("RATE_LIMITS presets", () => {
	it("exports all 6 presets", () => {
		expect(RATE_LIMITS.READ).toBeDefined();
		expect(RATE_LIMITS.WRITE).toBeDefined();
		expect(RATE_LIMITS.TOKEN).toBeDefined();
		expect(RATE_LIMITS.UPLOAD).toBeDefined();
		expect(RATE_LIMITS.MESSAGE).toBeDefined();
		expect(RATE_LIMITS.STRICT).toBeDefined();
	});

	it("STRICT is the most restrictive (5/min)", () => {
		expect(RATE_LIMITS.STRICT.maxRequests).toBe(5);
	});
});

describe("createRateLimitKey / createIpRateLimitKey", () => {
	it("creates user:procedure key", () => {
		expect(createRateLimitKey("user123", "createExpense")).toBe("user123:createExpense");
	});

	it("creates ip-prefixed key", () => {
		expect(createIpRateLimitKey("1.2.3.4", "login")).toBe("ip:1.2.3.4:login");
	});
});

describe("checkRateLimit (in-memory fallback)", () => {
	it("allows first request", async () => {
		const key = `test-${Date.now()}-first`;
		const r = await checkRateLimit(key, { windowMs: 60000, maxRequests: 3 });
		expect(r.allowed).toBe(true);
		expect(r.remaining).toBe(2);
	});

	it("tracks count across calls", async () => {
		const key = `test-${Date.now()}-multi`;
		const config = { windowMs: 60000, maxRequests: 3 };

		const r1 = await checkRateLimit(key, config);
		expect(r1.allowed).toBe(true);
		expect(r1.remaining).toBe(2);

		const r2 = await checkRateLimit(key, config);
		expect(r2.allowed).toBe(true);
		expect(r2.remaining).toBe(1);

		const r3 = await checkRateLimit(key, config);
		expect(r3.allowed).toBe(true);
		expect(r3.remaining).toBe(0);

		// 4th request should be blocked
		const r4 = await checkRateLimit(key, config);
		expect(r4.allowed).toBe(false);
		expect(r4.remaining).toBe(0);
		expect(r4.retryAfterMs).toBeGreaterThan(0);
	});

	it("resets after window expires", async () => {
		const key = `test-${Date.now()}-expire`;
		const config = { windowMs: 50, maxRequests: 1 }; // 50ms window

		const r1 = await checkRateLimit(key, config);
		expect(r1.allowed).toBe(true);

		const r2 = await checkRateLimit(key, config);
		expect(r2.allowed).toBe(false);

		// Wait for window to expire
		await new Promise((resolve) => setTimeout(resolve, 60));

		const r3 = await checkRateLimit(key, config);
		expect(r3.allowed).toBe(true);
	});
});

describe("enforceRateLimit", () => {
	it("does not throw when under limit", async () => {
		const key = `test-${Date.now()}-enforce-ok`;
		await expect(
			enforceRateLimit(key, { windowMs: 60000, maxRequests: 5 }),
		).resolves.toBeUndefined();
	});

	it("throws RateLimitError when exceeded", async () => {
		const key = `test-${Date.now()}-enforce-fail`;
		const config = { windowMs: 60000, maxRequests: 1 };

		await enforceRateLimit(key, config); // First — OK

		try {
			await enforceRateLimit(key, config); // Second — blocked
			expect.unreachable("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(RateLimitError);
			expect((err as RateLimitError).retryAfterMs).toBeGreaterThan(0);
		}
	});
});

describe("rateLimitChecker", () => {
	it("resolves when under limit", async () => {
		await expect(
			rateLimitChecker(`user-${Date.now()}`, "testProc", { windowMs: 60000, maxRequests: 10 }),
		).resolves.toBeUndefined();
	});
});

describe("rateLimitToken", () => {
	it("resolves when under limit", async () => {
		await expect(
			rateLimitToken(`token-${Date.now()}`, "testProc"),
		).resolves.toBeUndefined();
	});
});

describe("RateLimitError", () => {
	it("has Arabic message with retry seconds", () => {
		const err = new RateLimitError({
			allowed: false,
			remaining: 0,
			resetAt: Date.now() + 30000,
			retryAfterMs: 30000,
		});
		expect(err.name).toBe("RateLimitError");
		expect(err.message).toContain("30");
		expect(err.message).toContain("ثانية");
		expect(err.retryAfterMs).toBe(30000);
	});
});

describe("No REDIS_URL — graceful fallback", () => {
	it("does not crash on module load without REDIS_URL", () => {
		// If we got here, the module loaded fine without REDIS_URL
		expect(checkRateLimit).toBeDefined();
		expect(enforceRateLimit).toBeDefined();
	});
});
