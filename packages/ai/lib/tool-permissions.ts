import {
	type Permissions,
	hasPermission,
} from "@repo/database";

/**
 * خريطة صلاحيات أدوات AI
 *
 * كل أداة مرتبطة بصلاحية [section, action].
 * null = متاحة لكل مستخدم مسجّل (لا تكشف بيانات حساسة).
 */
export const TOOL_PERMISSION_MAP: Record<
	string,
	[keyof Permissions, string] | null
> = {
	// === Legacy Tools (6) ===
	queryProjects: ["projects", "view"],
	queryFinance: ["finance", "view"],
	queryExecution: ["projects", "view"],
	queryTimeline: ["projects", "view"],
	navigateTo: null,
	queryCompany: ["company", "view"],

	// === Registry: projects ===
	getProjectDetails: ["projects", "view"],
	getProjectFinanceSummary: ["projects", "viewFinance"],
	queryClaims: ["projects", "viewFinance"],
	queryChangeOrders: ["projects", "view"],

	// === Registry: execution ===
	getProjectActivities: ["projects", "view"],
	getProjectMilestones: ["projects", "view"],
	getDelayAnalysis: ["projects", "view"],

	// === Registry: quantities ===
	queryCostStudies: ["quantities", "view"],
	getCostStudyDetails: ["quantities", "view"],
	searchMaterials: ["quantities", "view"],

	// === Registry: finance (quotations) ===
	queryQuotations: ["finance", "quotations"],
	getQuotationDetails: ["finance", "quotations"],
	getQuotationsSummary: ["finance", "quotations"],

	// === Registry: finance (vouchers) ===
	queryVouchers: ["finance", "payments"],

	// === Registry: leads ===
	queryLeads: ["pricing", "leads"],
	getLeadsSummary: ["pricing", "leads"],
	getLeadsPipeline: ["pricing", "leads"],

	// === Registry: accounting ===
	queryAccounting: ["finance", "view"],
	getAccountLedger: ["finance", "view"],
	getAccountingReports: ["finance", "reports"],

	// === Registry: subcontracts ===
	querySubcontracts: ["projects", "viewFinance"],
	getSubcontractDetails: ["projects", "viewFinance"],

	// === Registry: dashboard ===
	getDashboardSummary: ["projects", "view"],
	getFinanceDashboard: ["finance", "view"],

	// === Registry: documents ===
	queryDocuments: ["projects", "view"],

	// === Registry: field ===
	queryFieldExecution: ["projects", "view"],

	// === Registry: finance (new) ===
	queryInvoices: ["finance", "view"],
	queryZatcaStatus: ["finance", "view"],

	// === Registry: company (new) ===
	queryEmployees: ["company", "view"],
	queryPayroll: ["company", "view"],
	queryAssets: ["company", "view"],

	// === Registry: projects (new) ===
	queryProjectBOQ: ["projects", "view"],
	queryHandover: ["projects", "view"],
	queryProjectChat: ["projects", "view"],

	// === Meta tool ===
	getMyPermissions: null,
};

/**
 * يتحقق هل المستخدم يملك صلاحية تنفيذ أداة معينة.
 */
export function isToolAllowed(
	toolName: string,
	permissions: Permissions,
): boolean {
	const requirement = TOOL_PERMISSION_MAP[toolName];
	// null = always allowed, undefined = unknown tool (allow by default)
	if (requirement === null || requirement === undefined) {
		return true;
	}
	const [section, action] = requirement;
	return hasPermission(permissions, section, action);
}

/**
 * يُفلتر الأدوات حسب صلاحيات المستخدم.
 */
export function filterToolsByPermission(
	tools: Record<string, any>,
	permissions: Permissions,
): Record<string, any> {
	const filtered: Record<string, any> = {};
	for (const [name, toolDef] of Object.entries(tools)) {
		if (isToolAllowed(name, permissions)) {
			filtered[name] = toolDef;
		}
	}
	return filtered;
}

/**
 * ملخص عربي للصلاحيات — يُضاف في system prompt.
 */
export function getPermissionSummaryForPrompt(
	permissions: Permissions,
): string {
	const sections: string[] = [];

	if (hasPermission(permissions, "projects", "view"))
		sections.push("المشاريع والتنفيذ");
	if (hasPermission(permissions, "projects", "viewFinance"))
		sections.push("مالية المشاريع والمقاولين");
	if (hasPermission(permissions, "finance", "view"))
		sections.push("المالية والمحاسبة");
	if (hasPermission(permissions, "finance", "quotations"))
		sections.push("عروض الأسعار");
	if (hasPermission(permissions, "finance", "reports"))
		sections.push("التقارير المحاسبية");
	if (hasPermission(permissions, "quantities", "view"))
		sections.push("الكميات والتسعير");
	if (hasPermission(permissions, "pricing", "leads"))
		sections.push("العملاء المحتملين");
	if (hasPermission(permissions, "company", "view"))
		sections.push("إدارة المنشأة");
	if (hasPermission(permissions, "employees", "view"))
		sections.push("الموظفين");

	if (sections.length === 0)
		return "ليس لديك صلاحيات للوصول لأي بيانات عبر المساعد الذكي.";
	return `يمكنك الاستعلام عن: ${sections.join("، ")}`;
}
