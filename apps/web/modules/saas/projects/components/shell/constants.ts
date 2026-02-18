import type { LucideIcon } from "lucide-react";
import {
	FileText,
	Banknote,
	Calendar,
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
	directLink?: string; // For groups with single direct link (like Finance)
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
// NAVIGATION GROUPS CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const NAVIGATION_GROUPS: NavGroup[] = [
	{
		id: "execution",
		label: "التنفيذ",
		labelEn: "Execution",
		icon: FileText,
		routes: [
			{
				id: "field",
				path: "field",
				label: "التقارير الميدانية",
				labelEn: "Field Reports",
				icon: FileText,
			},
			{
				id: "supervisor",
				path: "supervisor",
				label: "وضع المشرف",
				labelEn: "Supervisor Mode",
				icon: Users,
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
		id: "planning",
		label: "التخطيط",
		labelEn: "Planning",
		icon: Calendar,
		routes: [
			{
				id: "timeline",
				path: "timeline",
				label: "الجدول الزمني",
				labelEn: "Timeline",
				icon: Calendar,
			},
			{
				id: "changes",
				path: "changes",
				label: "أوامر التغيير",
				labelEn: "Change Orders",
				icon: FileDiff,
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
				id: "chat",
				path: "chat",
				label: "المحادثة",
				labelEn: "Chat",
				icon: MessageSquare,
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
// CONTEXT ACTIONS PER ROUTE
// ═══════════════════════════════════════════════════════════════

export const CONTEXT_ACTIONS: Record<string, ContextAction[]> = {
	// Overview page
	"": [
		{
			id: "new-report",
			label: "تقرير جديد",
			labelEn: "New Report",
			icon: FileText,
			href: "field/new-report",
			variant: "primary",
		},
		{
			id: "upload-photo",
			label: "رفع صورة",
			labelEn: "Upload Photo",
			icon: Camera,
			href: "field/upload",
		},
	],
	// Field pages
	field: [
		{
			id: "new-report",
			label: "تقرير جديد",
			labelEn: "New Report",
			icon: FileText,
			href: "field/new-report",
			variant: "primary",
		},
		{
			id: "upload-photo",
			label: "رفع صورة",
			labelEn: "Upload Photo",
			icon: Camera,
			href: "field/upload",
		},
		{
			id: "new-issue",
			label: "مشكلة جديدة",
			labelEn: "New Issue",
			icon: AlertTriangle,
			href: "field/new-issue",
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
	// Timeline page
	timeline: [
		{
			id: "new-milestone",
			label: "إضافة مرحلة",
			labelEn: "Add Milestone",
			icon: Plus,
			href: "timeline?action=new",
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
	// Chat page
	chat: [],
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
	// Supervisor page
	supervisor: [
		{
			id: "update-progress",
			label: "تحديث التقدم",
			labelEn: "Update Progress",
			icon: ClipboardList,
			href: "supervisor?action=update",
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
