import type { LucideIcon } from "lucide-react";
import {
	Calculator,
	FileSpreadsheet,
	HomeIcon,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// NAVIGATION TYPES
// ═══════════════════════════════════════════════════════════════

export interface PricingNavSection {
	id: string;
	path: string;
	labelKey: string;
	icon: LucideIcon;
}

// ═══════════════════════════════════════════════════════════════
// PRICING NAVIGATION SECTIONS
// ═══════════════════════════════════════════════════════════════

export const PRICING_NAV_SECTIONS: PricingNavSection[] = [
	{
		id: "dashboard",
		path: "",
		labelKey: "pricing.shell.sections.dashboard",
		icon: HomeIcon,
	},
	{
		id: "studies",
		path: "studies",
		labelKey: "pricing.shell.sections.studies",
		icon: Calculator,
	},
	{
		id: "quotations",
		path: "quotations",
		labelKey: "pricing.shell.sections.quotations",
		icon: FileSpreadsheet,
	},
];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get the current pricing segment from pathname
 * Returns the first segment after /pricing/
 */
export function getCurrentPricingSegment(pathname: string): string {
	const match = pathname.match(/\/pricing(?:\/([^/?]+))?/);
	return match?.[1] ?? "";
}

/**
 * Check if we're on a sub-page (detail, new, edit, preview, etc.)
 */
export function isPricingSubPage(pathname: string): boolean {
	const match = pathname.match(/\/pricing\/(.+)/);
	if (!match) return false;

	const segments = match[1].split("/").filter(Boolean);
	return segments.length > 1;
}

/**
 * Get the back href for the current pricing page
 */
export function getPricingBackHref(
	pathname: string,
	organizationSlug: string,
): string {
	const basePricingPath = `/app/${organizationSlug}/pricing`;
	const segment = getCurrentPricingSegment(pathname);

	if (!segment) {
		return basePricingPath;
	}

	if (isPricingSubPage(pathname)) {
		return `${basePricingPath}/${segment}`;
	}

	return basePricingPath;
}

/**
 * Get the pricing home href
 */
export function getPricingHomeHref(organizationSlug: string): string {
	return `/app/${organizationSlug}/pricing`;
}

/**
 * Check if the current section is active
 */
export function isPricingSectionActive(pathname: string, sectionPath: string): boolean {
	const currentSegment = getCurrentPricingSegment(pathname);
	return currentSegment === sectionPath;
}

/**
 * Get section href
 */
export function getPricingSectionHref(
	organizationSlug: string,
	sectionPath: string,
): string {
	const basePath = `/app/${organizationSlug}/pricing`;
	return sectionPath ? `${basePath}/${sectionPath}` : basePath;
}
