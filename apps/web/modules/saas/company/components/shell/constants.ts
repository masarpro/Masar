import {
	LayoutDashboard,
	Users,
	Receipt,
	Package,
	BarChart3,
	Banknote,
	type LucideIcon,
} from "lucide-react";

export interface CompanyNavSection {
	id: string;
	path: string;
	labelKey: string;
	icon: LucideIcon;
}

export const COMPANY_NAV_SECTIONS: CompanyNavSection[] = [
	{
		id: "dashboard",
		path: "",
		labelKey: "company.nav.dashboard",
		icon: LayoutDashboard,
	},
	{
		id: "employees",
		path: "employees",
		labelKey: "company.nav.employees",
		icon: Users,
	},
	{
		id: "payroll",
		path: "payroll",
		labelKey: "company.nav.payroll",
		icon: Banknote,
	},
	{
		id: "expenses",
		path: "expenses",
		labelKey: "company.nav.expenses",
		icon: Receipt,
	},
	{
		id: "assets",
		path: "assets",
		labelKey: "company.nav.assets",
		icon: Package,
	},
	{
		id: "reports",
		path: "reports",
		labelKey: "company.nav.reports",
		icon: BarChart3,
	},
];

export function getCompanyBaseHref(organizationSlug: string): string {
	return `/app/${organizationSlug}/company`;
}

export function getSectionHref(organizationSlug: string, sectionPath: string): string {
	const base = getCompanyBaseHref(organizationSlug);
	return sectionPath ? `${base}/${sectionPath}` : base;
}

export function getCurrentCompanySegment(pathname: string): string {
	const match = pathname.match(/\/company\/([^/]+)/);
	return match?.[1] ?? "";
}

export function isSectionActive(pathname: string, sectionPath: string): boolean {
	const segment = getCurrentCompanySegment(pathname);
	if (sectionPath === "") {
		return segment === "" || pathname.endsWith("/company");
	}
	return segment === sectionPath;
}

export function isCompanySubPage(pathname: string): boolean {
	const parts = pathname.split("/company/");
	if (parts.length < 2) return false;
	const rest = parts[1];
	// Sub-page if there are nested segments like employees/new, employees/[id], etc.
	return rest.includes("/") || rest.includes("new");
}

export function getCompanyBackHref(pathname: string, organizationSlug: string): string {
	const segment = getCurrentCompanySegment(pathname);
	if (!segment) return getCompanyBaseHref(organizationSlug);
	return getSectionHref(organizationSlug, segment);
}
