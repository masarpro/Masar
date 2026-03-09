/**
 * verifyProjectAccess / verifyOrganizationAccess / requirePermission Tests
 *
 * Part 1: Pure unit tests for requirePermission (no DB)
 * Part 2: Integration tests for verifyProjectAccess (DB-backed)
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ORPCError } from "@orpc/server";
import {
	DEFAULT_ROLE_PERMISSIONS,
	createEmptyPermissions,
	type Permissions,
} from "@repo/database/prisma/permissions";

// ═══════════════════════════════════════════════════════════════════════════
// Part 1: Pure unit tests — requirePermission
// ═══════════════════════════════════════════════════════════════════════════

// Dynamic import to avoid crash when @repo/database is loaded before setup.ts
// sets DATABASE_URL.
let requirePermission: typeof import("../../lib/permissions/verify-project-access")["requirePermission"];

// We must gate all imports behind a lazy loader because verify-project-access
// imports @repo/database, which requires DATABASE_URL at module-load time.
// When DATABASE_URL_TEST is NOT set, setup.ts sets a dummy URL, but the
// top-level import would fire before setup.ts runs.
const lazyImport = async () => {
	const mod = await import("../../lib/permissions/verify-project-access");
	requirePermission = mod.requirePermission;
};

beforeAll(async () => {
	await lazyImport();
});

describe("requirePermission (pure unit)", () => {
	const ownerPerms = DEFAULT_ROLE_PERMISSIONS.OWNER;
	const engineerPerms = DEFAULT_ROLE_PERMISSIONS.ENGINEER;
	const emptyPerms = createEmptyPermissions();

	it("does not throw when permission is granted", () => {
		expect(() => requirePermission(ownerPerms, "projects", "view")).not.toThrow();
	});

	it("does not throw for OWNER on any permission", () => {
		expect(() => requirePermission(ownerPerms, "finance", "settings")).not.toThrow();
		expect(() => requirePermission(ownerPerms, "settings", "organization")).not.toThrow();
		expect(() => requirePermission(ownerPerms, "employees", "payroll")).not.toThrow();
	});

	it("throws FORBIDDEN when permission is denied", () => {
		try {
			requirePermission(engineerPerms, "finance", "invoices");
			expect.unreachable("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(ORPCError);
			expect((err as ORPCError).code).toBe("FORBIDDEN");
		}
	});

	it("throws FORBIDDEN for ENGINEER on settings", () => {
		try {
			requirePermission(engineerPerms, "settings", "users");
			expect.unreachable("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(ORPCError);
			expect((err as ORPCError).code).toBe("FORBIDDEN");
		}
	});

	it("throws FORBIDDEN for empty permissions on any action", () => {
		try {
			requirePermission(emptyPerms, "projects", "view");
			expect.unreachable("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(ORPCError);
			expect((err as ORPCError).code).toBe("FORBIDDEN");
		}
	});

	it("error message is in Arabic", () => {
		try {
			requirePermission(emptyPerms, "projects", "create");
			expect.unreachable("Should have thrown");
		} catch (err) {
			const orpcErr = err as ORPCError;
			expect(orpcErr.message).toContain("صلاحية");
		}
	});

	// Test each section has a proper error message
	const sectionActions: [keyof Permissions, string][] = [
		["projects", "view"],
		["projects", "create"],
		["quantities", "edit"],
		["pricing", "quotations"],
		["finance", "invoices"],
		["employees", "payroll"],
		["company", "expenses"],
		["settings", "users"],
		["reports", "approve"],
	];

	for (const [section, action] of sectionActions) {
		it(`throws with Arabic message for ${section}.${action}`, () => {
			try {
				requirePermission(emptyPerms, section, action);
				expect.unreachable("Should have thrown");
			} catch (err) {
				const orpcErr = err as ORPCError;
				expect(orpcErr.code).toBe("FORBIDDEN");
				// All error messages should contain "صلاحية" (permission)
				expect(orpcErr.message).toContain("صلاحية");
			}
		});
	}
});

// ═══════════════════════════════════════════════════════════════════════════
// Part 2: Integration tests — verifyProjectAccess
// ═══════════════════════════════════════════════════════════════════════════

const HAS_TEST_DB = !!process.env.DATABASE_URL_TEST;

describe.skipIf(!HAS_TEST_DB)("verifyProjectAccess (integration)", () => {
	let verifyProjectAccess: typeof import("../../lib/permissions/verify-project-access")["verifyProjectAccess"];
	let verifyOrganizationAccess: typeof import("../../lib/permissions/verify-project-access")["verifyOrganizationAccess"];
	let db: any;

	let orgId: string;
	let ownerRoleId: string;
	let engineerRoleId: string;
	let ownerUserId: string;
	let engineerUserId: string;
	let noRoleUserId: string;
	let projectId: string;

	beforeAll(async () => {
		const mod = await import("../../lib/permissions/verify-project-access");
		verifyProjectAccess = mod.verifyProjectAccess;
		verifyOrganizationAccess = mod.verifyOrganizationAccess;
		const dbMod = await import("@repo/database");
		db = dbMod.db;

		// ── Setup fixtures ──
		const org = await db.organization.create({
			data: { name: "VPA Test Org", slug: `vpa-test-${Date.now()}`, createdAt: new Date() },
		});
		orgId = org.id;

		const ownerRole = await db.role.create({
			data: {
				name: "Owner",
				type: "OWNER",
				isSystem: true,
				permissions: DEFAULT_ROLE_PERMISSIONS.OWNER as unknown as object,
				organizationId: orgId,
			},
		});
		ownerRoleId = ownerRole.id;

		const engineerRole = await db.role.create({
			data: {
				name: "Engineer",
				type: "ENGINEER",
				isSystem: true,
				permissions: DEFAULT_ROLE_PERMISSIONS.ENGINEER as unknown as object,
				organizationId: orgId,
			},
		});
		engineerRoleId = engineerRole.id;

		// Owner user
		const ownerUser = await db.user.create({
			data: {
				name: "VPA Owner",
				email: "vpa-owner@test.local",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
				accountType: "OWNER",
				organizationId: orgId,
				organizationRoleId: ownerRoleId,
			},
		});
		ownerUserId = ownerUser.id;
		await db.member.create({
			data: { organizationId: orgId, userId: ownerUserId, role: "owner", createdAt: new Date() },
		});

		// Engineer user
		const engineerUser = await db.user.create({
			data: {
				name: "VPA Engineer",
				email: "vpa-engineer@test.local",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
				accountType: "EMPLOYEE",
				organizationId: orgId,
				organizationRoleId: engineerRoleId,
			},
		});
		engineerUserId = engineerUser.id;
		await db.member.create({
			data: { organizationId: orgId, userId: engineerUserId, role: "member", createdAt: new Date() },
		});

		// User with no role
		const noRoleUser = await db.user.create({
			data: {
				name: "VPA NoRole",
				email: "vpa-norole@test.local",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
				accountType: "EMPLOYEE",
				organizationId: orgId,
				organizationRoleId: null,
			},
		});
		noRoleUserId = noRoleUser.id;
		await db.member.create({
			data: { organizationId: orgId, userId: noRoleUserId, role: "member", createdAt: new Date() },
		});

		// Project
		const project = await db.project.create({
			data: {
				organizationId: orgId,
				createdById: ownerUserId,
				name: "VPA Test Project",
				slug: `vpa-project-${Date.now()}`,
				status: "ACTIVE",
			},
		});
		projectId = project.id;
	});

	afterAll(async () => {
		await db.project.deleteMany({ where: { organizationId: orgId } });
		await db.member.deleteMany({ where: { organizationId: orgId } });
		await db.user.deleteMany({
			where: { email: { in: ["vpa-owner@test.local", "vpa-engineer@test.local", "vpa-norole@test.local"] } },
		});
		await db.role.deleteMany({ where: { organizationId: orgId } });
		await db.organization.deleteMany({ where: { id: orgId } });
	});

	// ─── Success Cases ────────────────────────────────────────────────────────

	it("owner can access project without required permission", async () => {
		const result = await verifyProjectAccess(projectId, orgId, ownerUserId);
		expect(result.project.id).toBe(projectId);
		expect(result.organization.id).toBe(orgId);
		expect(result.permissions.projects.view).toBe(true);
	});

	it("owner can access project with required permission", async () => {
		const result = await verifyProjectAccess(projectId, orgId, ownerUserId, {
			section: "projects",
			action: "delete",
		});
		expect(result.project.id).toBe(projectId);
	});

	it("engineer can access project without required permission", async () => {
		const result = await verifyProjectAccess(projectId, orgId, engineerUserId);
		expect(result.project.id).toBe(projectId);
		expect(result.permissions.projects.view).toBe(true);
	});

	it("engineer can access project with granted permission", async () => {
		const result = await verifyProjectAccess(projectId, orgId, engineerUserId, {
			section: "projects",
			action: "edit",
		});
		expect(result.project.id).toBe(projectId);
	});

	// ─── Failure Cases ────────────────────────────────────────────────────────

	it("engineer CANNOT access project with denied permission (finance.invoices)", async () => {
		try {
			await verifyProjectAccess(projectId, orgId, engineerUserId, {
				section: "finance",
				action: "invoices",
			});
			expect.unreachable("Should have thrown FORBIDDEN");
		} catch (err) {
			expect(err).toBeInstanceOf(ORPCError);
			expect((err as ORPCError).code).toBe("FORBIDDEN");
		}
	});

	it("non-existent project returns NOT_FOUND", async () => {
		try {
			await verifyProjectAccess("nonexistent-project-id", orgId, ownerUserId);
			expect.unreachable("Should have thrown NOT_FOUND");
		} catch (err) {
			expect(err).toBeInstanceOf(ORPCError);
			expect((err as ORPCError).code).toBe("NOT_FOUND");
		}
	});

	it("non-member user returns FORBIDDEN", async () => {
		// Create a user NOT in this org
		const outsideUser = await db.user.create({
			data: {
				name: "VPA Outside",
				email: "vpa-outside@test.local",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
				accountType: "EMPLOYEE",
				organizationId: null,
			},
		});

		try {
			await verifyProjectAccess(projectId, orgId, outsideUser.id);
			expect.unreachable("Should have thrown FORBIDDEN");
		} catch (err) {
			expect(err).toBeInstanceOf(ORPCError);
			expect((err as ORPCError).code).toBe("FORBIDDEN");
		} finally {
			await db.user.delete({ where: { id: outsideUser.id } });
		}
	});

	// ─── verifyOrganizationAccess ──────────────────────────────────────────

	it("verifyOrganizationAccess returns org + permissions for member", async () => {
		const result = await verifyOrganizationAccess(orgId, ownerUserId);
		expect(result.organization.id).toBe(orgId);
		expect(result.permissions.projects.view).toBe(true);
	});

	it("verifyOrganizationAccess with required permission (granted)", async () => {
		const result = await verifyOrganizationAccess(orgId, ownerUserId, {
			section: "settings",
			action: "users",
		});
		expect(result.permissions.settings.users).toBe(true);
	});

	it("verifyOrganizationAccess with required permission (denied) throws FORBIDDEN", async () => {
		try {
			await verifyOrganizationAccess(orgId, engineerUserId, {
				section: "settings",
				action: "users",
			});
			expect.unreachable("Should have thrown FORBIDDEN");
		} catch (err) {
			expect(err).toBeInstanceOf(ORPCError);
			expect((err as ORPCError).code).toBe("FORBIDDEN");
		}
	});

	it("verifyOrganizationAccess for non-member throws FORBIDDEN", async () => {
		const outsideUser = await db.user.create({
			data: {
				name: "VPA Outside 2",
				email: "vpa-outside2@test.local",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
				organizationId: null,
			},
		});

		try {
			await verifyOrganizationAccess(orgId, outsideUser.id);
			expect.unreachable("Should have thrown FORBIDDEN");
		} catch (err) {
			expect(err).toBeInstanceOf(ORPCError);
			expect((err as ORPCError).code).toBe("FORBIDDEN");
		} finally {
			await db.user.delete({ where: { id: outsideUser.id } });
		}
	});
});
