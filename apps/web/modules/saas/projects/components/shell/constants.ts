import type { LucideIcon } from "lucide-react";
import {
	Home,
	FileText,
	Banknote,
	MessageSquare,
	MoreHorizontal,
	Camera,
	AlertTriangle,
	FileDiff,
	FolderKanban,
	Megaphone,
	Key,
	BarChart3,
	Users,
	Plus,
	ClipboardList,
	Receipt,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// NAVIGATION TYPES
// ═══════════════════════════════════════════════════════════════

export interface ProjectNavSection {
	id: string;
	path: string;
	labelKey: string;
	icon: LucideIcon;
	section: string; // for canViewSection() check
}

export interface NavRoute {
	id: string;
	path: string;
	label: string;
	labelEn: string;
	icon: LucideIcon;
}

export interface NavGroup {
	id: string;
	label: string;
	labelEn: string;
	icon: LucideIcon;
	routes: NavRoute[];
	directLink?: string;
	isOverflow?: boolean;
}

export interface ContextAction {
	id: string;
	label: string;
	labelEn: string;
	icon: LucideIcon;
	href: string;
	variant?: "default" | "primary";
}

// ═══════════════════════════════════════════════════════════════
// FLAT NAVIGATION SECTIONS (pill-style, matches finance pattern)
// ═══════════════════════════════════════════════════════════════

export const PROJECT_NAV_SECTIONS: ProjectNavSection[] = [
	{
		id: "overview",
		path: "",
		labelKey: "projects.shell.sections.overview",
		icon: Home,
		section: "overview",
	},
	{
		id: "execution",
		path: "execution",
		labelKey: "projects.shell.sections.execution",
		icon: FileText,
		section: "execution",
	},
	{
		id: "expenses",
		path: "finance/expenses",
		labelKey: "projects.shell.sections.expenses",
		icon: Receipt,
		section: "finance/expenses",
	},
	{
		id: "payments",
		path: "finance/payments",
		labelKey: "projects.shell.sections.payments",
		icon: Banknote,
		section: "finance/payments",
	},
	{
		id: "claims",
		path: "finance/claims",
		labelKey: "projects.shell.sections.claims",
		icon: ClipboardList,
		section: "finance/claims",
	},
	{
		id: "documents",
		path: "documents",
		labelKey: "projects.shell.sections.documents",
		icon: FolderKanban,
		section: "documents",
	},
	{
		id: "owner",
		path: "owner",
		labelKey: "projects.shell.sections.owner",
		icon: Key,
		section: "owner",
	},
	{
		id: "insights",
		path: "insights",
		labelKey: "projects.shell.sections.insights",
		icon: BarChart3,
		section: "insights",
	},
	{
		id: "team",
		path: "team",
		labelKey: "projects.shell.sections.team",
		icon: Users,
		section: "team",
	},
];

// ═══════════════════════════════════════════════════════════════
// NAVIGATION GROUPS CONFIGURATION (legacy, kept for backward compat)
// ═══════════════════════════════════════════════════════════════

export const NAVIGATION_GROUPS: NavGroup[] = [
	{
		id: "execution",
		label: "التنفيذ",
		labelEn: "Execution",
		icon: FileText,
		directLink: "execution",
		routes: [
			{
				id: "execution",
				path: "execution",
				label: "التنفيذ",
				labelEn: "Execution",
				icon: FileText,
			},
		],
	},
	{
		id: "finance",
		label: "المالية",
		labelEn: "Finance",
		icon: Banknote,
		routes: [
			{
				id: "finance-summary",
				path: "finance",
				label: "الملخص",
				labelEn: "Summary",
				icon: Banknote,
			},
			{
				id: "finance-expenses",
				path: "finance/expenses",
				label: "المصروفات",
				labelEn: "Expenses",
				icon: Receipt,
			},
			{
				id: "finance-payments",
				path: "finance/payments",
				label: "المقبوضات",
				labelEn: "Payments",
				icon: Banknote,
			},
			{
				id: "finance-claims",
				path: "finance/claims",
				label: "المستخلصات",
				labelEn: "Claims",
				icon: ClipboardList,
			},
		],
	},
	{
		id: "communication",
		label: "التواصل",
		labelEn: "Communication",
		icon: MessageSquare,
		routes: [
			{
				id: "documents",
				path: "documents",
				label: "الوثائق",
				labelEn: "Documents",
				icon: FolderKanban,
			},
			{
				id: "updates",
				path: "updates",
				label: "التحديثات الرسمية",
				labelEn: "Official Updates",
				icon: Megaphone,
			},
		],
	},
	{
		id: "more",
		label: "المزيد",
		labelEn: "More",
		icon: MoreHorizontal,
		isOverflow: true,
		routes: [
			{
				id: "owner",
				path: "owner",
				label: "بوابة المالك",
				labelEn: "Owner Portal",
				icon: Key,
			},
			{
				id: "insights",
				path: "insights",
				label: "التحليلات",
				labelEn: "Insights",
				icon: BarChart3,
			},
			{
				id: "team",
				path: "team",
				label: "فريق العمل",
				labelEn: "Team",
				icon: Users,
			},
		],
	},
];

// ═══════════════════════════════════════════════════════════════
// ADAPTIVE NAVIGATION GROUP CONFIG
// ═══════════════════════════════════════════════════════════════

export type NavGroupType = "direct" | "popover";

export interface NavGroupConfig {
	id: string;
	labelKey: string; // i18n key under projects.shell.navigation
	icon: LucideIcon;
	type: NavGroupType;
	/** Section IDs from PROJECT_NAV_SECTIONS that belong to this group */
	sectionIds: string[];
	/** For "direct" groups, which section to link to */
	directSectionId?: string;
	/** Whether this is the overflow "More" group */
	isOverflow?: boolean;
	/** Mobile-specific: whether to show in bottom dock */
	showInMobileDock?: boolean;
	/** Mobile-specific: use Sheet instead of Popover */
	mobileSheet?: boolean;
}

export const NAV_GROUP_CONFIG: NavGroupConfig[] = [
	{
		id: "overview",
		labelKey: "projects.shell.navigation.overview",
		icon: Home,
		type: "direct",
		sectionIds: ["overview"],
		directSectionId: "overview",
		showInMobileDock: true,
	},
	{
		id: "execution",
		labelKey: "projects.shell.navigation.execution",
		icon: FileText,
		type: "direct",
		sectionIds: ["execution"],
		directSectionId: "execution",
		showInMobileDock: true,
	},
	{
		id: "finance",
		labelKey: "projects.shell.navigation.finance",
		icon: Banknote,
		type: "popover",
		sectionIds: ["expenses", "payments", "claims"],
		showInMobileDock: true,
	},
	{
		id: "workspace",
		labelKey: "projects.shell.navigation.workspace",
		icon: FolderKanban,
		type: "direct",
		sectionIds: ["documents"],
		directSectionId: "documents",
		showInMobileDock: true,
	},
	{
		id: "more",
		labelKey: "projects.shell.navigation.more",
		icon: MoreHorizontal,
		type: "popover",
		sectionIds: ["owner", "insights", "team"],
		isOverflow: true,
		showInMobileDock: true,
		mobileSheet: true,
	},
];

/** Glassmorphism shared CSS classes */
export const GLASS_CLASSES = {
	bar: "bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 shadow-lg",
	barHover: "hover:bg-white/80 dark:hover:bg-slate-900/70",
} as const;

/**
 * Filter groups based on visible sections, returning only groups
 * that have at least one visible section.
 */
export function getVisibleGroups(
	canViewSection: (section: string) => boolean,
): Array<NavGroupConfig & { visibleSections: ProjectNavSection[] }> {
	return NAV_GROUP_CONFIG.map((group) => {
		const visibleSections = PROJECT_NAV_SECTIONS.filter(
			(s) => group.sectionIds.includes(s.id) && canViewSection(s.section),
		);
		return { ...group, visibleSections };
	}).filter((group) => group.visibleSections.length > 0);
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT ACTIONS PER ROUTE
// ═══════════════════════════════════════════════════════════════

export const CONTEXT_ACTIONS: Record<string, ContextAction[]> = {
	// Overview page - Quick Actions are now in the overview bento grid
	"": [],
	// Execution page (field + timeline combined)
	execution: [
		{
			id: "new-report",
			label: "تقرير جديد",
			labelEn: "New Report",
			icon: FileText,
			href: "execution/new-report",
			variant: "primary",
		},
		{
			id: "upload-photo",
			label: "رفع صورة",
			labelEn: "Upload Photo",
			icon: Camera,
			href: "execution/upload",
		},
		{
			id: "new-issue",
			label: "مشكلة جديدة",
			labelEn: "New Issue",
			icon: AlertTriangle,
			href: "execution/new-issue",
		},
		{
			id: "new-milestone",
			label: "إضافة مرحلة",
			labelEn: "Add Milestone",
			icon: Plus,
			href: "execution?action=new",
		},
		{
			id: "change-orders",
			label: "أوامر التغيير",
			labelEn: "Change Orders",
			icon: FileDiff,
			href: "changes",
		},
	],
	// Finance pages
	finance: [
		{
			id: "new-expense",
			label: "إضافة مصروف",
			labelEn: "Add Expense",
			icon: Banknote,
			href: "finance/expenses/new",
			variant: "primary",
		},
		{
			id: "new-payment",
			label: "إضافة مقبوض",
			labelEn: "Add Payment",
			icon: Receipt,
			href: "finance/payments/new",
		},
	],
	"finance/expenses": [
		{
			id: "new-expense",
			label: "إضافة مصروف",
			labelEn: "Add Expense",
			icon: Banknote,
			href: "finance/expenses/new",
			variant: "primary",
		},
	],
	"finance/payments": [
		{
			id: "new-payment",
			label: "إضافة مقبوض",
			labelEn: "Add Payment",
			icon: Receipt,
			href: "finance/payments/new",
			variant: "primary",
		},
	],
	"finance/claims": [
		{
			id: "new-claim",
			label: "مستخلص جديد",
			labelEn: "New Claim",
			icon: ClipboardList,
			href: "finance/claims/new",
			variant: "primary",
		},
	],
	// Documents page
	documents: [
		{
			id: "new-document",
			label: "إضافة وثيقة",
			labelEn: "Add Document",
			icon: FolderKanban,
			href: "documents/new",
			variant: "primary",
		},
	],
	// Changes page
	changes: [
		{
			id: "new-change-order",
			label: "أمر تغيير جديد",
			labelEn: "New Change Order",
			icon: FileDiff,
			href: "changes?action=new",
			variant: "primary",
		},
	],
	// Updates page
	updates: [
		{
			id: "new-update",
			label: "تحديث جديد",
			labelEn: "New Update",
			icon: Megaphone,
			href: "updates?action=new",
			variant: "primary",
		},
	],
	// Team page
	team: [
		{
			id: "add-member",
			label: "إضافة عضو",
			labelEn: "Add Member",
			icon: Users,
			href: "team?action=add",
			variant: "primary",
		},
	],
	// Owner page
	owner: [],
	// Insights page
	insights: [],
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get the current route segment(s) from pathname
 * Supports nested paths like "finance/expenses"
 */
export function getCurrentRouteSegment(pathname: string): string {
	// Extract everything after /projects/[projectId]/
	const match = pathname.match(/\/projects\/[^/]+\/(.+?)(?:\?|$)/);
	if (match) {
		// Remove trailing slashes
		return match[1].replace(/\/$/, "");
	}
	// Try single segment
	const singleMatch = pathname.match(/\/projects\/[^/]+\/([^/?]+)/);
	return singleMatch?.[1] ?? "";
}

/**
 * Get section href for project navigation
 */
export function getProjectSectionHref(
	organizationSlug: string,
	projectId: string,
	sectionPath: string,
): string {
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	return sectionPath ? `${basePath}/${sectionPath}` : basePath;
}

/**
 * Check if a project navigation section is active
 */
export function isProjectSectionActive(
	pathname: string,
	sectionPath: string,
): boolean {
	const segment = getCurrentRouteSegment(pathname);
	if (sectionPath === "") {
		return segment === "";
	}
	return segment === sectionPath || segment.startsWith(`${sectionPath}/`);
}

/**
 * Find active navigation group based on current route
 */
export function getActiveNavGroup(pathname: string): NavGroup | null {
	const segment = getCurrentRouteSegment(pathname);

	if (!segment) return null;

	for (const group of NAVIGATION_GROUPS) {
		if (group.directLink === segment) {
			return group;
		}
		// Check if segment matches or starts with a route path
		if (group.routes.some((route) => segment === route.path || segment.startsWith(`${route.path}/`))) {
			return group;
		}
	}
	return null;
}

/**
 * Check if a route is active
 */
export function isRouteActive(pathname: string, routePath: string): boolean {
	const segment = getCurrentRouteSegment(pathname);
	return segment === routePath || segment.startsWith(`${routePath}/`);
}

/**
 * Get context actions for current route
 * Supports nested paths - tries exact match first, then parent segment
 */
export function getContextActions(pathname: string): ContextAction[] {
	const segment = getCurrentRouteSegment(pathname);

	// Try exact match first
	if (CONTEXT_ACTIONS[segment]) {
		return CONTEXT_ACTIONS[segment];
	}

	// Try parent segment (e.g., "finance/expenses/new" → "finance/expenses" → "finance")
	const parts = segment.split("/");
	while (parts.length > 1) {
		parts.pop();
		const parentSegment = parts.join("/");
		if (CONTEXT_ACTIONS[parentSegment]) {
			return CONTEXT_ACTIONS[parentSegment];
		}
	}

	// Try single segment
	if (parts.length === 1 && CONTEXT_ACTIONS[parts[0]]) {
		return CONTEXT_ACTIONS[parts[0]];
	}

	return CONTEXT_ACTIONS[""] ?? [];
}
