import {
	Settings2,
	Users2,
	CreditCard,
	Link2,
	TriangleAlert,
	type LucideIcon,
} from "lucide-react";

export interface SettingsNavSection {
	id: string;
	path: string;
	labelKey: string;
	icon: LucideIcon;
	adminOnly?: boolean;
	condition?: string; // Used for conditional sections like billing
}

export const SETTINGS_NAV_SECTIONS: SettingsNavSection[] = [
	{
		id: "general",
		path: "general",
		labelKey: "settings.menu.organization.general",
		icon: Settings2,
	},
	{
		id: "members",
		path: "members",
		labelKey: "settings.menu.organization.members",
		icon: Users2,
	},
	{
		id: "billing",
		path: "billing",
		labelKey: "settings.menu.organization.billing",
		icon: CreditCard,
		adminOnly: true,
		condition: "billing",
	},
	{
		id: "integrations",
		path: "integrations",
		labelKey: "settings.menu.organization.integrations",
		icon: Link2,
		adminOnly: true,
	},
	{
		id: "danger-zone",
		path: "danger-zone",
		labelKey: "settings.menu.organization.dangerZone",
		icon: TriangleAlert,
		adminOnly: true,
	},
];

export function getSettingsBaseHref(organizationSlug: string): string {
	return `/app/${organizationSlug}/settings`;
}

export function getSettingsSectionHref(
	organizationSlug: string,
	sectionPath: string,
): string {
	return `${getSettingsBaseHref(organizationSlug)}/${sectionPath}`;
}

export function getCurrentSettingsSegment(pathname: string): string {
	const match = pathname.match(/\/settings\/([^/]+)/);
	return match?.[1] ?? "general";
}

export function isSettingsSectionActive(
	pathname: string,
	sectionPath: string,
): boolean {
	const segment = getCurrentSettingsSegment(pathname);
	return segment === sectionPath;
}
