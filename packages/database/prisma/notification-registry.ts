/**
 * سجل أحداث الإشعارات — المصدر الوحيد للحقيقة
 * =============================================
 * كل حدث في المنصة يمكن أن يُنتج إشعاراً يُعرَّف هنا مرة واحدة:
 *   - key: مفتاح الحدث المخزّن في Notification.type ("finance.invoiceIssued")
 *   - module: مجموعة العرض في لوحة التفضيلات وفلتر الصفحة
 *   - audience: كيف يُحَل جمهور المستقبلين (صلاحية منظمة / دور مشروع / مدراء / صريح)
 *   - permission: بوابة RBAC عند الإرسال (null = إشعار شخصي بلا بوابة)
 *   - defaultChannels: القنوات الافتراضية قبل تفضيلات المستخدم
 *   - content: قالب العنوان/النص بالعربية (يُخزَّن في الصف كما هو)
 *   - legacyTypes: قيم NotificationType القديمة المخزّنة قبل السجل
 *
 * إضافة حدث جديد = إدخال هنا + استدعاء notifyEvent() في الإجراء + مفاتيح
 * ترجمة التسمية في ar.json/en.json (notifications.events.<module>.<name>).
 * لا حاجة لأي تعديل schema.
 *
 * يُستورَد من الـ API (الإرسال) ومن الواجهة (لوحة التفضيلات/الفلاتر) —
 * نفس نمط permissions.ts المجاور.
 */
import type { Permissions } from "./permissions";

export type NotificationEventChannel = "IN_APP" | "EMAIL";

export type NotificationModuleKey =
	| "finance"
	| "projects"
	| "hr"
	| "documents"
	| "pricing"
	| "chat"
	| "org"
	| "system";

export type NotificationProjectRole =
	| "MANAGER"
	| "ENGINEER"
	| "SUPERVISOR"
	| "ACCOUNTANT"
	| "VIEWER";

/**
 * كيف يُحل جمهور الحدث:
 * - org-permission: كل أعضاء المنظمة النشطين الحاملين للصلاحية
 * - project-role: أعضاء فريق المشروع بالأدوار المحددة (يتطلب projectId)
 * - org-admins: أصحاب الأدوار الإدارية (OWNER + PROJECT_MANAGER)
 * - explicit: قائمة مستقبلين يمررها موقع الاستدعاء (recipients)
 */
export type NotificationAudience =
	| { kind: "org-permission"; section: keyof Permissions; action: string }
	| { kind: "project-role"; roles: NotificationProjectRole[] }
	| { kind: "org-admins" }
	| { kind: "explicit" };

export type NotificationEventData = Record<
	string,
	string | number | undefined
>;

export interface NotificationEventDef {
	key: string;
	module: NotificationModuleKey;
	audience: NotificationAudience[];
	permission: { section: keyof Permissions; action: string } | null;
	defaultChannels: NotificationEventChannel[];
	/** نوع الكيان للروابط العميقة في الواجهة */
	entityType: string;
	/** per-entity: إشعار واحد لكل كيان/مستخدم — per-entity-minute: يسمح بالتكرار كل دقيقة */
	dedupe?: "per-entity" | "per-entity-minute";
	/** قيم NotificationType القديمة التي يغطيها هذا الحدث (لفلاتر القراءة) */
	legacyTypes?: string[];
	/** قالب المحتوى العربي المخزّن في الصف (نمط ROLE_NAMES_AR) */
	content: (d: NotificationEventData) => { title: string; body?: string };
}

/** تحويل آمن لقيمة data إلى نص للعرض */
const s = (v: string | number | undefined): string =>
	v === undefined || v === null ? "" : String(v);

/** لاحقة "- اسم المشروع" عند توفره */
const inProject = (d: NotificationEventData): string =>
	d.projectName ? ` - ${s(d.projectName)}` : "";

// ═══════════════════════════════════════════════════════════════════════════
// المجموعات (ترتيب العرض في لوحة التفضيلات)
// ═══════════════════════════════════════════════════════════════════════════

export const NOTIFICATION_MODULES: {
	key: NotificationModuleKey;
	order: number;
}[] = [
	{ key: "finance", order: 1 },
	{ key: "projects", order: 2 },
	{ key: "documents", order: 3 },
	{ key: "hr", order: 4 },
	{ key: "pricing", order: 5 },
	{ key: "chat", order: 6 },
	{ key: "org", order: 7 },
	{ key: "system", order: 8 },
];

// ═══════════════════════════════════════════════════════════════════════════
// الأحداث
// ═══════════════════════════════════════════════════════════════════════════

export const NOTIFICATION_REGISTRY: NotificationEventDef[] = [
	// ─── المالية ────────────────────────────────────────────────────────────
	{
		key: "finance.invoiceIssued",
		module: "finance",
		audience: [{ kind: "org-permission", section: "finance", action: "invoices" }],
		permission: { section: "finance", action: "invoices" },
		defaultChannels: ["IN_APP"],
		entityType: "invoice",
		dedupe: "per-entity",
		content: (d) => ({
			title: "فاتورة جديدة صادرة",
			body: `فاتورة رقم ${s(d.invoiceNo)}${d.clientName ? ` للعميل ${s(d.clientName)}` : ""} بقيمة ${s(d.amount)}`,
		}),
	},
	{
		key: "finance.invoicePaymentReceived",
		module: "finance",
		audience: [{ kind: "org-permission", section: "finance", action: "payments" }],
		permission: { section: "finance", action: "payments" },
		defaultChannels: ["IN_APP"],
		entityType: "invoice",
		content: (d) => ({
			title: "دفعة فاتورة مستلمة",
			body: `تم تحصيل ${s(d.amount)} على الفاتورة رقم ${s(d.invoiceNo)}`,
		}),
	},
	{
		key: "finance.creditNoteIssued",
		module: "finance",
		audience: [{ kind: "org-permission", section: "finance", action: "invoices" }],
		permission: { section: "finance", action: "invoices" },
		defaultChannels: ["IN_APP"],
		entityType: "invoice",
		dedupe: "per-entity",
		content: (d) => ({
			title: "إشعار دائن",
			body: `إشعار دائن بقيمة ${s(d.amount)} على الفاتورة رقم ${s(d.invoiceNo)}`,
		}),
	},
	{
		key: "finance.expenseCreated",
		module: "finance",
		audience: [{ kind: "org-permission", section: "finance", action: "view" }],
		permission: { section: "finance", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "expense",
		dedupe: "per-entity",
		content: (d) => ({
			title: "مصروف جديد",
			body: `تم تسجيل مصروف بقيمة ${s(d.amount)}${d.category ? ` (${s(d.category)})` : ""}`,
		}),
	},
	{
		key: "finance.paymentReceived",
		module: "finance",
		audience: [{ kind: "org-permission", section: "finance", action: "payments" }],
		permission: { section: "finance", action: "payments" },
		defaultChannels: ["IN_APP"],
		entityType: "payment",
		dedupe: "per-entity",
		content: (d) => ({
			title: "مقبوض جديد",
			body: `تم تسجيل مقبوض بقيمة ${s(d.amount)}${d.source ? ` من ${s(d.source)}` : ""}`,
		}),
	},
	{
		key: "finance.receiptVoucherIssued",
		module: "finance",
		audience: [{ kind: "org-permission", section: "finance", action: "payments" }],
		permission: { section: "finance", action: "payments" },
		defaultChannels: ["IN_APP"],
		entityType: "receiptVoucher",
		dedupe: "per-entity",
		content: (d) => ({
			title: "سند قبض جديد",
			body: `سند قبض رقم ${s(d.voucherNo)} بقيمة ${s(d.amount)}`,
		}),
	},
	{
		key: "finance.paymentVoucherSubmitted",
		module: "finance",
		audience: [{ kind: "org-admins" }],
		permission: null,
		defaultChannels: ["IN_APP", "EMAIL"],
		entityType: "paymentVoucher",
		dedupe: "per-entity",
		content: (d) => ({
			title: "سند صرف بانتظار الاعتماد",
			body: `سند صرف رقم ${s(d.voucherNo)} بقيمة ${s(d.amount)} بحاجة لاعتمادك`,
		}),
	},
	{
		key: "finance.paymentVoucherApproved",
		module: "finance",
		audience: [{ kind: "explicit" }],
		permission: null,
		defaultChannels: ["IN_APP"],
		entityType: "paymentVoucher",
		content: (d) => ({
			title: "تم اعتماد سند الصرف",
			body: `تم اعتماد سند الصرف رقم ${s(d.voucherNo)} بقيمة ${s(d.amount)}`,
		}),
	},
	{
		key: "finance.paymentVoucherRejected",
		module: "finance",
		audience: [{ kind: "explicit" }],
		permission: null,
		defaultChannels: ["IN_APP"],
		entityType: "paymentVoucher",
		content: (d) => ({
			title: "تم رفض سند الصرف",
			body: `تم رفض سند الصرف رقم ${s(d.voucherNo)}${d.reason ? `: ${s(d.reason)}` : ""}`,
		}),
	},
	{
		key: "finance.transferCompleted",
		module: "finance",
		audience: [{ kind: "org-permission", section: "finance", action: "payments" }],
		permission: { section: "finance", action: "payments" },
		defaultChannels: ["IN_APP"],
		entityType: "transfer",
		dedupe: "per-entity",
		content: (d) => ({
			title: "تحويل بين الحسابات",
			body: `تحويل بقيمة ${s(d.amount)} من ${s(d.fromAccount)} إلى ${s(d.toAccount)}`,
		}),
	},
	{
		key: "finance.quotationCreated",
		module: "finance",
		audience: [{ kind: "org-permission", section: "finance", action: "quotations" }],
		permission: { section: "finance", action: "quotations" },
		defaultChannels: ["IN_APP"],
		entityType: "quotation",
		dedupe: "per-entity",
		content: (d) => ({
			title: "عرض سعر جديد",
			body: `عرض سعر رقم ${s(d.quotationNo)}${d.clientName ? ` للعميل ${s(d.clientName)}` : ""} بقيمة ${s(d.amount)}`,
		}),
	},
	{
		key: "finance.quotationStatusChanged",
		module: "finance",
		audience: [{ kind: "org-permission", section: "finance", action: "quotations" }],
		permission: { section: "finance", action: "quotations" },
		defaultChannels: ["IN_APP"],
		entityType: "quotation",
		content: (d) => ({
			title: "تحديث حالة عرض سعر",
			body: `عرض السعر رقم ${s(d.quotationNo)} أصبح: ${s(d.status)}`,
		}),
	},
	{
		key: "finance.clientCreated",
		module: "finance",
		audience: [{ kind: "org-permission", section: "finance", action: "view" }],
		permission: { section: "finance", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "client",
		dedupe: "per-entity",
		content: (d) => ({
			title: "عميل جديد",
			body: `تمت إضافة العميل ${s(d.clientName)}`,
		}),
	},
	{
		key: "finance.zatcaCleared",
		module: "finance",
		audience: [{ kind: "org-permission", section: "finance", action: "invoices" }],
		permission: { section: "finance", action: "invoices" },
		defaultChannels: ["IN_APP"],
		entityType: "invoice",
		content: (d) => ({
			title: "فاتورة معتمدة من هيئة الزكاة",
			body: `تم قبول الفاتورة رقم ${s(d.invoiceNo)} في منصة فاتورة (ZATCA)`,
		}),
	},
	{
		key: "finance.zatcaRejected",
		module: "finance",
		audience: [{ kind: "org-permission", section: "finance", action: "invoices" }],
		permission: { section: "finance", action: "invoices" },
		defaultChannels: ["IN_APP", "EMAIL"],
		entityType: "invoice",
		content: (d) => ({
			title: "فاتورة مرفوضة من هيئة الزكاة",
			body: `رُفضت الفاتورة رقم ${s(d.invoiceNo)} في منصة فاتورة (ZATCA) — تحتاج معالجة`,
		}),
	},
	{
		key: "finance.ownerDrawingCreated",
		module: "finance",
		audience: [{ kind: "org-admins" }],
		permission: null,
		defaultChannels: ["IN_APP"],
		entityType: "ownerDrawing",
		dedupe: "per-entity",
		content: (d) => ({
			title: "طلب سحب أرباح",
			body: `طلب سحب أرباح بقيمة ${s(d.amount)}${d.ownerName ? ` للشريك ${s(d.ownerName)}` : ""}`,
		}),
	},
	{
		key: "finance.ownerDrawingDecided",
		module: "finance",
		audience: [{ kind: "explicit" }],
		permission: null,
		defaultChannels: ["IN_APP"],
		entityType: "ownerDrawing",
		content: (d) => ({
			title: "قرار سحب الأرباح",
			body: `${s(d.decision)} طلب سحب الأرباح بقيمة ${s(d.amount)}`,
		}),
	},
	{
		key: "finance.capitalContributionAdded",
		module: "finance",
		audience: [{ kind: "org-admins" }],
		permission: null,
		defaultChannels: ["IN_APP"],
		entityType: "capitalContribution",
		dedupe: "per-entity",
		content: (d) => ({
			title: "مساهمة رأس مال جديدة",
			body: `مساهمة بقيمة ${s(d.amount)}${d.ownerName ? ` من الشريك ${s(d.ownerName)}` : ""}`,
		}),
	},

	// ─── الموارد البشرية ────────────────────────────────────────────────────
	{
		key: "hr.payrollApproved",
		module: "hr",
		audience: [{ kind: "org-permission", section: "employees", action: "payroll" }],
		permission: { section: "employees", action: "payroll" },
		defaultChannels: ["IN_APP"],
		entityType: "payrollRun",
		dedupe: "per-entity",
		content: (d) => ({
			title: "تم اعتماد مسير الرواتب",
			body: `مسير رواتب ${s(d.period)} بإجمالي ${s(d.amount)}`,
		}),
	},
	{
		key: "hr.leaveRequestSubmitted",
		module: "hr",
		audience: [{ kind: "org-admins" }],
		permission: null,
		defaultChannels: ["IN_APP"],
		entityType: "leaveRequest",
		dedupe: "per-entity",
		content: (d) => ({
			title: "طلب إجازة جديد",
			body: `${s(d.employeeName)} طلب إجازة${d.leaveType ? ` (${s(d.leaveType)})` : ""} من ${s(d.startDate)} إلى ${s(d.endDate)}`,
		}),
	},
	{
		key: "hr.leaveRequestDecided",
		module: "hr",
		audience: [{ kind: "explicit" }],
		permission: null,
		defaultChannels: ["IN_APP"],
		entityType: "leaveRequest",
		content: (d) => ({
			title: "قرار طلب الإجازة",
			body: `${s(d.decision)} طلب إجازتك من ${s(d.startDate)} إلى ${s(d.endDate)}`,
		}),
	},
	{
		key: "hr.companyExpenseCreated",
		module: "hr",
		audience: [{ kind: "org-permission", section: "company", action: "expenses" }],
		permission: { section: "company", action: "expenses" },
		defaultChannels: ["IN_APP"],
		entityType: "companyExpense",
		dedupe: "per-entity",
		content: (d) => ({
			title: "مصروف شركة جديد",
			body: `مصروف بقيمة ${s(d.amount)}${d.category ? ` (${s(d.category)})` : ""}`,
		}),
	},
	{
		key: "hr.employeeAdded",
		module: "hr",
		audience: [{ kind: "org-permission", section: "employees", action: "view" }],
		permission: { section: "employees", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "employee",
		dedupe: "per-entity",
		content: (d) => ({
			title: "موظف جديد",
			body: `تمت إضافة الموظف ${s(d.employeeName)}${d.jobTitle ? ` (${s(d.jobTitle)})` : ""}`,
		}),
	},

	// ─── المشاريع ───────────────────────────────────────────────────────────
	{
		key: "projects.projectCreated",
		module: "projects",
		audience: [{ kind: "org-permission", section: "projects", action: "view" }],
		permission: { section: "projects", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "project",
		dedupe: "per-entity",
		content: (d) => ({
			title: "مشروع جديد",
			body: `تم إنشاء مشروع "${s(d.projectName)}"`,
		}),
	},
	{
		key: "projects.expenseCreated",
		module: "projects",
		audience: [
			{ kind: "project-role", roles: ["MANAGER", "ACCOUNTANT"] },
			{ kind: "org-admins" },
		],
		permission: { section: "finance", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "expense",
		dedupe: "per-entity",
		legacyTypes: ["EXPENSE_CREATED"],
		content: (d) => ({
			title: `مصروف جديد${inProject(d)}`,
			body: `تم تسجيل مصروف بقيمة ${s(d.amount)}${d.category ? ` (${s(d.category)})` : ""}`,
		}),
	},
	{
		key: "projects.claimCreated",
		module: "projects",
		audience: [
			{ kind: "project-role", roles: ["MANAGER", "ACCOUNTANT"] },
			{ kind: "org-admins" },
		],
		permission: { section: "finance", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "claim",
		dedupe: "per-entity",
		legacyTypes: ["CLAIM_CREATED"],
		content: (d) => ({
			title: `مستخلص جديد${inProject(d)}`,
			body: `مستخلص رقم ${s(d.claimNo)} بقيمة ${s(d.amount)}`,
		}),
	},
	{
		key: "projects.claimStatusChanged",
		module: "projects",
		audience: [{ kind: "explicit" }],
		permission: null,
		defaultChannels: ["IN_APP"],
		entityType: "claim",
		legacyTypes: ["CLAIM_STATUS_CHANGED"],
		content: (d) => ({
			title: `تحديث مستخلص${inProject(d)}`,
			body: `المستخلص رقم ${s(d.claimNo)} أصبح: ${s(d.status)}`,
		}),
	},
	{
		key: "projects.paymentReceived",
		module: "projects",
		audience: [
			{ kind: "project-role", roles: ["MANAGER", "ACCOUNTANT"] },
			{ kind: "org-admins" },
		],
		permission: { section: "finance", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "projectPayment",
		dedupe: "per-entity",
		content: (d) => ({
			title: `دفعة مشروع مستلمة${inProject(d)}`,
			body: `تم استلام دفعة بقيمة ${s(d.amount)}`,
		}),
	},
	{
		key: "projects.subcontractCreated",
		module: "projects",
		audience: [
			{ kind: "project-role", roles: ["MANAGER"] },
			{ kind: "org-admins" },
		],
		permission: { section: "finance", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "subcontract",
		dedupe: "per-entity",
		content: (d) => ({
			title: `عقد باطن جديد${inProject(d)}`,
			body: `عقد مع ${s(d.subcontractorName)} بقيمة ${s(d.amount)}`,
		}),
	},
	{
		key: "projects.subcontractPaymentCreated",
		module: "projects",
		audience: [
			{ kind: "project-role", roles: ["MANAGER", "ACCOUNTANT"] },
			{ kind: "org-admins" },
		],
		permission: { section: "finance", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "subcontractPayment",
		dedupe: "per-entity",
		content: (d) => ({
			title: `دفعة مقاول باطن${inProject(d)}`,
			body: `دفعة بقيمة ${s(d.amount)} للمقاول ${s(d.subcontractorName)}`,
		}),
	},
	{
		key: "projects.subcontractClaimCreated",
		module: "projects",
		audience: [
			{ kind: "project-role", roles: ["MANAGER", "ACCOUNTANT"] },
			{ kind: "org-admins" },
		],
		permission: { section: "finance", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "subcontractClaim",
		dedupe: "per-entity",
		content: (d) => ({
			title: `مستخلص مقاول باطن${inProject(d)}`,
			body: `مستخلص من ${s(d.subcontractorName)} بقيمة ${s(d.amount)}`,
		}),
	},
	{
		key: "projects.subcontractClaimStatusChanged",
		module: "projects",
		audience: [{ kind: "explicit" }],
		permission: null,
		defaultChannels: ["IN_APP"],
		entityType: "subcontractClaim",
		content: (d) => ({
			title: `تحديث مستخلص باطن${inProject(d)}`,
			body: `مستخلص ${s(d.subcontractorName)} أصبح: ${s(d.status)}`,
		}),
	},
	{
		key: "projects.subcontractChangeOrderCreated",
		module: "projects",
		audience: [
			{ kind: "project-role", roles: ["MANAGER"] },
			{ kind: "org-admins" },
		],
		permission: { section: "finance", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "subcontractChangeOrder",
		dedupe: "per-entity",
		content: (d) => ({
			title: `أمر تغيير عقد باطن${inProject(d)}`,
			body: `أمر تغيير على عقد ${s(d.subcontractorName)} بقيمة ${s(d.amount)}`,
		}),
	},
	{
		key: "projects.changeOrderCreated",
		module: "projects",
		audience: [
			{ kind: "project-role", roles: ["MANAGER"] },
			{ kind: "org-admins" },
		],
		permission: { section: "projects", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "changeOrder",
		dedupe: "per-entity",
		legacyTypes: ["CHANGE_ORDER_CREATED"],
		content: (d) => ({
			title: `أمر تغيير جديد${inProject(d)}`,
			body: `أمر تغيير رقم ${s(d.coNo)}: ${s(d.title)}`,
		}),
	},
	{
		key: "projects.changeOrderSubmitted",
		module: "projects",
		audience: [{ kind: "org-admins" }],
		permission: null,
		defaultChannels: ["IN_APP", "EMAIL"],
		entityType: "changeOrder",
		dedupe: "per-entity",
		content: (d) => ({
			title: `أمر تغيير بانتظار الاعتماد${inProject(d)}`,
			body: `أمر التغيير رقم ${s(d.coNo)} بحاجة لقرارك`,
		}),
	},
	{
		key: "projects.changeOrderDecided",
		module: "projects",
		audience: [{ kind: "explicit" }],
		permission: null,
		defaultChannels: ["IN_APP"],
		entityType: "changeOrder",
		legacyTypes: ["CHANGE_ORDER_APPROVED", "CHANGE_ORDER_REJECTED"],
		content: (d) => ({
			title: `قرار أمر تغيير${inProject(d)}`,
			body: `${s(d.decision)} أمر التغيير رقم ${s(d.coNo)}`,
		}),
	},
	{
		key: "projects.changeOrderImplemented",
		module: "projects",
		audience: [
			{ kind: "project-role", roles: ["MANAGER"] },
			{ kind: "org-admins" },
		],
		permission: { section: "projects", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "changeOrder",
		content: (d) => ({
			title: `تم تنفيذ أمر تغيير${inProject(d)}`,
			body: `أمر التغيير رقم ${s(d.coNo)} دخل حيز التنفيذ`,
		}),
	},
	{
		key: "projects.dailyReportCreated",
		module: "projects",
		audience: [
			{ kind: "project-role", roles: ["MANAGER"] },
			{ kind: "org-admins" },
		],
		permission: { section: "projects", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "dailyReport",
		dedupe: "per-entity",
		legacyTypes: ["DAILY_REPORT_CREATED"],
		content: (d) => ({
			title: `تقرير يومي جديد${inProject(d)}`,
			body: `تم إضافة تقرير يومي بتاريخ ${s(d.reportDate)}`,
		}),
	},
	{
		key: "projects.issueCreated",
		module: "projects",
		audience: [
			{ kind: "project-role", roles: ["MANAGER"] },
			{ kind: "org-admins" },
		],
		permission: { section: "projects", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "issue",
		dedupe: "per-entity",
		legacyTypes: ["ISSUE_CREATED"],
		content: (d) => ({
			title: `مشكلة جديدة${inProject(d)}`,
			body: s(d.issueTitle),
		}),
	},
	{
		key: "projects.issueCritical",
		module: "projects",
		audience: [
			{ kind: "project-role", roles: ["MANAGER"] },
			{ kind: "org-admins" },
		],
		permission: { section: "projects", action: "view" },
		defaultChannels: ["IN_APP", "EMAIL"],
		entityType: "issue",
		dedupe: "per-entity",
		legacyTypes: ["ISSUE_CRITICAL"],
		content: (d) => ({
			title: `⚠️ مشكلة حرجة${inProject(d)}`,
			body: s(d.issueTitle),
		}),
	},
	{
		key: "projects.progressUpdated",
		module: "projects",
		audience: [
			{ kind: "project-role", roles: ["MANAGER"] },
			{ kind: "org-admins" },
		],
		permission: { section: "projects", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "progressUpdate",
		dedupe: "per-entity-minute",
		content: (d) => ({
			title: `تحديث تقدم${inProject(d)}`,
			body: d.progress !== undefined ? `نسبة الإنجاز: ${s(d.progress)}%` : undefined,
		}),
	},
	{
		key: "projects.photoUploaded",
		module: "projects",
		audience: [
			{ kind: "project-role", roles: ["MANAGER"] },
			{ kind: "org-admins" },
		],
		permission: { section: "projects", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "photo",
		dedupe: "per-entity-minute",
		content: (d) => ({
			title: `صور جديدة${inProject(d)}`,
			body: d.count ? `تم رفع ${s(d.count)} صورة من الموقع` : "تم رفع صور جديدة من الموقع",
		}),
	},
	{
		key: "projects.handoverSubmitted",
		module: "projects",
		audience: [
			{ kind: "project-role", roles: ["MANAGER"] },
			{ kind: "org-admins" },
		],
		permission: { section: "projects", action: "view" },
		defaultChannels: ["IN_APP", "EMAIL"],
		entityType: "handover",
		dedupe: "per-entity",
		content: (d) => ({
			title: `محضر استلام بانتظار التوقيع${inProject(d)}`,
			body: `محضر ${s(d.protocolTitle)} جاهز للتوقيعات`,
		}),
	},
	{
		key: "projects.handoverSigned",
		module: "projects",
		audience: [
			{ kind: "project-role", roles: ["MANAGER"] },
			{ kind: "org-admins" },
		],
		permission: { section: "projects", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "handover",
		dedupe: "per-entity-minute",
		content: (d) => ({
			title: `توقيع على محضر استلام${inProject(d)}`,
			body: `${s(d.signerName)} وقّع على محضر ${s(d.protocolTitle)}`,
		}),
	},
	{
		key: "projects.handoverCompleted",
		module: "projects",
		audience: [
			{ kind: "project-role", roles: ["MANAGER"] },
			{ kind: "org-admins" },
		],
		permission: { section: "projects", action: "view" },
		defaultChannels: ["IN_APP", "EMAIL"],
		entityType: "handover",
		dedupe: "per-entity",
		content: (d) => ({
			title: `اكتمل محضر الاستلام${inProject(d)}`,
			body: `محضر ${s(d.protocolTitle)} مكتمل التوقيعات`,
		}),
	},
	{
		key: "projects.teamMemberAdded",
		module: "projects",
		audience: [{ kind: "explicit" }],
		permission: null,
		defaultChannels: ["IN_APP"],
		entityType: "project",
		legacyTypes: ["TEAM_MEMBER_ADDED"],
		content: (d) => ({
			title: "تمت إضافتك لفريق المشروع",
			body: `تمت إضافتك لمشروع "${s(d.projectName)}"${d.role ? ` بصفة ${s(d.role)}` : ""}`,
		}),
	},
	{
		key: "projects.teamMemberRemoved",
		module: "projects",
		audience: [{ kind: "explicit" }],
		permission: null,
		defaultChannels: ["IN_APP"],
		entityType: "project",
		legacyTypes: ["TEAM_MEMBER_REMOVED"],
		content: (d) => ({
			title: "تمت إزالتك من فريق المشروع",
			body: `تمت إزالتك من مشروع "${s(d.projectName)}"`,
		}),
	},

	// ─── المستندات ──────────────────────────────────────────────────────────
	{
		key: "documents.documentUploaded",
		module: "documents",
		audience: [
			{ kind: "project-role", roles: ["MANAGER", "ENGINEER"] },
			{ kind: "org-admins" },
		],
		permission: { section: "projects", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "document",
		dedupe: "per-entity-minute",
		legacyTypes: ["DOCUMENT_CREATED"],
		content: (d) => ({
			title: `مستند جديد${inProject(d)}`,
			body: `تم رفع المستند "${s(d.documentTitle)}"`,
		}),
	},
	{
		key: "documents.versionUploaded",
		module: "documents",
		audience: [
			{ kind: "project-role", roles: ["MANAGER", "ENGINEER"] },
			{ kind: "org-admins" },
		],
		permission: { section: "projects", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "document",
		dedupe: "per-entity-minute",
		content: (d) => ({
			title: `إصدار جديد لمستند${inProject(d)}`,
			body: `إصدار جديد للمستند "${s(d.documentTitle)}"`,
		}),
	},
	{
		key: "documents.approvalRequested",
		module: "documents",
		audience: [{ kind: "explicit" }],
		permission: null,
		defaultChannels: ["IN_APP", "EMAIL"],
		entityType: "document",
		dedupe: "per-entity",
		legacyTypes: ["APPROVAL_REQUESTED"],
		content: (d) => ({
			title: `طلب اعتماد${inProject(d)}`,
			body: `طلب اعتماد للمستند: ${s(d.documentTitle)}`,
		}),
	},
	{
		key: "documents.approvalDecided",
		module: "documents",
		audience: [{ kind: "explicit" }],
		permission: null,
		defaultChannels: ["IN_APP"],
		entityType: "document",
		legacyTypes: ["APPROVAL_DECIDED"],
		content: (d) => ({
			title: `قرار اعتماد${inProject(d)}`,
			body: `${s(d.decision)} على المستند: ${s(d.documentTitle)}`,
		}),
	},
	{
		key: "documents.fileUploaded",
		module: "documents",
		audience: [
			{ kind: "project-role", roles: ["MANAGER"] },
			{ kind: "org-admins" },
		],
		permission: { section: "projects", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "attachment",
		dedupe: "per-entity-minute",
		content: (d) => ({
			title: `ملف جديد${inProject(d)}`,
			body: `تم رفع الملف "${s(d.fileName)}"`,
		}),
	},

	// ─── المحادثات ──────────────────────────────────────────────────────────
	{
		key: "chat.messageReceived",
		module: "chat",
		audience: [{ kind: "explicit" }],
		permission: null,
		defaultChannels: ["IN_APP"],
		entityType: "message",
		dedupe: "per-entity-minute",
		content: (d) => ({
			title: `رسالة جديدة${inProject(d)}`,
			body: d.preview ? s(d.preview) : `رسالة من ${s(d.senderName)}`,
		}),
	},
	{
		key: "chat.ownerMessageReceived",
		module: "chat",
		audience: [
			{ kind: "project-role", roles: ["MANAGER"] },
			{ kind: "org-admins" },
		],
		permission: { section: "projects", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "message",
		dedupe: "per-entity-minute",
		legacyTypes: ["OWNER_MESSAGE"],
		content: (d) => ({
			title: `رسالة من المالك${inProject(d)}`,
			body: d.preview ? s(d.preview) : "رسالة جديدة من مالك المشروع",
		}),
	},

	// ─── التسعير ────────────────────────────────────────────────────────────
	{
		key: "pricing.studyCreated",
		module: "pricing",
		audience: [{ kind: "org-permission", section: "pricing", action: "view" }],
		permission: { section: "pricing", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "study",
		dedupe: "per-entity",
		content: (d) => ({
			title: "دراسة تسعير جديدة",
			body: `تم إنشاء دراسة "${s(d.studyName)}"`,
		}),
	},
	{
		key: "pricing.quantitiesApproved",
		module: "pricing",
		audience: [{ kind: "org-permission", section: "pricing", action: "view" }],
		permission: { section: "pricing", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "study",
		content: (d) => ({
			title: "اعتماد مرحلة الكميات",
			body: `تم اعتماد كميات دراسة "${s(d.studyName)}"`,
		}),
	},
	{
		key: "pricing.specsApproved",
		module: "pricing",
		audience: [{ kind: "org-permission", section: "pricing", action: "view" }],
		permission: { section: "pricing", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "study",
		content: (d) => ({
			title: "اعتماد مرحلة المواصفات",
			body: `تم اعتماد مواصفات دراسة "${s(d.studyName)}"`,
		}),
	},
	{
		key: "pricing.costingApproved",
		module: "pricing",
		audience: [{ kind: "org-permission", section: "pricing", action: "view" }],
		permission: { section: "pricing", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "study",
		content: (d) => ({
			title: "اعتماد تسعير التكلفة",
			body: `تم اعتماد تسعير تكلفة دراسة "${s(d.studyName)}"`,
		}),
	},
	{
		key: "pricing.pricingApproved",
		module: "pricing",
		audience: [{ kind: "org-permission", section: "pricing", action: "view" }],
		permission: { section: "pricing", action: "view" },
		defaultChannels: ["IN_APP"],
		entityType: "study",
		content: (d) => ({
			title: "اعتماد التسعير النهائي",
			body: `تم اعتماد تسعير دراسة "${s(d.studyName)}" — جاهزة للتحويل لعرض سعر`,
		}),
	},

	// ─── المنظمة ────────────────────────────────────────────────────────────
	{
		key: "org.userAdded",
		module: "org",
		audience: [{ kind: "org-admins" }],
		permission: null,
		defaultChannels: ["IN_APP"],
		entityType: "user",
		dedupe: "per-entity",
		content: (d) => ({
			title: "مستخدم جديد في المنشأة",
			body: `تمت إضافة ${s(d.userName)}${d.roleName ? ` بدور ${s(d.roleName)}` : ""}`,
		}),
	},
	{
		key: "org.userRoleChanged",
		module: "org",
		audience: [{ kind: "explicit" }],
		permission: null,
		defaultChannels: ["IN_APP"],
		entityType: "user",
		content: (d) => ({
			title: "تم تغيير دورك",
			body: `أصبح دورك في المنشأة: ${s(d.roleName)}`,
		}),
	},
	{
		key: "org.userDeactivated",
		module: "org",
		audience: [{ kind: "org-admins" }],
		permission: null,
		defaultChannels: ["IN_APP"],
		entityType: "user",
		content: (d) => ({
			title: "تم تعطيل حساب مستخدم",
			body: `تم تعطيل حساب ${s(d.userName)}`,
		}),
	},

	// ─── النظام ─────────────────────────────────────────────────────────────
	{
		key: "system.announcement",
		module: "system",
		audience: [{ kind: "explicit" }],
		permission: null,
		defaultChannels: ["IN_APP"],
		entityType: "system",
		legacyTypes: ["SYSTEM"],
		content: (d) => ({
			title: s(d.title) || "إشعار من النظام",
			body: d.body !== undefined ? s(d.body) : undefined,
		}),
	},
];

// ═══════════════════════════════════════════════════════════════════════════
// خرائط مشتقة
// ═══════════════════════════════════════════════════════════════════════════

/** بحث سريع بالمفتاح */
export const NOTIFICATION_EVENT_BY_KEY: Record<string, NotificationEventDef> =
	Object.fromEntries(NOTIFICATION_REGISTRY.map((e) => [e.key, e]));

/** كل مفاتيح الأحداث لوحدة معينة (تشمل الأنواع القديمة — لفلاتر القراءة) */
export function getEventTypesForModule(
	module: NotificationModuleKey,
): string[] {
	return NOTIFICATION_REGISTRY.filter((e) => e.module === module).flatMap(
		(e) => [e.key, ...(e.legacyTypes ?? [])],
	);
}

/** مفتاح wildcard لوحدة ("finance.*") — يُستخدم في eventPrefs */
export function moduleWildcard(module: NotificationModuleKey): string {
	return `${module}.*`;
}

/** هل المفتاح صالح في eventPrefs؟ (مفتاح حدث أو wildcard وحدة) */
export function isValidPrefKey(key: string): boolean {
	if (NOTIFICATION_EVENT_BY_KEY[key]) {
		return true;
	}
	return NOTIFICATION_MODULES.some((m) => key === moduleWildcard(m.key));
}

/**
 * حل قنوات مستخدم لحدث: تفضيل صريح ← wildcard الوحدة ← افتراضي السجل.
 * prefs = محتوى NotificationPreference.eventPrefs (قد يكون فارغاً).
 */
export function resolveEventChannels(
	def: NotificationEventDef,
	prefs: Record<string, NotificationEventChannel[]> | null | undefined,
): NotificationEventChannel[] {
	if (prefs) {
		const exact = prefs[def.key];
		if (Array.isArray(exact)) {
			return exact;
		}
		const wildcard = prefs[moduleWildcard(def.module)];
		if (Array.isArray(wildcard)) {
			return wildcard;
		}
	}
	return def.defaultChannels;
}

/** اسم الجزء الأخير من مفتاح الحدث ("invoiceIssued") — لاشتقاق مفاتيح i18n */
export function eventLeafName(key: string): string {
	const idx = key.indexOf(".");
	return idx === -1 ? key : key.slice(idx + 1);
}
