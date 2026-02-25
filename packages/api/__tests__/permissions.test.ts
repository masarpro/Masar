/**
 * RBAC Matrix Tests — Sprint 3.3
 *
 * Part 1: Pure unit tests for DEFAULT_ROLE_PERMISSIONS, hasPermission, createEmptyPermissions
 * Part 2: Integration tests for getUserPermissions (DB-backed)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
	DEFAULT_ROLE_PERMISSIONS,
	hasPermission,
	createEmptyPermissions,
	type Permissions,
} from "@repo/database/prisma/permissions";

// ═════════════════════════════════════════════════════════════════════════════
// Constants
// ═════════════════════════════════════════════════════════════════════════════

const ALL_ROLES = [
	"OWNER",
	"PROJECT_MANAGER",
	"ACCOUNTANT",
	"ENGINEER",
	"SUPERVISOR",
	"CUSTOM",
] as const;

const ALL_SECTIONS = [
	"projects",
	"quantities",
	"finance",
	"employees",
	"company",
	"settings",
	"reports",
] as const;

/**
 * Expected "granted" permissions per role.
 * Every section.action NOT listed here is expected to be false.
 */
const EXPECTED_GRANTS: Record<string, Set<string>> = {
	OWNER: new Set([
		// All permissions granted
		"projects.view",
		"projects.create",
		"projects.edit",
		"projects.delete",
		"projects.viewFinance",
		"projects.manageTeam",
		"quantities.view",
		"quantities.create",
		"quantities.edit",
		"quantities.delete",
		"quantities.pricing",
		"finance.view",
		"finance.quotations",
		"finance.invoices",
		"finance.payments",
		"finance.reports",
		"finance.settings",
		"employees.view",
		"employees.create",
		"employees.edit",
		"employees.delete",
		"employees.payroll",
		"employees.attendance",
		"company.view",
		"company.expenses",
		"company.assets",
		"company.reports",
		"settings.organization",
		"settings.users",
		"settings.roles",
		"settings.billing",
		"settings.integrations",
		"reports.view",
		"reports.create",
		"reports.approve",
	]),

	PROJECT_MANAGER: new Set([
		"projects.view",
		"projects.create",
		"projects.edit",
		"projects.viewFinance",
		"projects.manageTeam",
		"quantities.view",
		"quantities.create",
		"quantities.edit",
		"quantities.pricing",
		"finance.view",
		"finance.quotations",
		"finance.reports",
		"employees.view",
		"employees.attendance",
		"company.view",
		"company.assets",
		"company.reports",
		"reports.view",
		"reports.create",
		"reports.approve",
	]),

	ACCOUNTANT: new Set([
		"projects.view",
		"projects.viewFinance",
		"quantities.view",
		"quantities.pricing",
		"finance.view",
		"finance.quotations",
		"finance.invoices",
		"finance.payments",
		"finance.reports",
		"finance.settings",
		"employees.view",
		"employees.payroll",
		"company.view",
		"company.expenses",
		"company.assets",
		"company.reports",
		"reports.view",
	]),

	ENGINEER: new Set([
		"projects.view",
		"projects.edit",
		"quantities.view",
		"quantities.create",
		"quantities.edit",
		"reports.view",
		"reports.create",
	]),

	SUPERVISOR: new Set([
		"projects.view",
		"quantities.view",
		"reports.view",
		"reports.create",
	]),

	CUSTOM: new Set([
		// All denied — empty set
	]),
};

/** Collect all "section.action" keys from a Permissions object. */
function allPermKeys(perms: Permissions): string[] {
	const keys: string[] = [];
	for (const section of ALL_SECTIONS) {
		for (const action of Object.keys(perms[section])) {
			keys.push(`${section}.${action}`);
		}
	}
	return keys;
}

// ═════════════════════════════════════════════════════════════════════════════
// Part 1: Pure unit tests — no DB required
// ═════════════════════════════════════════════════════════════════════════════

describe("DEFAULT_ROLE_PERMISSIONS", () => {
	it("defines permissions for all 6 roles", () => {
		for (const role of ALL_ROLES) {
			expect(
				DEFAULT_ROLE_PERMISSIONS[role],
				`Missing permissions for role: ${role}`,
			).toBeDefined();
		}
	});

	it("each role has all 7 permission sections", () => {
		for (const role of ALL_ROLES) {
			for (const section of ALL_SECTIONS) {
				expect(
					DEFAULT_ROLE_PERMISSIONS[role][section],
					`${role} missing section: ${section}`,
				).toBeDefined();
			}
		}
	});
});

describe("RBAC Matrix — per-role permission grants", () => {
	const referencePerms = DEFAULT_ROLE_PERMISSIONS.OWNER;
	const allKeys = allPermKeys(referencePerms);

	for (const role of ALL_ROLES) {
		describe(role, () => {
			const perms = DEFAULT_ROLE_PERMISSIONS[role];
			const grants = EXPECTED_GRANTS[role];

			it("grants exactly the expected permissions", () => {
				for (const key of allKeys) {
					const [section, action] = key.split(".");
					const sectionPerms = perms[section as keyof Permissions];
					const actual = (sectionPerms as unknown as Record<string, boolean>)[action];
					const expected = grants.has(key);

					expect(actual, `${role}.${key}`).toBe(expected);
				}
			});

			it(`has ${grants.size} granted permissions`, () => {
				let grantedCount = 0;
				for (const key of allKeys) {
					const [section, action] = key.split(".");
					const val = (perms[section as keyof Permissions] as unknown as Record<string, boolean>)[action];
					if (val) grantedCount++;
				}
				expect(grantedCount).toBe(grants.size);
			});
		});
	}
});

// ─── hasPermission ──────────────────────────────────────────────────────────

describe("hasPermission", () => {
	it("returns true for a granted permission", () => {
		const ownerPerms = DEFAULT_ROLE_PERMISSIONS.OWNER;
		expect(hasPermission(ownerPerms, "finance", "settings")).toBe(true);
	});

	it("returns false for a denied permission", () => {
		const engineerPerms = DEFAULT_ROLE_PERMISSIONS.ENGINEER;
		expect(hasPermission(engineerPerms, "finance", "view")).toBe(false);
	});

	it("returns false for null permissions", () => {
		expect(hasPermission(null, "projects", "view")).toBe(false);
	});

	it("returns false for undefined permissions", () => {
		expect(hasPermission(undefined, "projects", "view")).toBe(false);
	});

	it("returns false for unknown action in a valid section", () => {
		const ownerPerms = DEFAULT_ROLE_PERMISSIONS.OWNER;
		expect(hasPermission(ownerPerms, "projects", "nonexistent")).toBe(false);
	});

	it("returns false for unknown section", () => {
		const ownerPerms = DEFAULT_ROLE_PERMISSIONS.OWNER;
		expect(
			hasPermission(ownerPerms, "nonexistent" as keyof Permissions, "view"),
		).toBe(false);
	});

	// Cross-check: every expected grant matches hasPermission
	for (const role of ALL_ROLES) {
		it(`agrees with EXPECTED_GRANTS for ${role}`, () => {
			const perms = DEFAULT_ROLE_PERMISSIONS[role];
			const grants = EXPECTED_GRANTS[role];

			for (const section of ALL_SECTIONS) {
				for (const action of Object.keys(perms[section])) {
					const expected = grants.has(`${section}.${action}`);
					expect(
						hasPermission(perms, section, action),
						`hasPermission(${role}, ${section}, ${action})`,
					).toBe(expected);
				}
			}
		});
	}
});

// ─── createEmptyPermissions ─────────────────────────────────────────────────

describe("createEmptyPermissions", () => {
	const empty = createEmptyPermissions();

	it("has all 7 sections", () => {
		for (const section of ALL_SECTIONS) {
			expect(empty[section], `Missing section: ${section}`).toBeDefined();
		}
	});

	it("every action in every section is false", () => {
		for (const section of ALL_SECTIONS) {
			for (const [action, val] of Object.entries(empty[section])) {
				expect(val, `empty.${section}.${action}`).toBe(false);
			}
		}
	});

	it("matches CUSTOM role defaults", () => {
		expect(empty).toEqual(DEFAULT_ROLE_PERMISSIONS.CUSTOM);
	});

	it("returns a new object on each call (no shared reference)", () => {
		const a = createEmptyPermissions();
		const b = createEmptyPermissions();
		expect(a).not.toBe(b);
		expect(a).toEqual(b);
	});
});

// ═════════════════════════════════════════════════════════════════════════════
// Part 2: Integration tests — getUserPermissions with real DB
// ═════════════════════════════════════════════════════════════════════════════

// Skip all integration tests if no test DB is available.
// Setup.ts overrides DATABASE_URL only when DATABASE_URL_TEST is present.
const HAS_TEST_DB = !!process.env.DATABASE_URL_TEST;

describe.skipIf(!HAS_TEST_DB)("getUserPermissions (integration)", () => {
	// Lazy-loaded inside beforeAll to avoid crashing when DATABASE_URL is unset.
	let getUserPermissions: typeof import("../lib/permissions/get-user-permissions")["getUserPermissions"];
	let db: typeof import("@repo/database")["db"];

	// ─── Fixtures ────────────────────────────────────────────────────────────
	let orgId: string;
	let otherOrgId: string;
	let ownerRoleId: string;
	let accountantRoleId: string;
	let partialRoleId: string;
	let ownerUserId: string;
	let accountantUserId: string;
	let noRoleUserId: string;
	let crossOrgUserId: string;
	let customPermsUserId: string;
	let partialRoleUserId: string;

	beforeAll(async () => {
		// Dynamic import — only runs when HAS_TEST_DB is true
		const permsMod = await import("../lib/permissions/get-user-permissions");
		getUserPermissions = permsMod.getUserPermissions;
		const dbMod = await import("@repo/database");
		db = dbMod.db;

		// ── Organizations ──
		const org = await db.organization.create({
			data: { name: "RBAC Test Org", createdAt: new Date() },
		});
		orgId = org.id;

		const otherOrg = await db.organization.create({
			data: { name: "RBAC Other Org", createdAt: new Date() },
		});
		otherOrgId = otherOrg.id;

		// ── Roles ──
		const ownerRole = await db.role.create({
			data: {
				name: "مالك",
				type: "OWNER",
				isSystem: true,
				permissions: DEFAULT_ROLE_PERMISSIONS.OWNER as unknown as object,
				organizationId: orgId,
			},
		});
		ownerRoleId = ownerRole.id;

		const accountantRole = await db.role.create({
			data: {
				name: "محاسب",
				type: "ACCOUNTANT",
				isSystem: true,
				permissions: DEFAULT_ROLE_PERMISSIONS.ACCOUNTANT as unknown as object,
				organizationId: orgId,
			},
		});
		accountantRoleId = accountantRole.id;

		// Role with MISSING sections (simulates pre-migration role that predates
		// the "company" and "reports" sections being added to the schema)
		const partialRole = await db.role.create({
			data: {
				name: "Partial Role",
				type: "ENGINEER",
				isSystem: false,
				permissions: {
					projects: {
						view: true,
						create: false,
						edit: true,
						delete: false,
						viewFinance: false,
						manageTeam: false,
					},
					quantities: {
						view: true,
						create: true,
						edit: true,
						delete: false,
						pricing: false,
					},
					finance: {
						view: false,
						quotations: false,
						invoices: false,
						payments: false,
						reports: false,
						settings: false,
					},
					employees: {
						view: false,
						create: false,
						edit: false,
						delete: false,
						payroll: false,
						attendance: false,
					},
					// "company", "settings", "reports" sections MISSING
				} as unknown as object,
				organizationId: orgId,
			},
		});
		partialRoleId = partialRole.id;

		// ── Users ──

		// 1. OWNER in orgId
		const ownerUser = await db.user.create({
			data: {
				name: "Test Owner",
				email: "rbac-owner@test.local",
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
			data: {
				organizationId: orgId,
				userId: ownerUserId,
				role: "owner",
				createdAt: new Date(),
			},
		});

		// 2. ACCOUNTANT in orgId
		const accountantUser = await db.user.create({
			data: {
				name: "Test Accountant",
				email: "rbac-accountant@test.local",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
				accountType: "EMPLOYEE",
				organizationId: orgId,
				organizationRoleId: accountantRoleId,
			},
		});
		accountantUserId = accountantUser.id;
		await db.member.create({
			data: {
				organizationId: orgId,
				userId: accountantUserId,
				role: "member",
				createdAt: new Date(),
			},
		});

		// 3. User with NO role assignment
		const noRoleUser = await db.user.create({
			data: {
				name: "No Role User",
				email: "rbac-norole@test.local",
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

		// 4. Cross-org user: OWNER in otherOrg, member in orgId
		const crossOrgUser = await db.user.create({
			data: {
				name: "Cross Org User",
				email: "rbac-crossorg@test.local",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
				accountType: "OWNER",
				organizationId: otherOrgId, // primary org is OTHER
				organizationRoleId: null,
			},
		});
		crossOrgUserId = crossOrgUser.id;
		// Has membership in orgId (via invitation), but role belongs to otherOrg
		await db.member.create({
			data: {
				organizationId: orgId,
				userId: crossOrgUserId,
				role: "member",
				createdAt: new Date(),
			},
		});

		// 5. User with customPermissions override
		const customPermsUser = await db.user.create({
			data: {
				name: "Custom Perms User",
				email: "rbac-custom@test.local",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
				accountType: "EMPLOYEE",
				organizationId: orgId,
				organizationRoleId: accountantRoleId, // base = ACCOUNTANT
				customPermissions: {
					// Override: grant settings.organization (accountant doesn't have this)
					settings: {
						organization: true,
						users: true,
						roles: false,
						billing: false,
						integrations: false,
					},
					// Override: deny finance.settings (accountant normally has this)
					finance: {
						view: true,
						quotations: true,
						invoices: true,
						payments: true,
						reports: true,
						settings: false,
					},
				},
			},
		});
		customPermsUserId = customPermsUser.id;

		// 6. User with partial role (missing sections — tests fillMissingSections)
		const partialRoleUser = await db.user.create({
			data: {
				name: "Partial Role User",
				email: "rbac-partial@test.local",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
				accountType: "EMPLOYEE",
				organizationId: orgId,
				organizationRoleId: partialRoleId,
			},
		});
		partialRoleUserId = partialRoleUser.id;
	});

	afterAll(async () => {
		// Clean up in reverse dependency order
		await db.member.deleteMany({
			where: { organizationId: { in: [orgId, otherOrgId] } },
		});
		await db.user.deleteMany({
			where: {
				email: { in: [
					"rbac-owner@test.local",
					"rbac-accountant@test.local",
					"rbac-norole@test.local",
					"rbac-crossorg@test.local",
					"rbac-custom@test.local",
					"rbac-partial@test.local",
				] },
			},
		});
		await db.role.deleteMany({
			where: { organizationId: { in: [orgId, otherOrgId] } },
		});
		await db.organization.deleteMany({
			where: { id: { in: [orgId, otherOrgId] } },
		});
	});

	// ─── Tests ───────────────────────────────────────────────────────────────

	it("OWNER user gets full permissions", async () => {
		const perms = await getUserPermissions(ownerUserId, orgId);
		const grants = EXPECTED_GRANTS.OWNER;

		for (const section of ALL_SECTIONS) {
			for (const [action, val] of Object.entries(perms[section])) {
				expect(
					val,
					`OWNER: ${section}.${action}`,
				).toBe(grants.has(`${section}.${action}`));
			}
		}
	});

	it("ACCOUNTANT user gets accountant permissions", async () => {
		const perms = await getUserPermissions(accountantUserId, orgId);
		const grants = EXPECTED_GRANTS.ACCOUNTANT;

		for (const section of ALL_SECTIONS) {
			for (const [action, val] of Object.entries(perms[section])) {
				expect(
					val,
					`ACCOUNTANT: ${section}.${action}`,
				).toBe(grants.has(`${section}.${action}`));
			}
		}
	});

	it("user with no role returns empty permissions", async () => {
		const perms = await getUserPermissions(noRoleUserId, orgId);
		const empty = createEmptyPermissions();
		expect(perms).toEqual(empty);
	});

	it("non-existent user returns empty permissions", async () => {
		const perms = await getUserPermissions("nonexistent-user-id", orgId);
		const empty = createEmptyPermissions();
		expect(perms).toEqual(empty);
	});

	it("cross-org user returns empty permissions (org isolation guard)", async () => {
		// crossOrgUser's organizationId = otherOrgId, but we ask for orgId
		const perms = await getUserPermissions(crossOrgUserId, orgId);
		const empty = createEmptyPermissions();
		expect(perms).toEqual(empty);
	});

	it("customPermissions override role permissions", async () => {
		const perms = await getUserPermissions(customPermsUserId, orgId);

		// Custom override granted settings.organization (accountant default = false)
		expect(perms.settings.organization).toBe(true);
		expect(perms.settings.users).toBe(true);

		// Custom override denied finance.settings (accountant default = true)
		expect(perms.finance.settings).toBe(false);

		// Non-overridden sections retain accountant defaults
		expect(perms.finance.view).toBe(true);
		expect(perms.finance.invoices).toBe(true);
		expect(perms.projects.view).toBe(true);
		expect(perms.projects.create).toBe(false); // accountant can't create projects
		expect(perms.employees.payroll).toBe(true); // accountant can
	});

	it("fillMissingSections fills missing sections from role-type defaults", async () => {
		// partialRole stored permissions are missing company, settings, reports sections.
		// Since role.type = "ENGINEER", fillMissingSections should fill them from
		// DEFAULT_ROLE_PERMISSIONS.ENGINEER.
		const perms = await getUserPermissions(partialRoleUserId, orgId);
		const engineerDefaults = DEFAULT_ROLE_PERMISSIONS.ENGINEER;

		// Stored sections should come from stored values
		expect(perms.projects.view).toBe(true);
		expect(perms.projects.edit).toBe(true);
		expect(perms.projects.create).toBe(false);
		expect(perms.quantities.view).toBe(true);
		expect(perms.quantities.create).toBe(true);

		// Missing sections should be filled from ENGINEER defaults
		expect(perms.company).toEqual(engineerDefaults.company);
		expect(perms.settings).toEqual(engineerDefaults.settings);
		expect(perms.reports).toEqual(engineerDefaults.reports);
	});

	it("fillMissingSections fills missing sub-keys within existing sections", async () => {
		// If a stored section has a subset of keys (e.g. a new action was added),
		// fillMissingSections should fill the missing sub-key from defaults.
		// We test this by creating a role with a section that's missing a key.
		const roleWithMissingKey = await db.role.create({
			data: {
				name: "Missing Subkey Role",
				type: "OWNER",
				isSystem: false,
				permissions: {
					projects: {
						view: true,
						create: true,
						edit: true,
						delete: true,
						viewFinance: true,
						// "manageTeam" key is MISSING
					},
					quantities: DEFAULT_ROLE_PERMISSIONS.OWNER.quantities,
					finance: DEFAULT_ROLE_PERMISSIONS.OWNER.finance,
					employees: DEFAULT_ROLE_PERMISSIONS.OWNER.employees,
					company: DEFAULT_ROLE_PERMISSIONS.OWNER.company,
					settings: DEFAULT_ROLE_PERMISSIONS.OWNER.settings,
					reports: DEFAULT_ROLE_PERMISSIONS.OWNER.reports,
				} as unknown as object,
				organizationId: orgId,
			},
		});

		const user = await db.user.create({
			data: {
				name: "Subkey Test User",
				email: "rbac-subkey@test.local",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
				organizationId: orgId,
				organizationRoleId: roleWithMissingKey.id,
			},
		});

		try {
			const perms = await getUserPermissions(user.id, orgId);

			// Stored keys should be preserved
			expect(perms.projects.view).toBe(true);
			expect(perms.projects.delete).toBe(true);

			// Missing sub-key "manageTeam" should be filled from OWNER defaults (true)
			expect(perms.projects.manageTeam).toBe(true);
		} finally {
			// Clean up inline fixtures
			await db.user.delete({ where: { id: user.id } });
			await db.role.delete({ where: { id: roleWithMissingKey.id } });
		}
	});
});
