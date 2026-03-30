import { describe, it, expect } from "vitest";
import {
	isToolAllowed,
	filterToolsByPermission,
	getPermissionSummaryForPrompt,
	TOOL_PERMISSION_MAP,
} from "@repo/ai/lib/tool-permissions";
import {
	type Permissions,
	createEmptyPermissions,
	DEFAULT_ROLE_PERMISSIONS,
} from "@repo/database/prisma/permissions";

/**
 * AI Tool Permission Tests
 *
 * Tests the permission-based tool filtering for the AI assistant.
 * Uses the real permission system — no mocks needed.
 */

// Helper to create permissions with specific grants
function permissionsWith(
	overrides: Partial<Record<keyof Permissions, Partial<Permissions[keyof Permissions]>>>,
): Permissions {
	const base = createEmptyPermissions();
	for (const section of Object.keys(overrides) as (keyof Permissions)[]) {
		if (overrides[section]) {
			(base as any)[section] = { ...(base as any)[section], ...overrides[section] };
		}
	}
	return base;
}

// Dummy tool definitions for filterToolsByPermission tests
const ALL_TOOLS: Record<string, { description: string }> = {
	navigateTo: { description: "Navigate" },
	getMyPermissions: { description: "Get permissions" },
	queryProjects: { description: "Query projects" },
	queryFinance: { description: "Query finance" },
	queryVouchers: { description: "Query vouchers" },
	queryLeads: { description: "Query leads" },
	getProjectDetails: { description: "Get project details" },
	getProjectFinanceSummary: { description: "Get project finance" },
	queryAccounting: { description: "Query accounting" },
	getAccountingReports: { description: "Accounting reports" },
	queryCompany: { description: "Query company" },
	queryCostStudies: { description: "Cost studies" },
};

describe("AI Tool Permissions", () => {
	describe("Permission Filtering", () => {
		it("should allow tools with null permission (always allowed)", () => {
			const emptyPerms = createEmptyPermissions();
			expect(isToolAllowed("navigateTo", emptyPerms)).toBe(true);
			expect(isToolAllowed("getMyPermissions", emptyPerms)).toBe(true);
		});

		it("should allow tools not in permission map (default allow for unknown tools)", () => {
			const emptyPerms = createEmptyPermissions();
			expect(isToolAllowed("unknownFutureTool", emptyPerms)).toBe(true);
		});

		it("should block tools when user lacks required permission", () => {
			const emptyPerms = createEmptyPermissions();
			expect(isToolAllowed("queryProjects", emptyPerms)).toBe(false);
			expect(isToolAllowed("queryFinance", emptyPerms)).toBe(false);
			expect(isToolAllowed("queryLeads", emptyPerms)).toBe(false);
		});

		it("should allow tools when user has required permission", () => {
			const perms = permissionsWith({
				projects: { view: true },
				finance: { view: true },
			});
			expect(isToolAllowed("queryProjects", perms)).toBe(true);
			expect(isToolAllowed("queryFinance", perms)).toBe(true);
		});

		it("should filter tool set based on user permissions", () => {
			const viewerPerms = permissionsWith({
				projects: { view: true },
			});
			const filtered = filterToolsByPermission(ALL_TOOLS, viewerPerms);

			// Always-allowed tools should be present
			expect(filtered["navigateTo"]).toBeDefined();
			expect(filtered["getMyPermissions"]).toBeDefined();

			// Project tools should be present
			expect(filtered["queryProjects"]).toBeDefined();
			expect(filtered["getProjectDetails"]).toBeDefined();

			// Finance tools should be filtered out
			expect(filtered["queryFinance"]).toBeUndefined();
			expect(filtered["queryVouchers"]).toBeUndefined();
		});

		it("should distinguish between view and sub-permissions in finance", () => {
			// User has finance.view but not finance.payments
			const perms = permissionsWith({
				finance: { view: true, payments: false },
			});
			expect(isToolAllowed("queryFinance", perms)).toBe(true);
			expect(isToolAllowed("queryVouchers", perms)).toBe(false);
		});

		it("should check correct section for cross-module tools", () => {
			// querySubcontracts requires projects.viewFinance, not finance.view
			const perms = permissionsWith({
				finance: { view: true },
				projects: { viewFinance: false },
			});
			expect(isToolAllowed("querySubcontracts", perms)).toBe(false);

			const perms2 = permissionsWith({
				projects: { viewFinance: true },
			});
			expect(isToolAllowed("querySubcontracts", perms2)).toBe(true);
		});
	});

	describe("Role-Based Access", () => {
		it("OWNER should have access to all mapped tools", () => {
			const ownerPerms = DEFAULT_ROLE_PERMISSIONS["OWNER"];
			for (const [toolName, requirement] of Object.entries(TOOL_PERMISSION_MAP)) {
				expect(isToolAllowed(toolName, ownerPerms)).toBe(true);
			}
		});

		it("empty permissions should only access null-requirement tools", () => {
			const emptyPerms = createEmptyPermissions();
			const allowed: string[] = [];
			const blocked: string[] = [];

			for (const [toolName, requirement] of Object.entries(TOOL_PERMISSION_MAP)) {
				if (isToolAllowed(toolName, emptyPerms)) {
					allowed.push(toolName);
				} else {
					blocked.push(toolName);
				}
			}

			// Only null-requirement tools should be allowed
			for (const toolName of allowed) {
				expect(TOOL_PERMISSION_MAP[toolName]).toBeNull();
			}
			// All non-null requirement tools should be blocked
			expect(blocked.length).toBeGreaterThan(0);
		});

		it("finance-only user should access finance tools but not project tools", () => {
			const accountantPerms = permissionsWith({
				finance: { view: true, invoices: true, payments: true, reports: true, quotations: true },
			});
			// Finance tools — allowed
			expect(isToolAllowed("queryFinance", accountantPerms)).toBe(true);
			expect(isToolAllowed("queryAccounting", accountantPerms)).toBe(true);
			expect(isToolAllowed("getAccountingReports", accountantPerms)).toBe(true);
			expect(isToolAllowed("queryVouchers", accountantPerms)).toBe(true);

			// Project tools — blocked
			expect(isToolAllowed("queryProjects", accountantPerms)).toBe(false);
			expect(isToolAllowed("getProjectActivities", accountantPerms)).toBe(false);
		});

		it("project viewer should access project tools but not finance", () => {
			const viewerPerms = permissionsWith({
				projects: { view: true },
			});
			expect(isToolAllowed("queryProjects", viewerPerms)).toBe(true);
			expect(isToolAllowed("getProjectActivities", viewerPerms)).toBe(true);
			expect(isToolAllowed("queryFinance", viewerPerms)).toBe(false);
		});
	});

	describe("Permission Summary for Prompt", () => {
		it("should return Arabic summary for user with access", () => {
			const perms = permissionsWith({
				projects: { view: true },
				finance: { view: true },
			});
			const summary = getPermissionSummaryForPrompt(perms);
			expect(summary).toContain("يمكنك الاستعلام عن");
			expect(summary).toContain("المشاريع");
			expect(summary).toContain("المالية");
		});

		it("should return no-access message for empty permissions", () => {
			const emptyPerms = createEmptyPermissions();
			const summary = getPermissionSummaryForPrompt(emptyPerms);
			expect(summary).toContain("ليس لديك صلاحيات");
		});

		it("should include all relevant sections for OWNER", () => {
			const ownerPerms = DEFAULT_ROLE_PERMISSIONS["OWNER"];
			const summary = getPermissionSummaryForPrompt(ownerPerms);
			expect(summary).toContain("المشاريع");
			expect(summary).toContain("المالية");
			expect(summary).toContain("الكميات");
		});
	});

	describe("TOOL_PERMISSION_MAP Integrity", () => {
		it("should have navigateTo and getMyPermissions as null (always allowed)", () => {
			expect(TOOL_PERMISSION_MAP["navigateTo"]).toBeNull();
			expect(TOOL_PERMISSION_MAP["getMyPermissions"]).toBeNull();
		});

		it("should have valid section references for all mapped tools", () => {
			const validSections: (keyof Permissions)[] = [
				"projects", "quantities", "pricing", "finance",
				"employees", "company", "settings", "reports",
			];

			for (const [toolName, requirement] of Object.entries(TOOL_PERMISSION_MAP)) {
				if (requirement !== null) {
					const [section] = requirement;
					expect(validSections).toContain(section);
				}
			}
		});

		it("should cover all known tool categories", () => {
			const map = TOOL_PERMISSION_MAP;
			// Legacy tools
			expect(map["queryProjects"]).toBeDefined();
			expect(map["queryFinance"]).toBeDefined();
			expect(map["queryCompany"]).toBeDefined();
			// Registry tools
			expect(map["getProjectDetails"]).toBeDefined();
			expect(map["queryAccounting"]).toBeDefined();
			expect(map["getDashboardSummary"]).toBeDefined();
		});
	});
});
