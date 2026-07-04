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
