import type { LucideIcon } from "lucide-react";
import {
	BarChart3,
	Building2,
	FileText,
	GitCompare,
	PackageCheck,
	Receipt,
	ShoppingCart,
} from "lucide-react";

export interface ProcurementNavSection {
	id: string;
	path: string;
	labelKey: string;
	icon: LucideIcon;
}

export const PROCUREMENT_NAV_SECTIONS: ProcurementNavSection[] = [
	{
		id: "dashboard",
		path: "",
		labelKey: "procurement.dashboard",
		icon: BarChart3,
	},
	{
		id: "vendors",
		path: "vendors",
		labelKey: "procurement.vendors",
		icon: Building2,
	},
	{
		id: "requests",
		path: "requests",
		labelKey: "procurement.requests",
		icon: FileText,
	},
	{
		id: "rfq",
		path: "rfq",
		labelKey: "procurement.rfqs",
		icon: GitCompare,
	},
	{
		id: "orders",
		path: "orders",
		labelKey: "procurement.orders",
		icon: ShoppingCart,
	},
	{
		id: "receipts",
		path: "receipts",
		labelKey: "procurement.receipts",
		icon: PackageCheck,
	},
	{
		id: "invoices",
		path: "invoices",
		labelKey: "procurement.invoices",
		icon: Receipt,
	},
];

export function getProcurementHomeHref(organizationSlug: string): string {
	return `/app/${organizationSlug}/procurement`;
}

export function getProcurementSectionHref(
	organizationSlug: string,
	sectionPath: string,
): string {
	const basePath = `/app/${organizationSlug}/procurement`;
	return sectionPath ? `${basePath}/${sectionPath}` : basePath;
}
