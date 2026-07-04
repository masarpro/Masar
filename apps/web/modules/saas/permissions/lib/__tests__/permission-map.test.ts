/**
 * Sidebar permission-map tests (RBAC-UI Stage 2/7)
 *
 * Verifies the central sidebar predicates against the ACTUAL
 * DEFAULT_ROLE_PERMISSIONS of the five system roles, including the
 * three critical acceptance cases, plus route-rule resolution.
 */

import {
	DEFAULT_ROLE_PERMISSIONS,
	type Permissions,
} from "@repo/database/prisma/permissions";
import { describe, expect, it } from "vitest";
import {
	FINANCE_ROUTE_PERMISSIONS,
	findRouteRule,
	isSidebarItemVisible,
	type PermissionCheckers,
} from "../permission-map";

function checkersFor(permissions: Permissions): PermissionCheckers {
	return {
		can: (section, action) =>
			(permissions[section] as unknown as Record<string, boolean>)?.[
				action
			] ?? false,
		canAny: (section) =>
			Object.values(
				(permissions[section] as unknown as Record<string, boolean>) ??
					{},
			).some(Boolean),
	};
}

const ROLE = (name: string) => checkersFor(DEFAULT_ROLE_PERMISSIONS[name]);

const visible = (itemId: string, role: string) =>
	isSidebarItemVisible(itemId, ROLE(role), false);

describe("main groups per system role", () => {
	it.each([
		// [itemId, OWNER, PM, ACCOUNTANT, ENGINEER, SUPERVISOR]
		["projects", true, true, true, true, true],
		["finance", true, true, true, false, false],
		["pricing", true, true, true, true, true],
		["company", true, true, true, false, false],
	])("%s group visibility", (itemId, owner, pm, acc, eng, sup) => {
		expect(visible(itemId, "OWNER")).toBe(owner);
		expect(visible(itemId, "PROJECT_MANAGER")).toBe(pm);
		expect(visible(itemId, "ACCOUNTANT")).toBe(acc);
		expect(visible(itemId, "ENGINEER")).toBe(eng);
		expect(visible(itemId, "SUPERVISOR")).toBe(sup);
	});
});

describe("finance children", () => {
	it("operational finance pages require finance.view", () => {
		for (const id of [
			"finance-dashboard",
			"finance-expenses",
			"finance-clients",
			"finance-banks",
			"finance-documents",
		]) {
			expect(visible(id, "ACCOUNTANT")).toBe(true);
			expect(visible(id, "ENGINEER")).toBe(false);
			expect(visible(id, "SUPERVISOR")).toBe(false);
		}
	});

	it("invoices/payments are accountant-level, hidden from PM", () => {
		expect(visible("finance-invoices", "ACCOUNTANT")).toBe(true);
		expect(visible("finance-invoices", "PROJECT_MANAGER")).toBe(false);
		expect(visible("finance-payments", "ACCOUNTANT")).toBe(true);
		expect(visible("finance-payments", "PROJECT_MANAGER")).toBe(false);
	});

	it("accounting structure pages require finance.settings (owner + accountant only)", () => {
		for (const id of [
			"finance-chart-of-accounts",
			"finance-journal-entries",
			"finance-opening-balances",
			"finance-accounting-periods",
		]) {
			expect(visible(id, "ACCOUNTANT")).toBe(true);
			expect(visible(id, "PROJECT_MANAGER")).toBe(false);
			expect(visible(id, "ENGINEER")).toBe(false);
		}
	});

	it("accounting reports are visible to PM (finance.reports)", () => {
		expect(visible("finance-accounting-reports", "PROJECT_MANAGER")).toBe(
			true,
		);
		expect(visible("finance-accounting-reports", "SUPERVISOR")).toBe(false);
	});
});

describe("pricing children", () => {
	it("studies require pricing.studies", () => {
		expect(visible("pricing-studies", "ENGINEER")).toBe(true);
		expect(visible("pricing-studies", "ACCOUNTANT")).toBe(false);
		expect(visible("pricing-studies", "SUPERVISOR")).toBe(false);
	});

	it("quotations require pricing.quotations", () => {
		expect(visible("pricing-quotations", "ACCOUNTANT")).toBe(true);
		expect(visible("pricing-quotations", "ENGINEER")).toBe(false);
	});

	it("study pipeline stages follow pricing.studies (navigation is not editing)", () => {
		for (const id of [
			"study-overview",
			"study-quantities",
			"study-costing",
			"study-pricing",
		]) {
			expect(visible(id, "ENGINEER")).toBe(true);
			expect(visible(id, "SUPERVISOR")).toBe(false);
		}
	});
});

describe("company children", () => {
	it("employees item follows employees.view (separate from company section)", () => {
		expect(visible("company-employees", "ACCOUNTANT")).toBe(true);
		expect(visible("company-employees", "ENGINEER")).toBe(false);
	});

	it("expenses/assets/reports follow the company section", () => {
		expect(visible("company-expenses", "PROJECT_MANAGER")).toBe(false);
		expect(visible("company-assets", "PROJECT_MANAGER")).toBe(true);
		expect(visible("company-reports", "ACCOUNTANT")).toBe(true);
	});
});

describe("critical acceptance cases", () => {
	it("case 1: PM sees the finance group with the accounting structure hidden, reports visible", () => {
		expect(visible("finance", "PROJECT_MANAGER")).toBe(true);
		expect(visible("finance-accounting-reports", "PROJECT_MANAGER")).toBe(
			true,
		);
		for (const hidden of [
			"finance-invoices",
			"finance-payments",
			"finance-chart-of-accounts",
			"finance-journal-entries",
			"finance-opening-balances",
			"finance-accounting-periods",
		]) {
			expect(visible(hidden, "PROJECT_MANAGER")).toBe(false);
		}
	});

	it("case 2: employees.view alone (without any company permission) still shows the company group", () => {
		// الشرط المركّب: canAny(company) || can(employees, view)
		const employeesOnly = checkersFor({
			...DEFAULT_ROLE_PERMISSIONS.CUSTOM,
			employees: {
				...DEFAULT_ROLE_PERMISSIONS.CUSTOM.employees,
				view: true,
			},
		});
		expect(isSidebarItemVisible("company", employeesOnly, false)).toBe(
			true,
		);
		expect(
			isSidebarItemVisible("company-dashboard", employeesOnly, false),
		).toBe(false);
		expect(
			isSidebarItemVisible("company-employees", employeesOnly, false),
		).toBe(true);
	});

	it("case 3: engineer and supervisor see neither finance nor company at all", () => {
		for (const role of ["ENGINEER", "SUPERVISOR"]) {
			expect(visible("finance", role)).toBe(false);
			expect(visible("company", role)).toBe(false);
			expect(visible("finance-dashboard", role)).toBe(false);
			expect(visible("company-dashboard", role)).toBe(false);
		}
	});
});

describe("bypass and ungoverned items", () => {
	it("OWNER bypasses every predicate", () => {
		const denyAll = checkersFor(DEFAULT_ROLE_PERMISSIONS.CUSTOM);
		for (const id of [
			"finance",
			"finance-invoices",
			"company-employees",
			"pricing-studies",
		]) {
			expect(isSidebarItemVisible(id, denyAll, true)).toBe(true);
		}
	});

	it("items without a predicate stay visible (home, project children, partners)", () => {
		const denyAll = checkersFor(DEFAULT_ROLE_PERMISSIONS.CUSTOM);
		for (const id of [
			"start",
			"project-overview",
			"project-team",
			"finance-partners",
			"orgSettings",
			"admin",
		]) {
			expect(isSidebarItemVisible(id, denyAll, false)).toBe(true);
		}
	});
});

describe("route rules (page guards)", () => {
	const path = (rest: string) => `/app/my-org/finance${rest}`;

	it("resolves the section root to finance.view", () => {
		const rule = findRouteRule(
			path(""),
			"finance",
			FINANCE_ROUTE_PERMISSIONS,
		);
		expect(rule).toMatchObject({ section: "finance", action: "view" });
	});

	it("resolves invoices sub-routes to finance.invoices", () => {
		const rule = findRouteRule(
			path("/invoices/new"),
			"finance",
			FINANCE_ROUTE_PERMISSIONS,
		);
		expect(rule).toMatchObject({ section: "finance", action: "invoices" });
	});

	it("marks partners as public (governed by partnerAccessLevel)", () => {
		const rule = findRouteRule(
			path("/partners"),
			"finance",
			FINANCE_ROUTE_PERMISSIONS,
		);
		expect(rule?.public).toBe(true);
	});

	it("unknown sub-routes fall back to the view-gated root rule", () => {
		const rule = findRouteRule(
			path("/brand-new-page"),
			"finance",
			FINANCE_ROUTE_PERMISSIONS,
		);
		expect(rule).toMatchObject({ section: "finance", action: "view" });
	});
});
