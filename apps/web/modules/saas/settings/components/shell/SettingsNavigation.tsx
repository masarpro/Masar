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
			<nav className="flex items-center gap-2 overflow-x-auto scrollbar-hide backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-2">
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
							className={cn(
								"flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
								isActive
									? "bg-gradient-to-l from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20"
									: "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100",
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
