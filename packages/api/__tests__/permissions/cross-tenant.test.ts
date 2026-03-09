/**
 * Cross-Tenant Isolation Tests
 *
 * Verifies that users from one organization cannot access resources
 * from another organization — the most critical security invariant.
 *
 * Part 1: Unit tests for getUserPermissions cross-org guard (DB-backed)
 * Part 2: Unit tests for verifyProjectAccess cross-org guard (DB-backed)
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
	DEFAULT_ROLE_PERMISSIONS,
	createEmptyPermissions,
} from "@repo/database/prisma/permissions";

const HAS_TEST_DB = !!process.env.DATABASE_URL_TEST;

// ═══════════════════════════════════════════════════════════════════════════
// Part 1: getUserPermissions — cross-tenant guard
// ═══════════════════════════════════════════════════════════════════════════

describe.skipIf(!HAS_TEST_DB)("Cross-Tenant: getUserPermissions", () => {
	let getUserPermissions: typeof import("../../lib/permissions/get-user-permissions")["getUserPermissions"];
	let db: any;

	// Fixtures
	let orgA: { id: string };
	let orgB: { id: string };
	let ownerRoleA: { id: string };
	let ownerRoleB: { id: string };
	let userInOrgA: { id: string };
	let userInOrgB: { id: string };
	let userInBothMemberships: { id: string };

	beforeAll(async () => {
		const permsMod = await import("../../lib/permissions/get-user-permissions");
		getUserPermissions = permsMod.getUserPermissions;
		const dbMod = await import("@repo/database");
		db = dbMod.db;

		// Create two organizations
		orgA = await db.organization.create({
			data: { name: "Cross-Tenant Org A", createdAt: new Date() },
		});
		orgB = await db.organization.create({
			data: { name: "Cross-Tenant Org B", createdAt: new Date() },
		});

		// Create OWNER roles in each org
		ownerRoleA = await db.role.create({
			data: {
				name: "Owner A",
				type: "OWNER",
				isSystem: true,
				permissions: DEFAULT_ROLE_PERMISSIONS.OWNER as unknown as object,
				organizationId: orgA.id,
			},
		});
		ownerRoleB = await db.role.create({
			data: {
				name: "Owner B",
				type: "OWNER",
				isSystem: true,
				permissions: DEFAULT_ROLE_PERMISSIONS.OWNER as unknown as object,
				organizationId: orgB.id,
			},
		});

		// User A: OWNER in Org A
		userInOrgA = await db.user.create({
			data: {
				name: "User A",
				email: "xtenant-a@test.local",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
				accountType: "OWNER",
				organizationId: orgA.id,
				organizationRoleId: ownerRoleA.id,
			},
		});
		await db.member.create({
			data: { organizationId: orgA.id, userId: userInOrgA.id, role: "owner", createdAt: new Date() },
		});

		// User B: OWNER in Org B
		userInOrgB = await db.user.create({
			data: {
				name: "User B",
				email: "xtenant-b@test.local",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
				accountType: "OWNER",
				organizationId: orgB.id,
				organizationRoleId: ownerRoleB.id,
			},
		});
		await db.member.create({
			data: { organizationId: orgB.id, userId: userInOrgB.id, role: "owner", createdAt: new Date() },
		});

		// User who has membership in both orgs but organizationId = orgA
		userInBothMemberships = await db.user.create({
			data: {
				name: "User Both",
				email: "xtenant-both@test.local",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
				accountType: "OWNER",
				organizationId: orgA.id,
				organizationRoleId: ownerRoleA.id,
			},
		});
		await db.member.create({
			data: { organizationId: orgA.id, userId: userInBothMemberships.id, role: "owner", createdAt: new Date() },
		});
		// Also a member of Org B (via invitation)
		await db.member.create({
			data: { organizationId: orgB.id, userId: userInBothMemberships.id, role: "member", createdAt: new Date() },
		});
	});

	afterAll(async () => {
		const ids = [orgA.id, orgB.id];
		await db.member.deleteMany({ where: { organizationId: { in: ids } } });
		await db.user.deleteMany({
			where: { email: { in: ["xtenant-a@test.local", "xtenant-b@test.local", "xtenant-both@test.local"] } },
		});
		await db.role.deleteMany({ where: { organizationId: { in: ids } } });
		await db.organization.deleteMany({ where: { id: { in: ids } } });
	});

	// ─── Tests ────────────────────────────────────────────────────────────────

	it("user A gets OWNER permissions in Org A", async () => {
		const perms = await getUserPermissions(userInOrgA.id, orgA.id);
		expect(perms.projects.view).toBe(true);
		expect(perms.settings.organization).toBe(true);
		expect(perms.finance.settings).toBe(true);
	});

	it("user A gets EMPTY permissions when querying Org B", async () => {
		const perms = await getUserPermissions(userInOrgA.id, orgB.id);
		expect(perms).toEqual(createEmptyPermissions());
	});

	it("user B gets OWNER permissions in Org B", async () => {
		const perms = await getUserPermissions(userInOrgB.id, orgB.id);
		expect(perms.projects.view).toBe(true);
		expect(perms.settings.organization).toBe(true);
	});

	it("user B gets EMPTY permissions when querying Org A", async () => {
		const perms = await getUserPermissions(userInOrgB.id, orgA.id);
		expect(perms).toEqual(createEmptyPermissions());
	});

	it("user with dual membership gets OWNER in their primary org", async () => {
		const perms = await getUserPermissions(userInBothMemberships.id, orgA.id);
		expect(perms.projects.view).toBe(true);
		expect(perms.settings.organization).toBe(true);
	});

	it("user with dual membership gets EMPTY in the other org (cross-tenant guard)", async () => {
		// Even though they have a BetterAuth membership in Org B,
		// their organizationId is Org A, so the guard returns empty
		const perms = await getUserPermissions(userInBothMemberships.id, orgB.id);
		expect(perms).toEqual(createEmptyPermissions());
	});

	it("non-existent user ID returns empty permissions", async () => {
		const perms = await getUserPermissions("nonexistent-id-12345", orgA.id);
		expect(perms).toEqual(createEmptyPermissions());
	});

	it("non-existent organization ID returns empty permissions", async () => {
		const perms = await getUserPermissions(userInOrgA.id, "nonexistent-org-12345");
		expect(perms).toEqual(createEmptyPermissions());
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Part 2: verifyProjectAccess — cross-tenant guard
// ═══════════════════════════════════════════════════════════════════════════

describe.skipIf(!HAS_TEST_DB)("Cross-Tenant: verifyProjectAccess", () => {
	let verifyProjectAccess: typeof import("../../lib/permissions/verify-project-access")["verifyProjectAccess"];
	let verifyOrganizationAccess: typeof import("../../lib/permissions/verify-project-access")["verifyOrganizationAccess"];
	let db: any;

	let orgA: { id: string };
	let orgB: { id: string };
	let roleA: { id: string };
	let roleB: { id: string };
	let userA: { id: string };
	let userB: { id: string };
	let projectInA: { id: string };
	let projectInB: { id: string };

	beforeAll(async () => {
		const mod = await import("../../lib/permissions/verify-project-access");
		verifyProjectAccess = mod.verifyProjectAccess;
		verifyOrganizationAccess = mod.verifyOrganizationAccess;
		const dbMod = await import("@repo/database");
		db = dbMod.db;

		orgA = await db.organization.create({
			data: { name: "XTenant Project Org A", createdAt: new Date() },
		});
		orgB = await db.organization.create({
			data: { name: "XTenant Project Org B", createdAt: new Date() },
		});

		roleA = await db.role.create({
			data: {
				name: "Owner",
				type: "OWNER",
				isSystem: true,
				permissions: DEFAULT_ROLE_PERMISSIONS.OWNER as unknown as object,
				organizationId: orgA.id,
			},
		});
		roleB = await db.role.create({
			data: {
				name: "Owner",
				type: "OWNER",
				isSystem: true,
				permissions: DEFAULT_ROLE_PERMISSIONS.OWNER as unknown as object,
				organizationId: orgB.id,
			},
		});

		userA = await db.user.create({
			data: {
				name: "ProjAccess User A",
				email: "xtenant-proj-a@test.local",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
				accountType: "OWNER",
				organizationId: orgA.id,
				organizationRoleId: roleA.id,
			},
		});
		await db.member.create({
			data: { organizationId: orgA.id, userId: userA.id, role: "owner", createdAt: new Date() },
		});

		userB = await db.user.create({
			data: {
				name: "ProjAccess User B",
				email: "xtenant-proj-b@test.local",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
				accountType: "OWNER",
				organizationId: orgB.id,
				organizationRoleId: roleB.id,
			},
		});
		await db.member.create({
			data: { organizationId: orgB.id, userId: userB.id, role: "owner", createdAt: new Date() },
		});

		projectInA = await db.project.create({
			data: {
				organizationId: orgA.id,
				createdById: userA.id,
				name: "Org A Project",
				slug: `xtenant-a-proj-${Date.now()}`,
				status: "ACTIVE",
			},
		});

		projectInB = await db.project.create({
			data: {
				organizationId: orgB.id,
				createdById: userB.id,
				name: "Org B Project",
				slug: `xtenant-b-proj-${Date.now()}`,
				status: "ACTIVE",
			},
		});
	});

	afterAll(async () => {
		const ids = [orgA.id, orgB.id];
		await db.project.deleteMany({ where: { organizationId: { in: ids } } });
		await db.member.deleteMany({ where: { organizationId: { in: ids } } });
		await db.user.deleteMany({
			where: { email: { in: ["xtenant-proj-a@test.local", "xtenant-proj-b@test.local"] } },
		});
		await db.role.deleteMany({ where: { organizationId: { in: ids } } });
		await db.organization.deleteMany({ where: { id: { in: ids } } });
	});

	// ─── Tests ────────────────────────────────────────────────────────────────

	it("user A can access project in Org A", async () => {
		const result = await verifyProjectAccess(projectInA.id, orgA.id, userA.id);
		expect(result.project.id).toBe(projectInA.id);
		expect(result.permissions.projects.view).toBe(true);
	});

	it("user A CANNOT access project in Org B (FORBIDDEN)", async () => {
		await expect(
			verifyProjectAccess(projectInB.id, orgB.id, userA.id),
		).rejects.toThrow();
	});

	it("user B CANNOT access project in Org A (FORBIDDEN)", async () => {
		await expect(
			verifyProjectAccess(projectInA.id, orgA.id, userB.id),
		).rejects.toThrow();
	});

	it("user A CANNOT access Org B's project via Org A's context (NOT_FOUND)", async () => {
		// projectInB belongs to orgB, but we pass orgA — should fail
		await expect(
			verifyProjectAccess(projectInB.id, orgA.id, userA.id),
		).rejects.toThrow();
	});

	it("verifyOrganizationAccess: user A can access Org A", async () => {
		const result = await verifyOrganizationAccess(orgA.id, userA.id);
		expect(result.organization.id).toBe(orgA.id);
	});

	it("verifyOrganizationAccess: user A CANNOT access Org B", async () => {
		await expect(
			verifyOrganizationAccess(orgB.id, userA.id),
		).rejects.toThrow();
	});

	it("non-existent project returns error", async () => {
		await expect(
			verifyProjectAccess("nonexistent-project", orgA.id, userA.id),
		).rejects.toThrow();
	});
});
