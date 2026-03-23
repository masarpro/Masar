"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@ui/lib";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useAccountingMode } from "@saas/finance/hooks/use-accounting-mode";
import {
	FINANCE_NAV_SECTIONS,
	getSectionHref,
	isSectionActive,
} from "./constants";

const ACCOUNTING_ONLY_SECTIONS = new Set([
	"accounting-dashboard",
	"chart-of-accounts",
	"journal-entries",
	"opening-balances",
	"accounting-periods",
]);

interface FinanceNavigationProps {
	organizationSlug: string;
}

export function FinanceNavigation({ organizationSlug }: FinanceNavigationProps) {
	const t = useTranslations();
	const pathname = usePathname();
	const { activeOrganization } = useActiveOrganization();
	const { isEnabled: accountingMode } = useAccountingMode(activeOrganization?.id ?? "");

	const visibleSections = accountingMode
		? FINANCE_NAV_SECTIONS
		: FINANCE_NAV_SECTIONS.filter((s) => !ACCOUNTING_ONLY_SECTIONS.has(s.id));

	return (
		<div className="border-b border-border" dir="rtl">
			<nav className="flex overflow-x-auto scrollbar-hide">
				<div className="flex gap-1 min-w-max px-1 py-2">
					{visibleSections.map((section) => {
						const isActive = isSectionActive(pathname, section.path);
						const href = getSectionHref(organizationSlug, section.path);
						const Icon = section.icon;

						return (
							<Link
								key={section.id}
								href={href}
								prefetch
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
