"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@ui/lib";
import {
	FINANCE_NAV_SECTIONS,
	getSectionHref,
	isSectionActive,
} from "./constants";

interface FinanceNavigationProps {
	organizationSlug: string;
}

export function FinanceNavigation({ organizationSlug }: FinanceNavigationProps) {
	const t = useTranslations();
	const pathname = usePathname();

	return (
		<div className="border-b border-border" dir="rtl">
			<nav className="flex overflow-x-auto scrollbar-hide">
				<div className="flex gap-1 min-w-max px-1 py-2">
					{FINANCE_NAV_SECTIONS.map((section) => {
						const isActive = isSectionActive(pathname, section.path);
						const href = getSectionHref(organizationSlug, section.path);
						const Icon = section.icon;

						return (
							<Link
								key={section.id}
								href={href}
								className={cn(
									"flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
									isActive
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-muted hover:text-foreground"
								)}
							>
								<Icon className="h-4 w-4" />
								<span>{t(section.labelKey)}</span>
							</Link>
						);
					})}
				</div>
			</nav>
		</div>
	);
}
