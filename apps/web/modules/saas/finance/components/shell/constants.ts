import type { LucideIcon } from "lucide-react";
import {
	Wallet,
	Users,
	FileText,
	Banknote,
	CreditCard,
	Building,
	FolderOpen,
	Layout,
	BarChart3,
	Settings,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// NAVIGATION TYPES
// ═══════════════════════════════════════════════════════════════

export interface FinanceNavSection {
	id: string;
	path: string;
	labelKey: string;
	icon: LucideIcon;
}

// ═══════════════════════════════════════════════════════════════
// FINANCE NAVIGATION SECTIONS
// ═══════════════════════════════════════════════════════════════

export const FINANCE_NAV_SECTIONS: FinanceNavSection[] = [
	{
		id: "dashboard",
		path: "",
		labelKey: "finance.shell.sections.dashboard",
		icon: Wallet,
	},
	{
		id: "clients",
		path: "clients",
		labelKey: "finance.shell.sections.clients",
		icon: Users,
	},
	{
		id: "invoices",
		path: "invoices",
		labelKey: "finance.shell.sections.invoices",
		icon: FileText,
	},
	{
		id: "payments",
		path: "payments",
		labelKey: "finance.shell.sections.payments",
		icon: Banknote,
	},
	{
		id: "expenses",
		path: "expenses",
		labelKey: "finance.shell.sections.expenses",
		icon: CreditCard,
	},
	{
		id: "banks",
		path: "banks",
		labelKey: "finance.shell.sections.banks",
		icon: Building,
	},
	{
		id: "documents",
		path: "documents",
		labelKey: "finance.shell.sections.documents",
		icon: FolderOpen,
	},
	{
		id: "templates",
		path: "templates",
		labelKey: "finance.shell.sections.templates",
		icon: Layout,
	},
	{
		id: "reports",
		path: "reports",
		labelKey: "finance.shell.sections.reports",
		icon: BarChart3,
	},
	{
		id: "settings",
		path: "settings",
		labelKey: "finance.shell.sections.settings",
		icon: Settings,
	},
];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get the current finance segment from pathname
 * Returns the first segment after /finance/
 */
export function getCurrentFinanceSegment(pathname: string): string {
	// Extract the segment after /finance/
	const match = pathname.match(/\/finance(?:\/([^/?]+))?/);
	return match?.[1] ?? "";
}

/**
 * Check if we're on a sub-page (detail, new, edit, preview, etc.)
 */
export function isFinanceSubPage(pathname: string): boolean {
	// Count segments after /finance/
	const match = pathname.match(/\/finance\/(.+)/);
	if (!match) return false;

	const segments = match[1].split("/").filter(Boolean);
	// If more than 1 segment, it's a sub-page (e.g., clients/new, clients/[id])
	return segments.length > 1;
}

/**
 * Get the back href for the current finance page
 */
export function getFinanceBackHref(
	pathname: string,
	organizationSlug: string,
): string {
	const baseFinancePath = `/app/${organizationSlug}/finance`;
	const segment = getCurrentFinanceSegment(pathname);

	// If we're on the main finance page, no back button needed
	if (!segment) {
		return baseFinancePath;
	}

	// If we're on a sub-page, go back to the section list
	if (isFinanceSubPage(pathname)) {
		return `${baseFinancePath}/${segment}`;
	}

	// If we're on a section list page, go back to main finance
	return baseFinancePath;
}

/**
 * Get the finance home href
 */
export function getFinanceHomeHref(organizationSlug: string): string {
	return `/app/${organizationSlug}/finance`;
}

/**
 * Check if the current section is active
 */
export function isSectionActive(pathname: string, sectionPath: string): boolean {
	const currentSegment = getCurrentFinanceSegment(pathname);
	return currentSegment === sectionPath;
}

/**
 * Get section href
 */
export function getSectionHref(
	organizationSlug: string,
	sectionPath: string,
): string {
	const basePath = `/app/${organizationSlug}/finance`;
	return sectionPath ? `${basePath}/${sectionPath}` : basePath;
}
