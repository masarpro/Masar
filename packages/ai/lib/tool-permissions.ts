import {
	type Permissions,
	createEmptyPermissions,
	hasPermission,
} from "@repo/database/prisma/permissions";

/**
 * RBAC-AI — الخريطة المركزية لصلاحيات أدوات المساعد الذكي
 *
 * مصدر الحقيقة الوحيد للصلاحيات هو getCachedUserPermissions — نفس المصدر
 * الذي يحكم الـ procedures والقائمة الجانبية والإشعارات. هذا الملف يربط كل
 * أداة AI بالصلاحية المطلوبة بنفس منطق القائمة الجانبية (permission-map.ts):
 * ما يُخفى من القائمة يُحجب من المساعد.
 *
 * ثلاث طبقات دفاع (كلها إلزامية):
 *   1. التصفية عند التمرير — filterToolsByPermission: أداة بلا صلاحية لا
 *      تصل للنموذج أصلاً (لا اسمها ولا وصفها).
 *   2. حارس التنفيذ — withPermissionGuard / isToolAuthorized مع input:
 *      دفاع في العمق، يفحص الـ action الفعلي للأدوات متعددة الإجراءات.
 *   3. الـ system prompt — طبقة UX فقط، ليست حماية.
 */

// ─── الأنواع ────────────────────────────────────────────────────────

/** صلاحية بسيطة: قسم + إجراء */
export interface PermissionRule {
	section: keyof Permissions;
	action: string;
}

/**
 * متطلب صلاحية أداة:
 *   - PermissionRule: صلاحية واحدة ثابتة
 *   - دالة: للأدوات متعددة الـ action — تُستدعى بدون input عند مرحلة
 *     التمرير (يكفي امتلاك أي action) ومع input عند التنفيذ
 *   - null: متاحة لكل عضو (لا تكشف بيانات حساسة)
 */
export type PermissionRequirement =
	| PermissionRule
	| ((perms: Permissions, input?: Record<string, unknown>) => boolean)
	| null;

// ─── ثوابت رسائل الرفض (مركزية — لا نصوص مبعثرة) ────────────────────

export const AI_PERMISSION_DENIED_CODE = "PERMISSION_DENIED";

/** رسالة رفض تنفيذ أداة — بنفس نبرة verifyOrganizationAccess */
export const AI_PERMISSION_DENIED_MESSAGE =
	"ليس لديك صلاحية الاطلاع على هذه البيانات. يمكنك مراجعة مالك المنشأة لطلب الصلاحية المناسبة.";

/** رسالة رفض وجهة تنقّل ممنوعة */
export const AI_NAVIGATION_DENIED_MESSAGE = "هذا القسم غير متاح لحسابك.";

/**
 * نتيجة أداة منظّمة عند الرفض (ليست exception) — كي يصيغ النموذج
 * اعتذاراً طبيعياً بدل انهيار الـ stream.
 */
export function permissionDeniedResult() {
	return {
		error: AI_PERMISSION_DENIED_CODE,
		message: AI_PERMISSION_DENIED_MESSAGE,
	};
}

// ─── مساعدات داخلية ─────────────────────────────────────────────────

function can(perms: Permissions, section: keyof Permissions, action: string) {
	return hasPermission(perms, section, action);
}

function canAnyCompany(perms: Permissions): boolean {
	return (
		can(perms, "company", "view") ||
		can(perms, "company", "expenses") ||
		can(perms, "company", "assets") ||
		can(perms, "company", "reports")
	);
}

// ─── متطلبات الأدوات متعددة الـ action (تُحرس على مستوى الـ action) ──

/**
 * queryFinance — أداة قديمة واحدة تغطي صلاحيات مالية متعددة:
 *   invoices → finance.invoices · payments → finance.payments
 *   expenses/banks/summary → finance.view
 * بدون input (مرحلة التمرير): تكفي أي واحدة منها.
 */
const queryFinanceRequirement = (
	perms: Permissions,
	input?: Record<string, unknown>,
): boolean => {
	const action = typeof input?.action === "string" ? input.action : undefined;
	switch (action) {
		case "invoices":
			return can(perms, "finance", "invoices");
		case "payments":
			return can(perms, "finance", "payments");
		case "expenses":
		case "banks":
		case "summary":
			return can(perms, "finance", "view");
		case undefined:
			return (
				can(perms, "finance", "view") ||
				can(perms, "finance", "invoices") ||
				can(perms, "finance", "payments")
			);
		default:
			// action مجهول → رفض (fail-closed)
			return false;
	}
};

/**
 * queryCompany — حسب الـ action:
 *   employees → employees.view · payroll → employees.payroll
 *   assets → company.assets · expenses → company.expenses
 *   summary → أي صلاحية company أو employees.view
 */
const queryCompanyRequirement = (
	perms: Permissions,
	input?: Record<string, unknown>,
): boolean => {
	const action = typeof input?.action === "string" ? input.action : undefined;
	switch (action) {
		case "employees":
			return can(perms, "employees", "view");
		case "payroll":
			return can(perms, "employees", "payroll");
		case "assets":
			return can(perms, "company", "assets");
		case "expenses":
			return can(perms, "company", "expenses");
		case "summary":
			return canAnyCompany(perms) || can(perms, "employees", "view");
		case undefined:
			return (
				canAnyCompany(perms) ||
				can(perms, "employees", "view") ||
				can(perms, "employees", "payroll")
			);
		default:
			return false;
	}
};

/**
 * getDashboardSummary — متاح لمن يملك المشاريع أو المالية؛ التركيب الداخلي
 * يُصفّى في dashboard-tools.ts (الجزء المالي مع finance.view فقط).
 */
const dashboardSummaryRequirement = (perms: Permissions): boolean =>
	can(perms, "projects", "view") || can(perms, "finance", "view");

// ─── الخريطة المعتمدة: أداة → متطلب صلاحية ─────────────────────────

export const TOOL_PERMISSION_MAP: Record<string, PermissionRequirement> = {
	// === الأدوات القديمة (6) ===
	queryProjects: { section: "projects", action: "view" },
	queryFinance: queryFinanceRequirement,
	queryExecution: { section: "projects", action: "view" },
	queryTimeline: { section: "projects", action: "view" },
	// متاحة دائماً — لكن الوجهات تُصفّى داخل الأداة عبر isNavigationAllowed
	navigateTo: null,
	queryCompany: queryCompanyRequirement,

	// === Registry: المشاريع والتنفيذ ===
	getProjectDetails: { section: "projects", action: "view" },
	getProjectActivities: { section: "projects", action: "view" },
	getProjectMilestones: { section: "projects", action: "view" },
	getDelayAnalysis: { section: "projects", action: "view" },
	queryFieldExecution: { section: "projects", action: "view" },
	queryDocuments: { section: "projects", action: "view" },
	queryHandover: { section: "projects", action: "view" },
	queryProjectChat: { section: "projects", action: "view" },

	// === Registry: مالية المشاريع (مبالغ → projects.viewFinance) ===
	getProjectFinanceSummary: { section: "projects", action: "viewFinance" },
	queryClaims: { section: "projects", action: "viewFinance" },
	queryChangeOrders: { section: "projects", action: "viewFinance" },
	querySubcontracts: { section: "projects", action: "viewFinance" },
	getSubcontractDetails: { section: "projects", action: "viewFinance" },
	// جدول كميات المشروع يعرض أسعار الوحدات والإجماليات → بيانات مالية
	queryProjectBOQ: { section: "projects", action: "viewFinance" },

	// === Registry: دراسات التكلفة (db.costStudy = دراسات التسعير) ===
	queryCostStudies: { section: "pricing", action: "studies" },
	getCostStudyDetails: { section: "pricing", action: "studies" },
	searchMaterials: { section: "pricing", action: "studies" },

	// === Registry: عروض الأسعار (تعيش تحت /pricing/quotations) ===
	queryQuotations: { section: "pricing", action: "quotations" },
	getQuotationDetails: { section: "pricing", action: "quotations" },
	getQuotationsSummary: { section: "pricing", action: "quotations" },

	// === Registry: العملاء المحتملون ===
	queryLeads: { section: "pricing", action: "leads" },
	getLeadsSummary: { section: "pricing", action: "leads" },
	getLeadsPipeline: { section: "pricing", action: "leads" },

	// === Registry: المالية ===
	getFinanceDashboard: { section: "finance", action: "view" },
	queryInvoices: { section: "finance", action: "invoices" },
	// حالة زاتكا = بيانات فواتير بمبالغها
	queryZatcaStatus: { section: "finance", action: "invoices" },
	// السندات مستندات دفع — نفس بوابة القائمة الجانبية (finance.payments)
	queryVouchers: { section: "finance", action: "payments" },

	// === Registry: المحاسبة ===
	// البنية المحاسبية (قيود/دفتر أستاذ) للمالك والمحاسب فقط — متسق مع
	// القائمة الجانبية (chart-of-accounts/journal-entries → finance.settings)
	queryAccounting: { section: "finance", action: "settings" },
	getAccountLedger: { section: "finance", action: "settings" },
	// التقارير المحاسبية قراءة يحتاجها مدير المشاريع → finance.reports
	getAccountingReports: { section: "finance", action: "reports" },

	// === Registry: المنشأة/HR ===
	queryEmployees: { section: "employees", action: "view" },
	queryPayroll: { section: "employees", action: "payroll" },
	queryAssets: { section: "company", action: "assets" },

	// === Registry: لوحة التحكم ===
	getDashboardSummary: dashboardSummaryRequirement,

	// === أداة تعريفية ===
	getMyPermissions: null,
};

// ─── التقييم والفحص ─────────────────────────────────────────────────

/** تقييم متطلب صلاحية مباشرة (يُستخدم أيضاً لحقل requiredPermission في registerTool) */
export function evaluatePermissionRequirement(
	requirement: PermissionRequirement,
	permissions: Permissions,
	input?: Record<string, unknown>,
): boolean {
	if (requirement === null) {
		return true;
	}
	if (typeof requirement === "function") {
		return requirement(permissions, input);
	}
	return hasPermission(permissions, requirement.section, requirement.action);
}

/**
 * هل يملك المستخدم صلاحية أداة معينة؟
 * بدون input: فحص مرحلة التمرير (الأدوات متعددة الـ action تمرّ إن ملك أي action).
 * مع input: فحص التنفيذ الفعلي (per-action).
 * أداة غير معروفة → رفض (fail-closed): أي أداة جديدة يجب إضافتها للخريطة.
 */
export function isToolAuthorized(
	permissions: Permissions,
	toolName: string,
	input?: Record<string, unknown>,
): boolean {
	const requirement = TOOL_PERMISSION_MAP[toolName];
	if (requirement === undefined) {
		console.warn(
			`[ai-tool-permissions] أداة غير معروفة "${toolName}" — رُفضت افتراضياً. أضفها إلى TOOL_PERMISSION_MAP.`,
		);
		return false;
	}
	return evaluatePermissionRequirement(requirement, permissions, input);
}

/** أسماء الأدوات المصرّح بها للمستخدم (الطبقة 1) */
export function getAuthorizedToolNames(permissions: Permissions): string[] {
	return Object.keys(TOOL_PERMISSION_MAP).filter((name) =>
		isToolAuthorized(permissions, name),
	);
}

/**
 * الطبقة 1 — تصفية الأدوات الممرَّرة لـ streamText:
 * أداة بلا صلاحية لا يراها النموذج أصلاً.
 */
export function filterToolsByPermission(
	tools: Record<string, any>,
	permissions: Permissions,
): Record<string, any> {
	const filtered: Record<string, any> = {};
	for (const [name, toolDef] of Object.entries(tools)) {
		if (isToolAuthorized(permissions, name)) {
			filtered[name] = toolDef;
		}
	}
	return filtered;
}

/**
 * الطبقة 2 — حارس تنفيذ مركزي واحد يلفّ execute لكل أداة.
 * عند الرفض يُرجع نتيجة منظمة (ليس exception).
 * الصلاحيات تُلتقط عند الإنشاء لأن AI SDK لا يمرر سياقنا لـ execute.
 */
export function withPermissionGuard<TParams, TResult>(
	toolName: string,
	permissions: Permissions | undefined,
	execute: (params: TParams) => Promise<TResult>,
	requirement?: PermissionRequirement,
): (params: TParams) => Promise<TResult | ReturnType<typeof permissionDeniedResult>> {
	return async (params: TParams) => {
		const perms = permissions ?? createEmptyPermissions();
		const authorized =
			requirement !== undefined
				? evaluatePermissionRequirement(
						requirement,
						perms,
						params as Record<string, unknown>,
					)
				: isToolAuthorized(perms, toolName, params as Record<string, unknown>);
		if (!authorized) {
			return permissionDeniedResult();
		}
		return execute(params);
	};
}

// ─── تصفية وجهات navigateTo ─────────────────────────────────────────
// مرآة لقواعد القائمة الجانبية (permission-map.ts في طبقة الواجهة) —
// لا يمكن استيرادها هنا (apps/web ↛ packages/ai) فنكررها بنفس المنطق.

type NavRules = Record<string, PermissionRule | null>;

const FINANCE_NAV_RULES: NavRules = {
	"": { section: "finance", action: "view" },
	expenses: { section: "finance", action: "view" },
	clients: { section: "finance", action: "view" },
	banks: { section: "finance", action: "view" },
	documents: { section: "finance", action: "view" },
	statements: { section: "finance", action: "view" },
	"accounting-dashboard": { section: "finance", action: "view" },
	invoices: { section: "finance", action: "invoices" },
	payments: { section: "finance", action: "payments" },
	"payment-vouchers": { section: "finance", action: "payments" },
	"receipt-vouchers": { section: "finance", action: "payments" },
	"capital-contributions": { section: "finance", action: "payments" },
	"owner-drawings": { section: "finance", action: "payments" },
	"accounting-reports": { section: "finance", action: "reports" },
	reports: { section: "finance", action: "reports" },
	"chart-of-accounts": { section: "finance", action: "settings" },
	"journal-entries": { section: "finance", action: "settings" },
	"opening-balances": { section: "finance", action: "settings" },
	"accounting-periods": { section: "finance", action: "settings" },
	"year-end-closing": { section: "finance", action: "settings" },
	settings: { section: "finance", action: "settings" },
	// محكومة بنظام partnerAccessLevel المنفصل — لا تُقيَّد هنا
	partners: null,
};

const PRICING_NAV_RULES: NavRules = {
	"": { section: "pricing", action: "view" },
	studies: { section: "pricing", action: "studies" },
	quick: { section: "pricing", action: "studies" },
	quotations: { section: "pricing", action: "quotations" },
	leads: { section: "pricing", action: "leads" },
};

const COMPANY_NAV_RULES: NavRules = {
	"": { section: "company", action: "view" },
	templates: { section: "company", action: "view" },
	employees: { section: "employees", action: "view" },
	hr: { section: "employees", action: "view" },
	leaves: { section: "employees", action: "view" },
	payroll: { section: "employees", action: "payroll" },
	expenses: { section: "company", action: "expenses" },
	"expense-runs": { section: "company", action: "expenses" },
	assets: { section: "company", action: "assets" },
	reports: { section: "company", action: "reports" },
};

const SETTINGS_NAV_RULES: NavRules = {
	"": { section: "settings", action: "organization" },
	general: { section: "settings", action: "organization" },
	members: { section: "settings", action: "users" },
	roles: { section: "settings", action: "roles" },
	billing: { section: "settings", action: "billing" },
	integrations: { section: "settings", action: "integrations" },
	// قوالب الفواتير تتبع قسم المنشأة في نموذج الصلاحيات
	templates: { section: "company", action: "view" },
};

function checkNavRules(
	perms: Permissions,
	rules: NavRules,
	segment: string,
): boolean {
	// مسار فرعي غير معروف → قاعدة جذر القسم (نفس fallback القائمة الجانبية)
	const rule = rules[segment] !== undefined ? rules[segment] : rules[""];
	if (rule === null || rule === undefined) {
		return true;
	}
	return hasPermission(perms, rule.section, rule.action);
}

/**
 * هل يُسمح بتوليد رابط لهذه الوجهة؟ (تصفية وجهات navigateTo)
 * روابط خارج /app/{slug}/ أو أقسام غير معروفة → مسموحة (الصفحة نفسها
 * محمية بـ Layout Guards — التصفية هنا لمنع الإيحاء بوجود أقسام ممنوعة).
 */
export function isNavigationAllowed(
	permissions: Permissions,
	url: string,
): boolean {
	const match = url.match(/^\/app\/[^/]+(?:\/(.*))?$/);
	if (!match) {
		return true;
	}
	const segments = (match[1] ?? "").split("/").filter(Boolean);
	if (segments.length === 0) {
		// لوحة التحكم الرئيسية
		return true;
	}
	const [root, sub = ""] = segments;
	switch (root) {
		case "finance":
			return checkNavRules(permissions, FINANCE_NAV_RULES, sub);
		case "pricing":
			return checkNavRules(permissions, PRICING_NAV_RULES, sub);
		case "company":
			return checkNavRules(permissions, COMPANY_NAV_RULES, sub);
		case "settings":
			return checkNavRules(permissions, SETTINGS_NAV_RULES, sub);
		case "projects": {
			if (!hasPermission(permissions, "projects", "view")) {
				return false;
			}
			// /projects/{id}/finance/... (عقود باطن، مصروفات مشروع) → viewFinance
			if (segments.length >= 3 && segments[2] === "finance") {
				return hasPermission(permissions, "projects", "viewFinance");
			}
			return true;
		}
		case "notifications":
			return true;
		default:
			return true;
	}
}

// ─── حجب الوحدات المعرفية الحساسة من الـ system prompt ──────────────

/**
 * هل تُحقن معرفة/تعليمات هذه الوحدة في الـ prompt؟
 * الوحدات الحساسة (finance, accounting, company) تُربط بصلاحياتها —
 * لا نشرح وحدة المحاسبة لمن لا يملكها (تقليل مساحة التسريب والتشتيت).
 */
export function isModulePromptAllowed(
	permissions: Permissions,
	moduleId: string,
): boolean {
	switch (moduleId) {
		case "finance":
			return (
				can(permissions, "finance", "view") ||
				can(permissions, "finance", "invoices") ||
				can(permissions, "finance", "payments") ||
				can(permissions, "finance", "quotations") ||
				can(permissions, "finance", "reports") ||
				can(permissions, "finance", "settings")
			);
		case "accounting":
			return (
				can(permissions, "finance", "view") ||
				can(permissions, "finance", "reports") ||
				can(permissions, "finance", "settings")
			);
		case "company":
			return canAnyCompany(permissions) || can(permissions, "employees", "view");
		default:
			return true;
	}
}

// ─── ملخص الصلاحيات للـ system prompt (الطبقة 3 — UX فقط) ───────────

/** ملخص عربي للأقسام المتاحة — يُضاف في system prompt */
export function getPermissionSummaryForPrompt(
	permissions: Permissions,
): string {
	const sections: string[] = [];

	if (can(permissions, "projects", "view")) {
		sections.push("المشاريع والتنفيذ والجداول الزمنية");
	}
	if (can(permissions, "projects", "viewFinance")) {
		sections.push("مالية المشاريع وعقود الباطن");
	}
	if (can(permissions, "finance", "view")) {
		sections.push("المالية (ملخصات، مصروفات، بنوك)");
	}
	if (can(permissions, "finance", "invoices")) {
		sections.push("الفواتير");
	}
	if (can(permissions, "finance", "payments")) {
		sections.push("المقبوضات والسندات");
	}
	if (can(permissions, "finance", "reports")) {
		sections.push("التقارير المحاسبية");
	}
	if (can(permissions, "finance", "settings")) {
		sections.push("القيود والبنية المحاسبية");
	}
	if (can(permissions, "pricing", "studies")) {
		sections.push("دراسات التكلفة والكميات");
	}
	if (can(permissions, "pricing", "quotations")) {
		sections.push("عروض الأسعار");
	}
	if (can(permissions, "pricing", "leads")) {
		sections.push("العملاء المحتملون");
	}
	if (canAnyCompany(permissions)) {
		sections.push("إدارة المنشأة");
	}
	if (can(permissions, "employees", "view")) {
		sections.push("الموظفون");
	}
	if (can(permissions, "employees", "payroll")) {
		sections.push("الرواتب");
	}

	if (sections.length === 0) {
		return "ليس لديك صلاحيات للوصول لأي بيانات عبر المساعد الذكي.";
	}
	return `يمكنك الاستعلام عن: ${sections.join("، ")}`;
}
