/**
 * Shared constants for the Masar application
 * Provides consistent labels, colors, and icons for enums across all components
 */

// ═══════════════════════════════════════════════════════════════
// PROJECT STATUS
// ═══════════════════════════════════════════════════════════════

export type ProjectStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";

export interface StatusConfig {
	label: string;
	labelEn: string;
	color: string;
	bgColor: string;
	textColor: string;
	darkBgColor: string;
	darkTextColor: string;
}

export const PROJECT_STATUSES: Record<ProjectStatus, StatusConfig> = {
	ACTIVE: {
		label: "نشط",
		labelEn: "Active",
		color: "teal",
		bgColor: "bg-teal-100",
		textColor: "text-teal-700",
		darkBgColor: "dark:bg-teal-900/30",
		darkTextColor: "dark:text-teal-400",
	},
	ON_HOLD: {
		label: "معلق",
		labelEn: "On Hold",
		color: "amber",
		bgColor: "bg-amber-100",
		textColor: "text-amber-700",
		darkBgColor: "dark:bg-amber-900/30",
		darkTextColor: "dark:text-amber-400",
	},
	COMPLETED: {
		label: "مكتمل",
		labelEn: "Completed",
		color: "slate",
		bgColor: "bg-slate-100",
		textColor: "text-slate-700",
		darkBgColor: "dark:bg-slate-800",
		darkTextColor: "dark:text-slate-400",
	},
	ARCHIVED: {
		label: "مؤرشف",
		labelEn: "Archived",
		color: "red",
		bgColor: "bg-red-100",
		textColor: "text-red-700",
		darkBgColor: "dark:bg-red-900/30",
		darkTextColor: "dark:text-red-400",
	},
};

export function getProjectStatusClasses(status: ProjectStatus): string {
	const config = PROJECT_STATUSES[status];
	return `${config.bgColor} ${config.textColor} ${config.darkBgColor} ${config.darkTextColor}`;
}

// ═══════════════════════════════════════════════════════════════
// PROJECT TYPE
// ═══════════════════════════════════════════════════════════════

export type ProjectType = "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "INFRASTRUCTURE" | "MIXED";

export const PROJECT_TYPES: Record<ProjectType, { label: string; labelEn: string }> = {
	RESIDENTIAL: { label: "سكني", labelEn: "Residential" },
	COMMERCIAL: { label: "تجاري", labelEn: "Commercial" },
	INDUSTRIAL: { label: "صناعي", labelEn: "Industrial" },
	INFRASTRUCTURE: { label: "بنية تحتية", labelEn: "Infrastructure" },
	MIXED: { label: "مختلط", labelEn: "Mixed" },
};

// ═══════════════════════════════════════════════════════════════
// PROJECT ROLE
// ═══════════════════════════════════════════════════════════════

export type ProjectRole = "MANAGER" | "ENGINEER" | "SUPERVISOR" | "ACCOUNTANT" | "VIEWER";

export interface RoleConfig {
	label: string;
	labelEn: string;
	description: string;
	descriptionEn: string;
	color: string;
	bgColor: string;
	textColor: string;
	darkBgColor: string;
	darkTextColor: string;
}

export const PROJECT_ROLES: Record<ProjectRole, RoleConfig> = {
	MANAGER: {
		label: "مدير المشروع",
		labelEn: "Project Manager",
		description: "يملك صلاحيات كاملة على المشروع",
		descriptionEn: "Full permissions on the project",
		color: "purple",
		bgColor: "bg-purple-100",
		textColor: "text-purple-700",
		darkBgColor: "dark:bg-purple-900/30",
		darkTextColor: "dark:text-purple-400",
	},
	ENGINEER: {
		label: "مهندس",
		labelEn: "Engineer",
		description: "يمكنه إدارة الجوانب الفنية والتقارير",
		descriptionEn: "Can manage technical aspects and reports",
		color: "blue",
		bgColor: "bg-blue-100",
		textColor: "text-blue-700",
		darkBgColor: "dark:bg-blue-900/30",
		darkTextColor: "dark:text-blue-400",
	},
	SUPERVISOR: {
		label: "مشرف ميداني",
		labelEn: "Field Supervisor",
		description: "يمكنه إضافة التقارير الميدانية والصور",
		descriptionEn: "Can add field reports and photos",
		color: "orange",
		bgColor: "bg-orange-100",
		textColor: "text-orange-700",
		darkBgColor: "dark:bg-orange-900/30",
		darkTextColor: "dark:text-orange-400",
	},
	ACCOUNTANT: {
		label: "محاسب المشروع",
		labelEn: "Project Accountant",
		description: "يمكنه إدارة الجوانب المالية",
		descriptionEn: "Can manage financial aspects",
		color: "green",
		bgColor: "bg-green-100",
		textColor: "text-green-700",
		darkBgColor: "dark:bg-green-900/30",
		darkTextColor: "dark:text-green-400",
	},
	VIEWER: {
		label: "مشاهد",
		labelEn: "Viewer",
		description: "يمكنه عرض المشروع فقط",
		descriptionEn: "View-only access to the project",
		color: "slate",
		bgColor: "bg-slate-100",
		textColor: "text-slate-700",
		darkBgColor: "dark:bg-slate-900/30",
		darkTextColor: "dark:text-slate-400",
	},
};

export function getProjectRoleClasses(role: ProjectRole): string {
	const config = PROJECT_ROLES[role];
	return `${config.bgColor} ${config.textColor} ${config.darkBgColor} ${config.darkTextColor}`;
}

// ═══════════════════════════════════════════════════════════════
// ISSUE SEVERITY
// ═══════════════════════════════════════════════════════════════

export type IssueSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const ISSUE_SEVERITIES: Record<IssueSeverity, StatusConfig> = {
	LOW: {
		label: "منخفضة",
		labelEn: "Low",
		color: "slate",
		bgColor: "bg-slate-100",
		textColor: "text-slate-700",
		darkBgColor: "dark:bg-slate-800",
		darkTextColor: "dark:text-slate-400",
	},
	MEDIUM: {
		label: "متوسطة",
		labelEn: "Medium",
		color: "amber",
		bgColor: "bg-amber-100",
		textColor: "text-amber-700",
		darkBgColor: "dark:bg-amber-900/30",
		darkTextColor: "dark:text-amber-400",
	},
	HIGH: {
		label: "عالية",
		labelEn: "High",
		color: "orange",
		bgColor: "bg-orange-100",
		textColor: "text-orange-700",
		darkBgColor: "dark:bg-orange-900/30",
		darkTextColor: "dark:text-orange-400",
	},
	CRITICAL: {
		label: "حرجة",
		labelEn: "Critical",
		color: "red",
		bgColor: "bg-red-100",
		textColor: "text-red-700",
		darkBgColor: "dark:bg-red-900/30",
		darkTextColor: "dark:text-red-400",
	},
};

export function getIssueSeverityClasses(severity: IssueSeverity): string {
	const config = ISSUE_SEVERITIES[severity];
	return `${config.bgColor} ${config.textColor} ${config.darkBgColor} ${config.darkTextColor}`;
}

// ═══════════════════════════════════════════════════════════════
// ISSUE STATUS
// ═══════════════════════════════════════════════════════════════

export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export const ISSUE_STATUSES: Record<IssueStatus, StatusConfig> = {
	OPEN: {
		label: "مفتوحة",
		labelEn: "Open",
		color: "red",
		bgColor: "bg-red-100",
		textColor: "text-red-700",
		darkBgColor: "dark:bg-red-900/30",
		darkTextColor: "dark:text-red-400",
	},
	IN_PROGRESS: {
		label: "قيد المعالجة",
		labelEn: "In Progress",
		color: "amber",
		bgColor: "bg-amber-100",
		textColor: "text-amber-700",
		darkBgColor: "dark:bg-amber-900/30",
		darkTextColor: "dark:text-amber-400",
	},
	RESOLVED: {
		label: "تم الحل",
		labelEn: "Resolved",
		color: "teal",
		bgColor: "bg-teal-100",
		textColor: "text-teal-700",
		darkBgColor: "dark:bg-teal-900/30",
		darkTextColor: "dark:text-teal-400",
	},
	CLOSED: {
		label: "مغلقة",
		labelEn: "Closed",
		color: "slate",
		bgColor: "bg-slate-100",
		textColor: "text-slate-700",
		darkBgColor: "dark:bg-slate-800",
		darkTextColor: "dark:text-slate-400",
	},
};

export function getIssueStatusClasses(status: IssueStatus): string {
	const config = ISSUE_STATUSES[status];
	return `${config.bgColor} ${config.textColor} ${config.darkBgColor} ${config.darkTextColor}`;
}

// ═══════════════════════════════════════════════════════════════
// EXPENSE CATEGORY
// ═══════════════════════════════════════════════════════════════

export type ExpenseCategory = "MATERIALS" | "LABOR" | "EQUIPMENT" | "SUBCONTRACTOR" | "TRANSPORT" | "MISC";

export interface CategoryConfig {
	label: string;
	labelEn: string;
	icon: string; // Icon name for reference
	color: string;
	bgColor: string;
	textColor: string;
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, CategoryConfig> = {
	MATERIALS: {
		label: "مواد",
		labelEn: "Materials",
		icon: "Package",
		color: "blue",
		bgColor: "bg-blue-100",
		textColor: "text-blue-700",
	},
	LABOR: {
		label: "عمالة",
		labelEn: "Labor",
		icon: "Users",
		color: "green",
		bgColor: "bg-green-100",
		textColor: "text-green-700",
	},
	EQUIPMENT: {
		label: "معدات",
		labelEn: "Equipment",
		icon: "Wrench",
		color: "amber",
		bgColor: "bg-amber-100",
		textColor: "text-amber-700",
	},
	SUBCONTRACTOR: {
		label: "مقاول من الباطن",
		labelEn: "Subcontractor",
		icon: "Building2",
		color: "purple",
		bgColor: "bg-purple-100",
		textColor: "text-purple-700",
	},
	TRANSPORT: {
		label: "نقل",
		labelEn: "Transport",
		icon: "Truck",
		color: "cyan",
		bgColor: "bg-cyan-100",
		textColor: "text-cyan-700",
	},
	MISC: {
		label: "متنوعة",
		labelEn: "Miscellaneous",
		icon: "MoreHorizontal",
		color: "slate",
		bgColor: "bg-slate-100",
		textColor: "text-slate-700",
	},
};

// ═══════════════════════════════════════════════════════════════
// CLAIM STATUS
// ═══════════════════════════════════════════════════════════════

export type ClaimStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "PAID" | "REJECTED";

export const CLAIM_STATUSES: Record<ClaimStatus, StatusConfig> = {
	DRAFT: {
		label: "مسودة",
		labelEn: "Draft",
		color: "slate",
		bgColor: "bg-slate-100",
		textColor: "text-slate-700",
		darkBgColor: "dark:bg-slate-800",
		darkTextColor: "dark:text-slate-400",
	},
	SUBMITTED: {
		label: "مقدم",
		labelEn: "Submitted",
		color: "blue",
		bgColor: "bg-blue-100",
		textColor: "text-blue-700",
		darkBgColor: "dark:bg-blue-900/30",
		darkTextColor: "dark:text-blue-400",
	},
	APPROVED: {
		label: "معتمد",
		labelEn: "Approved",
		color: "teal",
		bgColor: "bg-teal-100",
		textColor: "text-teal-700",
		darkBgColor: "dark:bg-teal-900/30",
		darkTextColor: "dark:text-teal-400",
	},
	PAID: {
		label: "مدفوع",
		labelEn: "Paid",
		color: "green",
		bgColor: "bg-green-100",
		textColor: "text-green-700",
		darkBgColor: "dark:bg-green-900/30",
		darkTextColor: "dark:text-green-400",
	},
	REJECTED: {
		label: "مرفوض",
		labelEn: "Rejected",
		color: "red",
		bgColor: "bg-red-100",
		textColor: "text-red-700",
		darkBgColor: "dark:bg-red-900/30",
		darkTextColor: "dark:text-red-400",
	},
};

export function getClaimStatusClasses(status: ClaimStatus): string {
	const config = CLAIM_STATUSES[status];
	return `${config.bgColor} ${config.textColor} ${config.darkBgColor} ${config.darkTextColor}`;
}

// ═══════════════════════════════════════════════════════════════
// WEATHER CONDITIONS
// ═══════════════════════════════════════════════════════════════

export type WeatherCondition = "SUNNY" | "CLOUDY" | "RAINY" | "WINDY" | "SANDSTORM";

export const WEATHER_CONDITIONS: Record<WeatherCondition, { label: string; labelEn: string; icon: string }> = {
	SUNNY: { label: "مشمس", labelEn: "Sunny", icon: "Sun" },
	CLOUDY: { label: "غائم", labelEn: "Cloudy", icon: "Cloud" },
	RAINY: { label: "ممطر", labelEn: "Rainy", icon: "CloudRain" },
	WINDY: { label: "عاصف", labelEn: "Windy", icon: "Wind" },
	SANDSTORM: { label: "عاصفة رملية", labelEn: "Sandstorm", icon: "CloudSun" },
};

// ═══════════════════════════════════════════════════════════════
// CHANGE ORDER STATUS
// ═══════════════════════════════════════════════════════════════

export type ChangeOrderStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "IMPLEMENTED";

export const CHANGE_ORDER_STATUSES: Record<ChangeOrderStatus, StatusConfig> = {
	DRAFT: {
		label: "مسودة",
		labelEn: "Draft",
		color: "slate",
		bgColor: "bg-slate-100",
		textColor: "text-slate-700",
		darkBgColor: "dark:bg-slate-800",
		darkTextColor: "dark:text-slate-400",
	},
	SUBMITTED: {
		label: "مقدم",
		labelEn: "Submitted",
		color: "blue",
		bgColor: "bg-blue-100",
		textColor: "text-blue-700",
		darkBgColor: "dark:bg-blue-900/30",
		darkTextColor: "dark:text-blue-400",
	},
	APPROVED: {
		label: "معتمد",
		labelEn: "Approved",
		color: "teal",
		bgColor: "bg-teal-100",
		textColor: "text-teal-700",
		darkBgColor: "dark:bg-teal-900/30",
		darkTextColor: "dark:text-teal-400",
	},
	REJECTED: {
		label: "مرفوض",
		labelEn: "Rejected",
		color: "red",
		bgColor: "bg-red-100",
		textColor: "text-red-700",
		darkBgColor: "dark:bg-red-900/30",
		darkTextColor: "dark:text-red-400",
	},
	IMPLEMENTED: {
		label: "منفذ",
		labelEn: "Implemented",
		color: "green",
		bgColor: "bg-green-100",
		textColor: "text-green-700",
		darkBgColor: "dark:bg-green-900/30",
		darkTextColor: "dark:text-green-400",
	},
};

export function getChangeOrderStatusClasses(status: ChangeOrderStatus): string {
	const config = CHANGE_ORDER_STATUSES[status];
	return `${config.bgColor} ${config.textColor} ${config.darkBgColor} ${config.darkTextColor}`;
}

// ═══════════════════════════════════════════════════════════════
// CHANGE ORDER CATEGORY
// ═══════════════════════════════════════════════════════════════

export type ChangeOrderCategory = "SCOPE_ADDITION" | "SCOPE_REDUCTION" | "DESIGN_CHANGE" | "MATERIAL_SUBSTITUTION" | "SCHEDULE_CHANGE" | "OTHER";

export const CHANGE_ORDER_CATEGORIES: Record<ChangeOrderCategory, { label: string; labelEn: string }> = {
	SCOPE_ADDITION: { label: "إضافة نطاق", labelEn: "Scope Addition" },
	SCOPE_REDUCTION: { label: "تقليص نطاق", labelEn: "Scope Reduction" },
	DESIGN_CHANGE: { label: "تغيير تصميم", labelEn: "Design Change" },
	MATERIAL_SUBSTITUTION: { label: "استبدال مواد", labelEn: "Material Substitution" },
	SCHEDULE_CHANGE: { label: "تغيير جدول", labelEn: "Schedule Change" },
	OTHER: { label: "أخرى", labelEn: "Other" },
};

// ═══════════════════════════════════════════════════════════════
// MILESTONE STATUS
// ═══════════════════════════════════════════════════════════════

export type MilestoneStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";

export const MILESTONE_STATUSES: Record<MilestoneStatus, StatusConfig> = {
	NOT_STARTED: {
		label: "لم يبدأ",
		labelEn: "Not Started",
		color: "slate",
		bgColor: "bg-slate-100",
		textColor: "text-slate-700",
		darkBgColor: "dark:bg-slate-800",
		darkTextColor: "dark:text-slate-400",
	},
	IN_PROGRESS: {
		label: "قيد التنفيذ",
		labelEn: "In Progress",
		color: "blue",
		bgColor: "bg-blue-100",
		textColor: "text-blue-700",
		darkBgColor: "dark:bg-blue-900/30",
		darkTextColor: "dark:text-blue-400",
	},
	COMPLETED: {
		label: "مكتمل",
		labelEn: "Completed",
		color: "green",
		bgColor: "bg-green-100",
		textColor: "text-green-700",
		darkBgColor: "dark:bg-green-900/30",
		darkTextColor: "dark:text-green-400",
	},
	DELAYED: {
		label: "متأخر",
		labelEn: "Delayed",
		color: "red",
		bgColor: "bg-red-100",
		textColor: "text-red-700",
		darkBgColor: "dark:bg-red-900/30",
		darkTextColor: "dark:text-red-400",
	},
};

export function getMilestoneStatusClasses(status: MilestoneStatus): string {
	const config = MILESTONE_STATUSES[status];
	return `${config.bgColor} ${config.textColor} ${config.darkBgColor} ${config.darkTextColor}`;
}

// ═══════════════════════════════════════════════════════════════
// ALERT LEVELS
// ═══════════════════════════════════════════════════════════════

export type AlertLevel = "INFO" | "WARNING" | "CRITICAL";

export const ALERT_LEVELS: Record<AlertLevel, StatusConfig> = {
	INFO: {
		label: "معلومات",
		labelEn: "Info",
		color: "blue",
		bgColor: "bg-blue-100",
		textColor: "text-blue-700",
		darkBgColor: "dark:bg-blue-900/30",
		darkTextColor: "dark:text-blue-400",
	},
	WARNING: {
		label: "تحذير",
		labelEn: "Warning",
		color: "amber",
		bgColor: "bg-amber-100",
		textColor: "text-amber-700",
		darkBgColor: "dark:bg-amber-900/30",
		darkTextColor: "dark:text-amber-400",
	},
	CRITICAL: {
		label: "حرج",
		labelEn: "Critical",
		color: "red",
		bgColor: "bg-red-100",
		textColor: "text-red-700",
		darkBgColor: "dark:bg-red-900/30",
		darkTextColor: "dark:text-red-400",
	},
};

export function getAlertLevelClasses(level: AlertLevel): string {
	const config = ALERT_LEVELS[level];
	return `${config.bgColor} ${config.textColor} ${config.darkBgColor} ${config.darkTextColor}`;
}
