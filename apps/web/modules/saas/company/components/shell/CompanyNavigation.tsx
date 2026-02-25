"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@ui/lib";
import { COMPANY_NAV_SECTIONS, isSectionActive, getSectionHref } from "./constants";

interface CompanyNavigationProps {
	organizationSlug: string;
}

export function CompanyNavigation({ organizationSlug }: CompanyNavigationProps) {
	const t = useTranslations();
	const pathname = usePathname();

	return (
		<div className="px-4 md:px-6 lg:px-8 pt-4" dir="rtl">
			<nav className="flex items-center gap-2 overflow-x-auto scrollbar-hide backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-2">
				{COMPANY_NAV_SECTIONS.map((section) => {
					const isActive = isSectionActive(pathname, section.path);
					const href = getSectionHref(organizationSlug, section.path);
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
