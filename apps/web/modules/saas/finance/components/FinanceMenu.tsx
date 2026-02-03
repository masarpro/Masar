"use client";

import { cn } from "@ui/lib";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
	LayoutDashboard,
	FileText,
	Receipt,
	FolderOpen,
	LayoutTemplate,
	Users,
	BarChart3,
	Building,
	TrendingDown,
	TrendingUp,
	ArrowLeftRight,
} from "lucide-react";

interface FinanceMenuProps {
	organizationSlug: string;
}

export function FinanceMenu({ organizationSlug }: FinanceMenuProps) {
	const t = useTranslations();
	const pathname = usePathname();
	const basePath = `/app/${organizationSlug}/finance`;

	const menuItems = [
		{
			title: t("finance.dashboard.title"),
			href: basePath,
			icon: LayoutDashboard,
			exactMatch: true,
		},
		{
			title: t("finance.quotations.title"),
			href: `${basePath}/quotations`,
			icon: FileText,
		},
		{
			title: t("finance.invoices.title"),
			href: `${basePath}/invoices`,
			icon: Receipt,
		},
		{
			title: t("finance.banks.title"),
			href: `${basePath}/banks`,
			icon: Building,
		},
		{
			title: t("finance.expenses.title"),
			href: `${basePath}/expenses`,
			icon: TrendingDown,
		},
		{
			title: t("finance.payments.title"),
			href: `${basePath}/payments`,
			icon: TrendingUp,
		},
		{
			title: t("finance.documents.title"),
			href: `${basePath}/documents`,
			icon: FolderOpen,
		},
		{
			title: t("finance.templates.title"),
			href: `${basePath}/templates`,
			icon: LayoutTemplate,
		},
		{
			title: t("finance.clients.title"),
			href: `${basePath}/clients`,
			icon: Users,
		},
		{
			title: t("finance.reports.title"),
			href: `${basePath}/reports`,
			icon: BarChart3,
		},
	];

	const isActiveMenuItem = (href: string, exactMatch?: boolean) => {
		if (exactMatch) {
			return pathname === href;
		}
		return pathname.startsWith(href);
	};

	return (
		<div className="space-y-1">
			<h2 className="mb-4 font-semibold text-foreground/60 text-xs px-2">
				{t("finance.title")}
			</h2>
			<ul className="flex list-none flex-col gap-1">
				{menuItems.map((item) => {
					const Icon = item.icon;
					const isActive = isActiveMenuItem(item.href, item.exactMatch);
					return (
						<li key={item.href}>
							<Link
								href={item.href}
								className={cn(
									"flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
									isActive
										? "bg-primary/10 text-primary font-medium"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
								)}
							>
								<Icon className="h-4 w-4 shrink-0" />
								<span>{item.title}</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
