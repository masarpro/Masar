/**
 * Feature Gate Tests
 *
 * Tests for checkFeatureAccess / enforceFeatureAccess.
 * Uses mocked @repo/database to avoid real DB connections.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("@repo/database", () => ({
	db: {
		organization: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
		project: { count: vi.fn() },
		member: { count: vi.fn() },
		aiChatUsage: { findUnique: vi.fn() },
	},
}));

import { db } from "@repo/database";
import {
	checkFeatureAccess,
	enforceFeatureAccess,
	type FeatureKey,
} from "../lib/feature-gate";

const mockOrg = db.organization.findUnique as ReturnType<typeof vi.fn>;
const mockOrgUpdate = db.organization.update as ReturnType<typeof vi.fn>;
const mockProjectCount = db.project.count as ReturnType<typeof vi.fn>;
const mockMemberCount = db.member.count as ReturnType<typeof vi.fn>;
const mockAiUsage = db.aiChatUsage.findUnique as ReturnType<typeof vi.fn>;

const adminUser = { id: "admin-1", role: "admin" as const };
const normalUser = { id: "user-1", role: "member" as const };
const orgId = "org-1";

beforeEach(() => {
	vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
// Bypass Conditions
// ═══════════════════════════════════════════════════════════════════════════

describe("bypass conditions", () => {
	it("admin user bypasses all feature gates", async () => {
		// Should not even hit the database
		const result = await checkFeatureAccess(orgId, "export.pdf", adminUser);
		expect(result.allowed).toBe(true);
		expect(mockOrg).not.toHaveBeenCalled();
	});

	it("isFreeOverride bypasses all feature gates", async () => {
		mockOrg.mockResolvedValue({
			status: "ACTIVE",
			plan: "FREE",
			isFreeOverride: true,
			trialEndsAt: null,
		});

		const result = await checkFeatureAccess(orgId, "export.pdf", normalUser);
		expect(result.allowed).toBe(true);
	});

	it("returns allowed if organization not found", async () => {
		mockOrg.mockResolvedValue(null);

		const result = await checkFeatureAccess(orgId, "export.pdf", normalUser);
		expect(result.allowed).toBe(true);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// PRO Plan Access
// ═══════════════════════════════════════════════════════════════════════════

describe("PRO plan", () => {
	it("PRO + ACTIVE allows all features", async () => {
		mockOrg.mockResolvedValue({
			status: "ACTIVE",
			plan: "PRO",
			isFreeOverride: false,
			trialEndsAt: null,
		});

		const features: FeatureKey[] = [
			"projects.create",
			"export.pdf",
			"zatca.qr",
			"reports.detailed",
		];

		for (const feature of features) {
			const result = await checkFeatureAccess(orgId, feature, normalUser);
			expect(result.allowed).toBe(true);
		}
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// TRIAL Plan Access
// ═══════════════════════════════════════════════════════════════════════════

describe("TRIAL plan", () => {
	it("active trial allows all features", async () => {
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 14);

		mockOrg.mockResolvedValue({
			status: "TRIALING",
			plan: "FREE",
			isFreeOverride: false,
			trialEndsAt: futureDate,
		});

		const result = await checkFeatureAccess(orgId, "export.pdf", normalUser);
		expect(result.allowed).toBe(true);
	});

	it("expired trial lazy-updates to FREE and blocks hard features", async () => {
		const pastDate = new Date();
		pastDate.setDate(pastDate.getDate() - 1);

		mockOrg.mockResolvedValue({
			status: "TRIALING",
			plan: "FREE",
			isFreeOverride: false,
			trialEndsAt: pastDate,
		});
		mockOrgUpdate.mockResolvedValue({});

		const result = await checkFeatureAccess(orgId, "export.pdf", normalUser);

		// Should have lazy-updated to FREE
		expect(mockOrgUpdate).toHaveBeenCalledWith({
			where: { id: orgId },
			data: { status: "ACTIVE", plan: "FREE" },
		});

		// Hard-blocked feature should be denied
		expect(result.allowed).toBe(false);
		if (!result.allowed) {
			expect(result.upgradeRequired).toBe(true);
		}
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// FREE Plan — Count-Limited Features
// ═══════════════════════════════════════════════════════════════════════════

describe("FREE plan — count-limited features", () => {
	beforeEach(() => {
		mockOrg.mockResolvedValue({
			status: "ACTIVE",
			plan: "FREE",
			isFreeOverride: false,
			trialEndsAt: null,
		});
	});

	it("allows projects.create when under limit (0 projects)", async () => {
		mockProjectCount.mockResolvedValue(0);

		const result = await checkFeatureAccess(orgId, "projects.create", normalUser);
		expect(result.allowed).toBe(true);
	});

	it("blocks projects.create when at limit (1 project)", async () => {
		mockProjectCount.mockResolvedValue(1);

		const result = await checkFeatureAccess(orgId, "projects.create", normalUser);
		expect(result.allowed).toBe(false);
		if (!result.allowed) {
			expect(result.upgradeRequired).toBe(true);
			expect(result.reasonAr).toContain("مشروع واحد");
		}
	});

	it("allows members.invite when under limit (1 member)", async () => {
		mockMemberCount.mockResolvedValue(1);

		const result = await checkFeatureAccess(orgId, "members.invite", normalUser);
		expect(result.allowed).toBe(true);
	});

	it("blocks members.invite when at limit (2 members)", async () => {
		mockMemberCount.mockResolvedValue(2);

		const result = await checkFeatureAccess(orgId, "members.invite", normalUser);
		expect(result.allowed).toBe(false);
		if (!result.allowed) {
			expect(result.upgradeRequired).toBe(true);
		}
	});

	it("allows ai.chat when under limit", async () => {
		mockAiUsage.mockResolvedValue({ totalChats: 5 });

		const result = await checkFeatureAccess(orgId, "ai.chat", normalUser);
		expect(result.allowed).toBe(true);
	});

	it("blocks ai.chat when at limit (10 chats)", async () => {
		mockAiUsage.mockResolvedValue({ totalChats: 10 });

		const result = await checkFeatureAccess(orgId, "ai.chat", normalUser);
		expect(result.allowed).toBe(false);
		if (!result.allowed) {
			expect(result.upgradeRequired).toBe(true);
			expect(result.reasonAr).toContain("10");
		}
	});

	it("allows ai.chat when no usage record exists", async () => {
		mockAiUsage.mockResolvedValue(null);

		const result = await checkFeatureAccess(orgId, "ai.chat", normalUser);
		expect(result.allowed).toBe(true);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// FREE Plan — Hard-Blocked Features
// ═══════════════════════════════════════════════════════════════════════════

describe("FREE plan — hard-blocked features", () => {
	beforeEach(() => {
		mockOrg.mockResolvedValue({
			status: "ACTIVE",
			plan: "FREE",
			isFreeOverride: false,
			trialEndsAt: null,
		});
	});

	const hardBlockedFeatures: FeatureKey[] = [
		"export.pdf",
		"cost-study.save",
		"quotation.export",
		"owner-portal.activate",
		"reports.detailed",
		"zatca.qr",
	];

	for (const feature of hardBlockedFeatures) {
		it(`blocks ${feature} on FREE plan`, async () => {
			const result = await checkFeatureAccess(orgId, feature, normalUser);
			expect(result.allowed).toBe(false);
			if (!result.allowed) {
				expect(result.upgradeRequired).toBe(true);
				expect(result.reason).toBeTruthy();
				expect(result.reasonAr).toBeTruthy();
			}
		});
	}
});

// ═══════════════════════════════════════════════════════════════════════════
// enforceFeatureAccess — throws ORPCError
// ═══════════════════════════════════════════════════════════════════════════

describe("enforceFeatureAccess", () => {
	it("does not throw when allowed", async () => {
		mockOrg.mockResolvedValue({
			status: "ACTIVE",
			plan: "PRO",
			isFreeOverride: false,
			trialEndsAt: null,
		});

		await expect(
			enforceFeatureAccess(orgId, "export.pdf", normalUser),
		).resolves.toBeUndefined();
	});

	it("throws FORBIDDEN when blocked", async () => {
		mockOrg.mockResolvedValue({
			status: "ACTIVE",
			plan: "FREE",
			isFreeOverride: false,
			trialEndsAt: null,
		});

		await expect(
			enforceFeatureAccess(orgId, "export.pdf", normalUser),
		).rejects.toThrow();
	});

	it("admin never throws", async () => {
		await expect(
			enforceFeatureAccess(orgId, "zatca.qr", adminUser),
		).resolves.toBeUndefined();
	});
});
