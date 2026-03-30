/**
 * Permission Matrix Tests
 *
 * Exhaustive verification that every role gets exactly the correct
 * permissions across all 8 sections (44 total permission flags).
 *
 * Uses test.each to cover all role × section × action combinations.
 */
import { describe, it, expect } from "vitest";
import {
	DEFAULT_ROLE_PERMISSIONS,
	hasPermission,
	createEmptyPermissions,
	type Permissions,
} from "@repo/database/prisma/permissions";

// ─── All roles ───────────────────────────────────────────────────────────────

const ROLES = ["OWNER", "PROJECT_MANAGER", "ACCOUNTANT", "ENGINEER", "SUPERVISOR", "CUSTOM"] as const;

// ─── All 8 sections with their actions ───────────────────────────────────────

const SECTIONS: Record<keyof Permissions, string[]> = {
	projects: ["view", "create", "edit", "delete", "viewFinance", "manageTeam"],
	quantities: ["view", "create", "edit", "delete", "pricing"],
	pricing: ["view", "studies", "quotations", "pricing", "leads"],
	finance: ["view", "quotations", "invoices", "payments", "reports", "settings"],
	employees: ["view", "create", "edit", "delete", "payroll", "attendance"],
	company: ["view", "expenses", "assets", "reports"],
	settings: ["organization", "users", "roles", "billing", "integrations"],
	reports: ["view", "create", "approve"],
};

// ─── Expected grants per role ────────────────────────────────────────────────

const EXPECTED: Record<string, Set<string>> = {
	OWNER: new Set([
		"projects.view", "projects.create", "projects.edit", "projects.delete", "projects.viewFinance", "projects.manageTeam",
		"quantities.view", "quantities.create", "quantities.edit", "quantities.delete", "quantities.pricing",
		"pricing.view", "pricing.studies", "pricing.quotations", "pricing.pricing", "pricing.leads",
		"finance.view", "finance.quotations", "finance.invoices", "finance.payments", "finance.reports", "finance.settings",
		"employees.view", "employees.create", "employees.edit", "employees.delete", "employees.payroll", "employees.attendance",
		"company.view", "company.expenses", "company.assets", "company.reports",
		"settings.organization", "settings.users", "settings.roles", "settings.billing", "settings.integrations",
		"reports.view", "reports.create", "reports.approve",
	]),

	PROJECT_MANAGER: new Set([
		"projects.view", "projects.create", "projects.edit", "projects.viewFinance", "projects.manageTeam",
		"quantities.view", "quantities.create", "quantities.edit", "quantities.pricing",
		"pricing.view", "pricing.studies", "pricing.quotations", "pricing.pricing", "pricing.leads",
		"finance.view", "finance.quotations", "finance.reports",
		"employees.view", "employees.attendance",
		"company.view", "company.assets", "company.reports",
		"reports.view", "reports.create", "reports.approve",
	]),

	ACCOUNTANT: new Set([
		"projects.view", "projects.viewFinance",
		"quantities.view", "quantities.pricing",
		"pricing.view", "pricing.quotations", "pricing.pricing", "pricing.leads",
		"finance.view", "finance.quotations", "finance.invoices", "finance.payments", "finance.reports", "finance.settings",
		"employees.view", "employees.payroll",
		"company.view", "company.expenses", "company.assets", "company.reports",
		"reports.view",
	]),

	ENGINEER: new Set([
		"projects.view", "projects.edit",
		"quantities.view", "quantities.create", "quantities.edit",
		"pricing.view", "pricing.studies",
		"reports.view", "reports.create",
	]),

	SUPERVISOR: new Set([
		"projects.view",
		"quantities.view",
		"pricing.view",
		"reports.view", "reports.create",
	]),

	CUSTOM: new Set([]),
};

// ─── Section count checks ────────────────────────────────────────────────────

describe("Permission sections structure", () => {
	it("has exactly 8 sections", () => {
		expect(Object.keys(SECTIONS)).toHaveLength(8);
	});

	it("projects has 6 permissions", () => {
		expect(SECTIONS.projects).toHaveLength(6);
	});

	it("quantities has 5 permissions", () => {
		expect(SECTIONS.quantities).toHaveLength(5);
	});

	it("pricing has 5 permissions", () => {
		expect(SECTIONS.pricing).toHaveLength(5);
	});

	it("finance has 6 permissions", () => {
		expect(SECTIONS.finance).toHaveLength(6);
	});

	it("employees has 6 permissions", () => {
		expect(SECTIONS.employees).toHaveLength(6);
	});

	it("company has 4 permissions", () => {
		expect(SECTIONS.company).toHaveLength(4);
	});

	it("settings has 5 permissions", () => {
		expect(SECTIONS.settings).toHaveLength(5);
	});

	it("reports has 3 permissions", () => {
		expect(SECTIONS.reports).toHaveLength(3);
	});

	it("total is 40 permissions across all sections", () => {
		const total = Object.values(SECTIONS).reduce((sum, actions) => sum + actions.length, 0);
		expect(total).toBe(40);
	});
});

// ─── Per-role grant count checks ─────────────────────────────────────────────

describe("Permission grant counts", () => {
	it.each([
		["OWNER", 40],
		["PROJECT_MANAGER", 25],
		["ACCOUNTANT", 21],
		["ENGINEER", 9],
		["SUPERVISOR", 5],
		["CUSTOM", 0],
	])("%s has %d granted permissions", (role, expectedCount) => {
		expect(EXPECTED[role].size).toBe(expectedCount);
	});
});

// ─── Full matrix: each role × each section ───────────────────────────────────

describe("Permission Matrix — full coverage", () => {
	for (const role of ROLES) {
		describe(`Role: ${role}`, () => {
			const perms = DEFAULT_ROLE_PERMISSIONS[role];
			const grants = EXPECTED[role];

			// Test each section
			for (const [section, actions] of Object.entries(SECTIONS)) {
				describe(`Section: ${section}`, () => {
					for (const action of actions) {
						const key = `${section}.${action}`;
						const expected = grants.has(key);

						it(`${action} → ${expected ? "GRANTED" : "DENIED"}`, () => {
							const sectionPerms = perms[section as keyof Permissions];
							const actual = (sectionPerms as unknown as Record<string, boolean>)[action];
							expect(actual).toBe(expected);
						});
					}
				});
			}

			// Cross-check with hasPermission
			it("hasPermission agrees with direct property access for all 40 flags", () => {
				for (const [section, actions] of Object.entries(SECTIONS)) {
					for (const action of actions) {
						const key = `${section}.${action}`;
						expect(
							hasPermission(perms, section as keyof Permissions, action),
							`hasPermission(${role}, ${key})`,
						).toBe(grants.has(key));
					}
				}
			});
		});
	}
});

// ─── OWNER has all permissions ───────────────────────────────────────────────

describe("OWNER completeness", () => {
	const ownerPerms = DEFAULT_ROLE_PERMISSIONS.OWNER;

	it("every single permission flag is true", () => {
		for (const [section, actions] of Object.entries(SECTIONS)) {
			for (const action of actions) {
				const sectionPerms = ownerPerms[section as keyof Permissions];
				expect(
					(sectionPerms as unknown as Record<string, boolean>)[action],
					`OWNER.${section}.${action}`,
				).toBe(true);
			}
		}
	});
});

// ─── CUSTOM has no permissions ───────────────────────────────────────────────

describe("CUSTOM completeness", () => {
	const customPerms = DEFAULT_ROLE_PERMISSIONS.CUSTOM;

	it("every single permission flag is false", () => {
		for (const [section, actions] of Object.entries(SECTIONS)) {
			for (const action of actions) {
				const sectionPerms = customPerms[section as keyof Permissions];
				expect(
					(sectionPerms as unknown as Record<string, boolean>)[action],
					`CUSTOM.${section}.${action}`,
				).toBe(false);
			}
		}
	});

	it("matches createEmptyPermissions()", () => {
		expect(customPerms).toEqual(createEmptyPermissions());
	});
});

// ─── Role hierarchy: OWNER > PM > ACCOUNTANT ─────────────────────────────────

describe("Role hierarchy sanity checks", () => {
	it("OWNER grants are a superset of PROJECT_MANAGER grants", () => {
		for (const key of EXPECTED.PROJECT_MANAGER) {
			expect(EXPECTED.OWNER.has(key), `OWNER should have ${key}`).toBe(true);
		}
	});

	it("OWNER grants are a superset of ACCOUNTANT grants", () => {
		for (const key of EXPECTED.ACCOUNTANT) {
			expect(EXPECTED.OWNER.has(key), `OWNER should have ${key}`).toBe(true);
		}
	});

	it("OWNER grants are a superset of ENGINEER grants", () => {
		for (const key of EXPECTED.ENGINEER) {
			expect(EXPECTED.OWNER.has(key), `OWNER should have ${key}`).toBe(true);
		}
	});

	it("OWNER grants are a superset of SUPERVISOR grants", () => {
		for (const key of EXPECTED.SUPERVISOR) {
			expect(EXPECTED.OWNER.has(key), `OWNER should have ${key}`).toBe(true);
		}
	});

	it("SUPERVISOR grants are a subset of ENGINEER grants", () => {
		for (const key of EXPECTED.SUPERVISOR) {
			expect(EXPECTED.ENGINEER.has(key), `ENGINEER should have ${key}`).toBe(true);
		}
	});
});

// ─── Section-specific isolation checks ───────────────────────────────────────

describe("Section isolation — finance", () => {
	it("ENGINEER has zero finance permissions", () => {
		const perms = DEFAULT_ROLE_PERMISSIONS.ENGINEER;
		for (const action of SECTIONS.finance) {
			expect(
				(perms.finance as unknown as Record<string, boolean>)[action],
				`ENGINEER.finance.${action}`,
			).toBe(false);
		}
	});

	it("SUPERVISOR has zero finance permissions", () => {
		const perms = DEFAULT_ROLE_PERMISSIONS.SUPERVISOR;
		for (const action of SECTIONS.finance) {
			expect(
				(perms.finance as unknown as Record<string, boolean>)[action],
				`SUPERVISOR.finance.${action}`,
			).toBe(false);
		}
	});
});

describe("Section isolation — settings", () => {
	it("only OWNER has settings permissions", () => {
		for (const role of ROLES) {
			if (role === "OWNER") continue;
			const perms = DEFAULT_ROLE_PERMISSIONS[role];
			for (const action of SECTIONS.settings) {
				expect(
					(perms.settings as unknown as Record<string, boolean>)[action],
					`${role}.settings.${action}`,
				).toBe(false);
			}
		}
	});
});

describe("Section isolation — employees", () => {
	it("ENGINEER and SUPERVISOR have zero employee permissions", () => {
		for (const role of ["ENGINEER", "SUPERVISOR"] as const) {
			const perms = DEFAULT_ROLE_PERMISSIONS[role];
			for (const action of SECTIONS.employees) {
				expect(
					(perms.employees as unknown as Record<string, boolean>)[action],
					`${role}.employees.${action}`,
				).toBe(false);
			}
		}
	});
});
