// ═══════════════════════════════════════════════════════════
// أنواع الصلاحيات لمنصة مسار
// ═══════════════════════════════════════════════════════════

export interface ProjectPermissions {
	view: boolean;
	create: boolean;
	edit: boolean;
	delete: boolean;
	viewFinance: boolean;
	manageTeam: boolean;
}

export interface QuantitiesPermissions {
	view: boolean;
	create: boolean;
	edit: boolean;
	delete: boolean;
	pricing: boolean;
}

export interface PricingPermissions {
	view: boolean;
	studies: boolean;
	quotations: boolean;
	pricing: boolean;
}

export interface FinancePermissions {
	view: boolean;
	quotations: boolean;
	invoices: boolean;
	payments: boolean;
	reports: boolean;
	settings: boolean;
}

export interface EmployeesPermissions {
	view: boolean;
	create: boolean;
	edit: boolean;
	delete: boolean;
	payroll: boolean;
	attendance: boolean;
}

export interface CompanyPermissions {
	view: boolean;
	expenses: boolean;
	assets: boolean;
	reports: boolean;
}

export interface SettingsPermissions {
	organization: boolean;
	users: boolean;
	roles: boolean;
	billing: boolean;
	integrations: boolean;
}

export interface ReportsPermissions {
	view: boolean;
	create: boolean;
	approve: boolean;
}

export interface Permissions {
	projects: ProjectPermissions;
	quantities: QuantitiesPermissions;
	pricing: PricingPermissions;
	finance: FinancePermissions;
	employees: EmployeesPermissions;
	company: CompanyPermissions;
	settings: SettingsPermissions;
	reports: ReportsPermissions;
}

// دالة التحقق من صلاحية
export function hasPermission(
	permissions: Permissions | null | undefined,
	section: keyof Permissions,
	action: string,
): boolean {
	if (!permissions) return false;
	const sectionPerms = permissions[section];
	if (!sectionPerms) return false;
	return (sectionPerms as unknown as Record<string, boolean>)[action] ?? false;
}

// دالة إنشاء صلاحيات فارغة
export function createEmptyPermissions(): Permissions {
	return {
		projects: {
			view: false,
			create: false,
			edit: false,
			delete: false,
			viewFinance: false,
			manageTeam: false,
		},
		quantities: {
			view: false,
			create: false,
			edit: false,
			delete: false,
			pricing: false,
		},
		pricing: {
			view: false,
			studies: false,
			quotations: false,
			pricing: false,
		},
		finance: {
			view: false,
			quotations: false,
			invoices: false,
			payments: false,
			reports: false,
			settings: false,
		},
		employees: {
			view: false,
			create: false,
			edit: false,
			delete: false,
			payroll: false,
			attendance: false,
		},
		company: {
			view: false,
			expenses: false,
			assets: false,
			reports: false,
		},
		settings: {
			organization: false,
			users: false,
			roles: false,
			billing: false,
			integrations: false,
		},
		reports: { view: false, create: false, approve: false },
	};
}

// ═══════════════════════════════════════════════════════════
// الصلاحيات الافتراضية لكل دور
// ═══════════════════════════════════════════════════════════

export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permissions> = {
	// المالك - كل الصلاحيات
	OWNER: {
		projects: {
			view: true,
			create: true,
			edit: true,
			delete: true,
			viewFinance: true,
			manageTeam: true,
		},
		quantities: {
			view: true,
			create: true,
			edit: true,
			delete: true,
			pricing: true,
		},
		pricing: {
			view: true,
			studies: true,
			quotations: true,
			pricing: true,
		},
		finance: {
			view: true,
			quotations: true,
			invoices: true,
			payments: true,
			reports: true,
			settings: true,
		},
		employees: {
			view: true,
			create: true,
			edit: true,
			delete: true,
			payroll: true,
			attendance: true,
		},
		company: {
			view: true,
			expenses: true,
			assets: true,
			reports: true,
		},
		settings: {
			organization: true,
			users: true,
			roles: true,
			billing: true,
			integrations: true,
		},
		reports: { view: true, create: true, approve: true },
	},

	// مدير المشاريع
	PROJECT_MANAGER: {
		projects: {
			view: true,
			create: true,
			edit: true,
			delete: false,
			viewFinance: true,
			manageTeam: true,
		},
		quantities: {
			view: true,
			create: true,
			edit: true,
			delete: false,
			pricing: true,
		},
		pricing: {
			view: true,
			studies: true,
			quotations: true,
			pricing: true,
		},
		finance: {
			view: true,
			quotations: true,
			invoices: false,
			payments: false,
			reports: true,
			settings: false,
		},
		employees: {
			view: true,
			create: false,
			edit: false,
			delete: false,
			payroll: false,
			attendance: true,
		},
		company: {
			view: true,
			expenses: false,
			assets: true,
			reports: true,
		},
		settings: {
			organization: false,
			users: false,
			roles: false,
			billing: false,
			integrations: false,
		},
		reports: { view: true, create: true, approve: true },
	},

	// المحاسب
	ACCOUNTANT: {
		projects: {
			view: true,
			create: false,
			edit: false,
			delete: false,
			viewFinance: true,
			manageTeam: false,
		},
		quantities: {
			view: true,
			create: false,
			edit: false,
			delete: false,
			pricing: true,
		},
		pricing: {
			view: true,
			studies: false,
			quotations: true,
			pricing: true,
		},
		finance: {
			view: true,
			quotations: true,
			invoices: true,
			payments: true,
			reports: true,
			settings: true,
		},
		employees: {
			view: true,
			create: false,
			edit: false,
			delete: false,
			payroll: true,
			attendance: false,
		},
		company: {
			view: true,
			expenses: true,
			assets: true,
			reports: true,
		},
		settings: {
			organization: false,
			users: false,
			roles: false,
			billing: false,
			integrations: false,
		},
		reports: { view: true, create: false, approve: false },
	},

	// المهندس
	ENGINEER: {
		projects: {
			view: true,
			create: false,
			edit: true,
			delete: false,
			viewFinance: false,
			manageTeam: false,
		},
		quantities: {
			view: true,
			create: true,
			edit: true,
			delete: false,
			pricing: false,
		},
		pricing: {
			view: true,
			studies: true,
			quotations: false,
			pricing: false,
		},
		finance: {
			view: false,
			quotations: false,
			invoices: false,
			payments: false,
			reports: false,
			settings: false,
		},
		employees: {
			view: false,
			create: false,
			edit: false,
			delete: false,
			payroll: false,
			attendance: false,
		},
		company: {
			view: false,
			expenses: false,
			assets: false,
			reports: false,
		},
		settings: {
			organization: false,
			users: false,
			roles: false,
			billing: false,
			integrations: false,
		},
		reports: { view: true, create: true, approve: false },
	},

	// المشرف
	SUPERVISOR: {
		projects: {
			view: true,
			create: false,
			edit: false,
			delete: false,
			viewFinance: false,
			manageTeam: false,
		},
		quantities: {
			view: true,
			create: false,
			edit: false,
			delete: false,
			pricing: false,
		},
		pricing: {
			view: true,
			studies: false,
			quotations: false,
			pricing: false,
		},
		finance: {
			view: false,
			quotations: false,
			invoices: false,
			payments: false,
			reports: false,
			settings: false,
		},
		employees: {
			view: false,
			create: false,
			edit: false,
			delete: false,
			payroll: false,
			attendance: false,
		},
		company: {
			view: false,
			expenses: false,
			assets: false,
			reports: false,
		},
		settings: {
			organization: false,
			users: false,
			roles: false,
			billing: false,
			integrations: false,
		},
		reports: { view: true, create: true, approve: false },
	},

	// مخصص - كل شيء false
	CUSTOM: {
		projects: {
			view: false,
			create: false,
			edit: false,
			delete: false,
			viewFinance: false,
			manageTeam: false,
		},
		quantities: {
			view: false,
			create: false,
			edit: false,
			delete: false,
			pricing: false,
		},
		pricing: {
			view: false,
			studies: false,
			quotations: false,
			pricing: false,
		},
		finance: {
			view: false,
			quotations: false,
			invoices: false,
			payments: false,
			reports: false,
			settings: false,
		},
		employees: {
			view: false,
			create: false,
			edit: false,
			delete: false,
			payroll: false,
			attendance: false,
		},
		company: {
			view: false,
			expenses: false,
			assets: false,
			reports: false,
		},
		settings: {
			organization: false,
			users: false,
			roles: false,
			billing: false,
			integrations: false,
		},
		reports: { view: false, create: false, approve: false },
	},
};

// أسماء الأدوار بالعربي
export const ROLE_NAMES_AR: Record<string, string> = {
	OWNER: "المالك",
	PROJECT_MANAGER: "مدير المشاريع",
	ACCOUNTANT: "المحاسب",
	ENGINEER: "المهندس",
	SUPERVISOR: "المشرف",
	CUSTOM: "مخصص",
};
