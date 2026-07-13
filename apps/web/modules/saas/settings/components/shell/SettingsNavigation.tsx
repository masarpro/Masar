"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@ui/lib";
import {
	SETTINGS_NAV_SECTIONS,
	isSettingsSectionActive,
	getSettingsSectionHref,
} from "./constants";

interface SettingsNavigationProps {
	organizationSlug: string;
	isAdmin: boolean;
	billingEnabled: boolean;
}

export function SettingsNavigation({
	organizationSlug,
	isAdmin,
	billingEnabled,
}: SettingsNavigationProps) {
	const t = useTranslations();
	const pathname = usePathname();

	const visibleSections = SETTINGS_NAV_SECTIONS.filter((section) => {
		if (section.adminOnly && !isAdmin) return false;
		if (section.condition === "billing" && !billingEnabled) return false;
		return true;
	});

	return (
		<div className="px-4 md:px-6 lg:px-8 pt-4" dir="rtl">
			<nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide bg-card border-2 rounded-2xl p-2">
				{visibleSections.map((section) => {
					const isActive = isSettingsSectionActive(
						pathname,
						section.path,
					);
					const href = getSettingsSectionHref(
						organizationSlug,
						section.path,
					);
					const Icon = section.icon;

					return (
						<Link
							key={section.id}
							href={href}
							prefetch
							className={cn(
								"flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-sm font-medium transition-all duration-200",
								isActive
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
							)}
						>
							<Icon className="h-4 w-4" />
							<span>{t(section.labelKey)}</span>
						</Link>
					);
				})}
			</nav>
		</div>
	);
}
