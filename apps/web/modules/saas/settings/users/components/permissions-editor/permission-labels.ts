import type { Permissions } from "@repo/database/prisma/permissions";

/**
 * ترتيب أقسام الصلاحيات وقائمة إجراءات كل قسم — تُستخدم في محرر صلاحيات
 * الأعضاء. الأسماء المعروضة تأتي من مفاتيح الترجمة تحت `settings.permissions`
 * (sections.* و actions.*). أسماء الأدوار تأتي من ROLE_NAMES_AR في
 * @repo/database.
 */

export const SECTION_ORDER: (keyof Permissions)[] = [
	"projects",
	"quantities",
	"pricing",
	"finance",
	"employees",
	"company",
	"settings",
	"reports",
];

export const SECTION_ACTIONS: Record<keyof Permissions, string[]> = {
	projects: ["view", "create", "edit", "delete", "viewFinance", "manageTeam"],
	quantities: ["view", "create", "edit", "delete", "pricing"],
	pricing: [
		"view",
		"studies",
		"quotations",
		"pricing",
		"leads",
		"editQuantities",
		"approveQuantities",
		"editSpecs",
		"approveSpecs",
		"editCosting",
		"approveCosting",
		"editSellingPrice",
		"generateQuotation",
		"convertToProject",
	],
	finance: ["view", "quotations", "invoices", "payments", "reports", "settings"],
	employees: ["view", "create", "edit", "delete", "payroll", "attendance"],
	company: ["view", "expenses", "assets", "reports"],
	settings: ["organization", "users", "roles", "billing", "integrations"],
	reports: ["view", "create", "approve"],
};
