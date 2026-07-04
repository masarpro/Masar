import type { Permissions } from "@repo/database/prisma/permissions";

/**
 * Central sidebar visibility map — RBAC-UI layer.
 *
 * Maps sidebar item ids (see use-sidebar-menu.ts) to permission predicates.
 * Items WITHOUT an entry here are intentionally ungoverned by org permissions:
 *   - "start" (home) — always visible
 *   - "project-*" children — governed by the separate ProjectRole system
 *   - "finance-partners" — governed by partnerAccessLevel
 *   - "orgSettings" — governed by isOrganizationAdmin
 *   - "admin" — governed by user.role === "admin"
 *
 * OWNER bypasses this map entirely (see isSidebarItemVisible).
 * UI layer only — backend authorization stays with verifyOrganizationAccess.
 */

export interface PermissionCheckers {
	can: (section: keyof Permissions, action: string) => boolean;
	canAny: (section: keyof Permissions) => boolean;
}

export type SidebarPermissionPredicate = (p: PermissionCheckers) => boolean;

export const SIDEBAR_PERMISSION_MAP: Record<
	string,
	SidebarPermissionPredicate
> = {
	// ── المجموعات الرئيسية ──
	projects: ({ canAny }) => canAny("projects"),
	finance: ({ canAny }) => canAny("finance"),
	pricing: ({ canAny }) => canAny("pricing"),
	// حالة حدّية: المحاسب يملك employees.view دون company.view —
	// قسم employees منفصل عن قسم company في نموذج الصلاحيات
	company: ({ canAny, can }) =>
		canAny("company") || can("employees", "view"),

	// ── أبناء المالية ──
	"finance-dashboard": ({ can }) => can("finance", "view"),
	"finance-expenses": ({ can }) => can("finance", "view"),
	"finance-clients": ({ can }) => can("finance", "view"),
	"finance-banks": ({ can }) => can("finance", "view"),
	"finance-documents": ({ can }) => can("finance", "view"),
	"finance-invoices": ({ can }) => can("finance", "invoices"),
	"finance-payments": ({ can }) => can("finance", "payments"),
	"finance-accounting-reports": ({ can }) => can("finance", "reports"),
	// البنية المحاسبية الأساسية محصورة بمن يملك الإعدادات المالية
	// (المالك والمحاسب) — مدير المشروع يرى التقارير المحاسبية فقط
	"finance-chart-of-accounts": ({ can }) => can("finance", "settings"),
	"finance-journal-entries": ({ can }) => can("finance", "settings"),
	"finance-opening-balances": ({ can }) => can("finance", "settings"),
	"finance-accounting-periods": ({ can }) => can("finance", "settings"),

	// ── أبناء التسعير ──
	"pricing-dashboard": ({ can }) => can("pricing", "view"),
	"pricing-studies": ({ can }) => can("pricing", "studies"),
	"pricing-quotations": ({ can }) => can("pricing", "quotations"),
	"pricing-leads": ({ can }) => can("pricing", "leads"),
	// مراحل الدراسة: التنقل ليس تعديلاً — إجراءات edit/approve يحميها الـ backend
	"study-overview": ({ can }) => can("pricing", "studies"),
	"study-quantities": ({ can }) => can("pricing", "studies"),
	"study-specifications": ({ can }) => can("pricing", "studies"),
	"study-costing": ({ can }) => can("pricing", "studies"),
	"study-pricing": ({ can }) => can("pricing", "studies"),
	"study-quotation": ({ can }) => can("pricing", "studies"),

	// ── أبناء المنشأة ──
	"company-dashboard": ({ can }) => can("company", "view"),
	"company-employees": ({ can }) => can("employees", "view"),
	"company-expenses": ({ can }) => can("company", "expenses"),
	"company-assets": ({ can }) => can("company", "assets"),
	"company-reports": ({ can }) => can("company", "reports"),
};

/**
 * Route-level permission rules for org sections (Stage 3 — page guards).
 * `prefix` is the first path segment under the section root
 * (e.g. "invoices" in /app/{slug}/finance/invoices/...).
 * `public: true` marks routes governed by another system (skipped here).
 * The empty prefix "" is the section root page.
 */
export interface RoutePermissionRule {
	prefix: string;
	section?: keyof Permissions;
	action?: string;
	public?: boolean;
}

export const FINANCE_ROUTE_PERMISSIONS: RoutePermissionRule[] = [
	{ prefix: "", section: "finance", action: "view" },
	{ prefix: "expenses", section: "finance", action: "view" },
	{ prefix: "clients", section: "finance", action: "view" },
	{ prefix: "banks", section: "finance", action: "view" },
	{ prefix: "documents", section: "finance", action: "view" },
	{ prefix: "statements", section: "finance", action: "view" },
	{ prefix: "accounting-dashboard", section: "finance", action: "view" },
	{ prefix: "invoices", section: "finance", action: "invoices" },
	{ prefix: "payments", section: "finance", action: "payments" },
	{ prefix: "payment-vouchers", section: "finance", action: "payments" },
	{ prefix: "receipt-vouchers", section: "finance", action: "payments" },
	{ prefix: "capital-contributions", section: "finance", action: "payments" },
	{ prefix: "owner-drawings", section: "finance", action: "payments" },
	{ prefix: "accounting-reports", section: "finance", action: "reports" },
	{ prefix: "reports", section: "finance", action: "reports" },
	{ prefix: "chart-of-accounts", section: "finance", action: "settings" },
	{ prefix: "journal-entries", section: "finance", action: "settings" },
	{ prefix: "opening-balances", section: "finance", action: "settings" },
	{ prefix: "accounting-periods", section: "finance", action: "settings" },
	{ prefix: "year-end-closing", section: "finance", action: "settings" },
	{ prefix: "settings", section: "finance", action: "settings" },
	// محكومة بنظام partnerAccessLevel المنفصل — لا تُقيَّد هنا
	{ prefix: "partners", public: true },
];

export const COMPANY_ROUTE_PERMISSIONS: RoutePermissionRule[] = [
	{ prefix: "", section: "company", action: "view" },
	{ prefix: "templates", section: "company", action: "view" },
	{ prefix: "employees", section: "employees", action: "view" },
	{ prefix: "hr", section: "employees", action: "view" },
	{ prefix: "leaves", section: "employees", action: "view" },
	{ prefix: "payroll", section: "employees", action: "payroll" },
	{ prefix: "expenses", section: "company", action: "expenses" },
	{ prefix: "expense-runs", section: "company", action: "expenses" },
	{ prefix: "assets", section: "company", action: "assets" },
	{ prefix: "reports", section: "company", action: "reports" },
];

export const PRICING_ROUTE_PERMISSIONS: RoutePermissionRule[] = [
	{ prefix: "", section: "pricing", action: "view" },
	{ prefix: "studies", section: "pricing", action: "studies" },
	{ prefix: "quick", section: "pricing", action: "studies" },
	{ prefix: "quotations", section: "pricing", action: "quotations" },
	{ prefix: "leads", section: "pricing", action: "leads" },
];

/**
 * Find the rule matching a pathname under a section root.
 * Unknown sub-routes fall back to the section root rule ("") so a newly
 * added page is view-gated by default rather than left open.
 */
export function findRouteRule(
	pathname: string,
	sectionRoot: string,
	rules: RoutePermissionRule[],
): RoutePermissionRule | undefined {
	const marker = `/${sectionRoot}`;
	const idx = pathname.indexOf(`${marker}/`);
	let segment = "";
	if (idx >= 0) {
		segment =
			pathname.slice(idx + marker.length + 1).split("/")[0]?.trim() ?? "";
	}
	return (
		rules.find((rule) => rule.prefix === segment) ??
		rules.find((rule) => rule.prefix === "")
	);
}

/**
 * Resolve visibility of a sidebar item for the current member.
 * OWNER sees everything; items without a predicate are always visible.
 */
export function isSidebarItemVisible(
	itemId: string,
	checkers: PermissionCheckers,
	isOwner: boolean,
): boolean {
	if (isOwner) {
		return true;
	}
	const predicate = SIDEBAR_PERMISSION_MAP[itemId];
	if (!predicate) {
		return true;
	}
	return predicate(checkers);
}
