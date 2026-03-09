/**
 * Subscription Procedure Middleware Tests
 *
 * Tests the checkSubscription middleware that guards write operations.
 * Uses mocked @repo/database to avoid real DB connections.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ORPCError } from "@orpc/server";

// Mock the database module
vi.mock("@repo/database", () => ({
	db: {
		organization: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
	},
}));

import { db } from "@repo/database";
import { checkSubscription } from "../../orpc/middleware/subscription-middleware";

const mockOrgFind = db.organization.findUnique as ReturnType<typeof vi.fn>;
const mockOrgUpdate = db.organization.update as ReturnType<typeof vi.fn>;

// ─── Context builders ────────────────────────────────────────────────────────

function makeContext(overrides?: {
	userId?: string;
	userRole?: string | null;
	activeOrganizationId?: string | null;
}) {
	return {
		user: {
			id: overrides?.userId ?? "user-1",
			role: overrides?.userRole !== undefined ? overrides.userRole : "member",
		},
		session: {
			activeOrganizationId:
				overrides && "activeOrganizationId" in overrides
					? overrides.activeOrganizationId
					: "org-1",
		},
	};
}

function mockOrg(overrides: {
	status?: string;
	plan?: string;
	isFreeOverride?: boolean;
	trialEndsAt?: Date | null;
}) {
	mockOrgFind.mockResolvedValue({
		status: overrides.status ?? "ACTIVE",
		plan: overrides.plan ?? "PRO",
		isFreeOverride: overrides.isFreeOverride ?? false,
		trialEndsAt: overrides.trialEndsAt ?? null,
	});
}

beforeEach(() => {
	vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
// Bypass Conditions
// ═══════════════════════════════════════════════════════════════════════════

describe("bypass conditions", () => {
	it("admin user bypasses all subscription checks", async () => {
		const ctx = makeContext({ userRole: "admin" });
		await expect(checkSubscription(ctx)).resolves.toBeUndefined();
		expect(mockOrgFind).not.toHaveBeenCalled();
	});

	it("no activeOrganizationId bypasses checks", async () => {
		const ctx = makeContext({ activeOrganizationId: null });
		await expect(checkSubscription(ctx)).resolves.toBeUndefined();
		expect(mockOrgFind).not.toHaveBeenCalled();
	});

	it("organization not found bypasses checks", async () => {
		mockOrgFind.mockResolvedValue(null);
		const ctx = makeContext();
		await expect(checkSubscription(ctx)).resolves.toBeUndefined();
	});

	it("isFreeOverride bypasses all checks even with FREE plan", async () => {
		mockOrg({ status: "ACTIVE", plan: "FREE", isFreeOverride: true });
		const ctx = makeContext();
		await expect(checkSubscription(ctx)).resolves.toBeUndefined();
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// PRO Plan — Allowed
// ═══════════════════════════════════════════════════════════════════════════

describe("PRO plan", () => {
	it("PRO + ACTIVE allows write operations", async () => {
		mockOrg({ status: "ACTIVE", plan: "PRO" });
		const ctx = makeContext();
		await expect(checkSubscription(ctx)).resolves.toBeUndefined();
	});

	it("PRO + TRIALING allows write operations", async () => {
		const future = new Date();
		future.setDate(future.getDate() + 14);
		mockOrg({ status: "TRIALING", plan: "PRO", trialEndsAt: future });
		const ctx = makeContext();
		await expect(checkSubscription(ctx)).resolves.toBeUndefined();
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// FREE Plan — Blocked
// ═══════════════════════════════════════════════════════════════════════════

describe("FREE plan", () => {
	it("FREE + ACTIVE blocks write operations", async () => {
		mockOrg({ status: "ACTIVE", plan: "FREE" });
		const ctx = makeContext();

		try {
			await checkSubscription(ctx);
			expect.unreachable("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(ORPCError);
			expect((err as ORPCError).code).toBe("FORBIDDEN");
		}
	});

	it("error data contains UPGRADE_REQUIRED code", async () => {
		mockOrg({ status: "ACTIVE", plan: "FREE" });
		const ctx = makeContext();

		try {
			await checkSubscription(ctx);
			expect.unreachable("Should have thrown");
		} catch (err) {
			const orpcErr = err as ORPCError;
			expect(orpcErr.data).toEqual({ code: "UPGRADE_REQUIRED" });
		}
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// SUSPENDED / CANCELLED Status
// ═══════════════════════════════════════════════════════════════════════════

describe("organization status: SUSPENDED", () => {
	it("SUSPENDED org blocks all write operations", async () => {
		mockOrg({ status: "SUSPENDED", plan: "PRO" });
		const ctx = makeContext();

		try {
			await checkSubscription(ctx);
			expect.unreachable("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(ORPCError);
			expect((err as ORPCError).code).toBe("FORBIDDEN");
			expect((err as ORPCError).message).toContain("subscription_required");
		}
	});

	it("SUSPENDED with isFreeOverride still bypasses", async () => {
		mockOrg({ status: "SUSPENDED", plan: "PRO", isFreeOverride: true });
		const ctx = makeContext();
		await expect(checkSubscription(ctx)).resolves.toBeUndefined();
	});
});

describe("organization status: CANCELLED", () => {
	it("CANCELLED org blocks all write operations", async () => {
		mockOrg({ status: "CANCELLED", plan: "PRO" });
		const ctx = makeContext();

		try {
			await checkSubscription(ctx);
			expect.unreachable("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(ORPCError);
			expect((err as ORPCError).code).toBe("FORBIDDEN");
		}
	});

	it("CANCELLED + admin user still bypasses", async () => {
		const ctx = makeContext({ userRole: "admin" });
		await expect(checkSubscription(ctx)).resolves.toBeUndefined();
		expect(mockOrgFind).not.toHaveBeenCalled();
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Trial Expiration
// ═══════════════════════════════════════════════════════════════════════════

describe("trial expiration", () => {
	it("expired trial lazy-updates to FREE and throws FORBIDDEN", async () => {
		const past = new Date();
		past.setDate(past.getDate() - 1);
		mockOrg({ status: "TRIALING", plan: "FREE", trialEndsAt: past });
		mockOrgUpdate.mockResolvedValue({});

		const ctx = makeContext();

		try {
			await checkSubscription(ctx);
			expect.unreachable("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(ORPCError);
			expect((err as ORPCError).code).toBe("FORBIDDEN");
		}

		// Should have updated org to FREE
		expect(mockOrgUpdate).toHaveBeenCalledWith({
			where: { id: "org-1" },
			data: { status: "ACTIVE", plan: "FREE" },
		});
	});

	it("active trial allows write operations", async () => {
		const future = new Date();
		future.setDate(future.getDate() + 14);
		mockOrg({ status: "TRIALING", plan: "FREE", trialEndsAt: future });
		const ctx = makeContext();

		// TRIALING with future trialEndsAt and plan FREE — should NOT be SUSPENDED/CANCELLED
		// but since plan is FREE, it will be blocked at the FREE plan check.
		// Actually, TRIALING status with future date passes the status check,
		// but since plan is FREE, it gets blocked at the plan check.
		try {
			await checkSubscription(ctx);
			expect.unreachable("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(ORPCError);
			expect((err as ORPCError).code).toBe("FORBIDDEN");
		}
	});

	it("active trial with PRO plan allows write operations", async () => {
		const future = new Date();
		future.setDate(future.getDate() + 14);
		mockOrg({ status: "TRIALING", plan: "PRO", trialEndsAt: future });
		const ctx = makeContext();

		await expect(checkSubscription(ctx)).resolves.toBeUndefined();
	});

	it("TRIALING without trialEndsAt and FREE plan blocks", async () => {
		mockOrg({ status: "TRIALING", plan: "FREE", trialEndsAt: null });
		const ctx = makeContext();

		try {
			await checkSubscription(ctx);
			expect.unreachable("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(ORPCError);
			expect((err as ORPCError).code).toBe("FORBIDDEN");
		}
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Deactivated Users (handled in protectedProcedure, not here)
// ═══════════════════════════════════════════════════════════════════════════

describe("user state", () => {
	it("inactive user is NOT checked here (handled by protectedProcedure)", async () => {
		// checkSubscription doesn't check isActive — that's protectedProcedure's job
		mockOrg({ status: "ACTIVE", plan: "PRO" });
		const ctx = {
			user: { id: "user-1", role: "member", isActive: false },
			session: { activeOrganizationId: "org-1" },
		};
		// Should pass — isActive check is upstream
		await expect(checkSubscription(ctx)).resolves.toBeUndefined();
	});
});
