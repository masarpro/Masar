"use client";

import { cn } from "@ui/lib";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
	FolderOpen,
	LayoutTemplate,
	Users,
	BarChart3,
	Building,
	Settings,
} from "lucide-react";

interface TabsBarProps {
	organizationSlug: string;
}

export function TabsBar({ organizationSlug }: TabsBarProps) {
	const t = useTranslations();
	const pathname = usePathname();
	const basePath = `/app/${organizationSlug}/finance`;

	// Secondary navigation links
	const secondaryLinks = [
		{
			id: "documents",
			label: t("finance.documents.title"),
			href: `${basePath}/documents`,
			icon: FolderOpen,
		},
		{
			id: "clients",
			label: t("finance.clients.title"),
			href: `${basePath}/clients`,
			icon: Users,
		},
		{
			id: "templates",
			label: t("finance.templates.title"),
			href: `${basePath}/templates`,
			icon: LayoutTemplate,
		},
		{
			id: "reports",
			label: t("finance.reports.title"),
			href: `${basePath}/reports`,
			icon: BarChart3,
		},
		{
			id: "banks",
			label: t("finance.banks.title"),
			href: `${basePath}/banks`,
			icon: Building,
		},
		{
			id: "settings",
			label: t("finance.dashboard.nav.settings"),
			href: `${basePath}/settings`,
			icon: Settings,
		},
	];

	const isActiveLink = (href: string) => {
		return pathname.startsWith(href);
	};

	return (
		<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg shadow-black/5">
			<div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
				{secondaryLinks.map((link) => {
					const Icon = link.icon;
					const isActive = isActiveLink(link.href);
					return (
						<Link
							key={link.id}
							href={link.href}
							className={cn(
								"flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
								isActive
									? "bg-primary/10 text-primary font-medium"
									: "text-muted-foreground hover:bg-muted hover:text-foreground"
							)}
						>
							<Icon className="h-4 w-4" />
							<span>{link.label}</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
