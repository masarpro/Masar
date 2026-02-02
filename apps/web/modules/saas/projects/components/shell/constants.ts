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
		routes: [],
		directLink: "finance",
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
			id: "new-claim",
			label: "مستخلص جديد",
			labelEn: "New Claim",
			icon: Receipt,
			href: "finance/new-claim",
			variant: "primary",
		},
		{
			id: "new-expense",
			label: "إضافة مصروف",
			labelEn: "Add Expense",
			icon: Banknote,
			href: "finance/new-expense",
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
 * Get the current route segment from pathname
 */
export function getCurrentRouteSegment(pathname: string): string {
	// Extract the segment after /projects/[projectId]/
	const match = pathname.match(/\/projects\/[^/]+\/([^/?]+)/);
	return match?.[1] ?? "";
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
		if (group.routes.some((route) => route.path === segment)) {
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
	return segment === routePath;
}

/**
 * Get context actions for current route
 */
export function getContextActions(pathname: string): ContextAction[] {
	const segment = getCurrentRouteSegment(pathname);
	return CONTEXT_ACTIONS[segment] ?? CONTEXT_ACTIONS[""] ?? [];
}
