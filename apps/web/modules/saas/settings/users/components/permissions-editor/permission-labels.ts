import type { Permissions } from "@repo/database/prisma/permissions";

/**
 * الأسماء العربية لأقسام الصلاحيات وإجراءاتها — تُستخدم في محرر صلاحيات
 * الأعضاء. أسماء الأدوار تأتي من ROLE_NAMES_AR في @repo/database.
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

export const SECTION_LABELS_AR: Record<keyof Permissions, string> = {
	projects: "المشاريع",
	quantities: "الكميات",
	pricing: "التسعير",
	finance: "المالية",
	employees: "الموظفون",
	company: "المنشأة",
	settings: "الإعدادات",
	reports: "التقارير",
};

export const ACTION_LABELS_AR: Record<
	keyof Permissions,
	Record<string, string>
> = {
	projects: {
		view: "عرض المشاريع",
		create: "إنشاء مشروع",
		edit: "تعديل المشاريع",
		delete: "حذف المشاريع",
		viewFinance: "عرض مالية المشروع",
		manageTeam: "إدارة فريق المشروع",
	},
	quantities: {
		view: "عرض دراسات الكميات",
		create: "إنشاء دراسة",
		edit: "تعديل الدراسات",
		delete: "حذف الدراسات",
		pricing: "تسعير الكميات",
	},
	pricing: {
		view: "عرض قسم التسعير",
		studies: "إدارة الدراسات",
		quotations: "عروض الأسعار",
		pricing: "إدارة التسعير",
		leads: "العملاء المحتملون",
		editQuantities: "تعديل الكميات",
		approveQuantities: "اعتماد الكميات",
		editSpecs: "تعديل المواصفات",
		approveSpecs: "اعتماد المواصفات",
		editCosting: "تعديل التكاليف",
		approveCosting: "اعتماد التكاليف",
		editSellingPrice: "تعديل سعر البيع",
		generateQuotation: "إنشاء عرض السعر",
		convertToProject: "تحويل الدراسة لمشروع",
	},
	finance: {
		view: "عرض البيانات المالية",
		quotations: "عروض الأسعار",
		invoices: "الفواتير",
		payments: "المدفوعات والمقبوضات",
		reports: "التقارير المالية",
		settings: "الإعدادات المحاسبية",
	},
	employees: {
		view: "عرض الموظفين",
		create: "إضافة موظفين",
		edit: "تعديل بيانات الموظفين",
		delete: "حذف الموظفين",
		payroll: "إدارة الرواتب",
		attendance: "إدارة الحضور",
	},
	company: {
		view: "عرض بيانات المنشأة",
		expenses: "مصروفات المنشأة",
		assets: "أصول المنشأة",
		reports: "تقارير المنشأة",
	},
	settings: {
		organization: "إعدادات المنشأة",
		users: "إدارة المستخدمين",
		roles: "إدارة الأدوار",
		billing: "الفوترة والاشتراك",
		integrations: "التكاملات",
	},
	reports: {
		view: "عرض التقارير",
		create: "إنشاء التقارير",
		approve: "اعتماد التقارير",
	},
};
