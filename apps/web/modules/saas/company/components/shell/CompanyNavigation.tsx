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
		<div className="px-4 md:px-6 lg:px-8 pt-4">
			<nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide bg-card border-2 rounded-2xl p-2">
				{COMPANY_NAV_SECTIONS.map((section) => {
					const isActive = isSectionActive(pathname, section.path);
					const href = getSectionHref(organizationSlug, section.path);
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
