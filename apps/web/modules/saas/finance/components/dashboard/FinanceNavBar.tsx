"use client";

import { cn } from "@ui/lib";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
	FileText,
	Receipt,
	FolderOpen,
	LayoutTemplate,
	Users,
	BarChart3,
	Building,
	TrendingDown,
	TrendingUp,
	Settings,
	Plus,
} from "lucide-react";

interface FinanceNavBarProps {
	organizationSlug: string;
}

interface MainSection {
	id: string;
	icon: React.ComponentType<{ className?: string }>;
	browsePath: string;
	createPath: string;
	iconColor: string;
	bgColor: string;
	hoverBg: string;
	borderColor: string;
}

export function FinanceNavBar({ organizationSlug }: FinanceNavBarProps) {
	const t = useTranslations();
	const pathname = usePathname();
	const basePath = `/app/${organizationSlug}/finance`;

	// Main 4 sections with cards (old design)
	const mainSections: MainSection[] = [
		{
			id: "quotations",
			icon: FileText,
			browsePath: `${basePath}/quotations`,
			createPath: `${basePath}/quotations/new`,
			iconColor: "text-blue-500 dark:text-blue-400",
			bgColor: "bg-blue-50/80 dark:bg-blue-950/30",
			hoverBg: "hover:bg-blue-100 dark:hover:bg-blue-900/50",
			borderColor: "border-blue-200/50 dark:border-blue-800/50",
		},
		{
			id: "invoices",
			icon: Receipt,
			browsePath: `${basePath}/invoices`,
			createPath: `${basePath}/invoices/new`,
			iconColor: "text-emerald-500 dark:text-emerald-400",
			bgColor: "bg-emerald-50/80 dark:bg-emerald-950/30",
			hoverBg: "hover:bg-emerald-100 dark:hover:bg-emerald-900/50",
			borderColor: "border-emerald-200/50 dark:border-emerald-800/50",
		},
		{
			id: "expenses",
			icon: TrendingDown,
			browsePath: `${basePath}/expenses`,
			createPath: `${basePath}/expenses/new`,
			iconColor: "text-rose-500 dark:text-rose-400",
			bgColor: "bg-rose-50/80 dark:bg-rose-950/30",
			hoverBg: "hover:bg-rose-100 dark:hover:bg-rose-900/50",
			borderColor: "border-rose-200/50 dark:border-rose-800/50",
		},
		{
			id: "payments",
			icon: TrendingUp,
			browsePath: `${basePath}/payments`,
			createPath: `${basePath}/payments/new`,
			iconColor: "text-teal-500 dark:text-teal-400",
			bgColor: "bg-teal-50/80 dark:bg-teal-950/30",
			hoverBg: "hover:bg-teal-100 dark:hover:bg-teal-900/50",
			borderColor: "border-teal-200/50 dark:border-teal-800/50",
		},
	];

	// Secondary navigation links (at the bottom)
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
		<div className="space-y-6">
			{/* Main Navigation Cards - Old Design */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
				{mainSections.map((section) => {
					const Icon = section.icon;
					return (
						<div
							key={section.id}
							className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden transition-all duration-300 hover:shadow-xl"
						>
							{/* Browse Section (Top) */}
							<Link
								href={section.browsePath}
								className={`flex flex-col items-center gap-2 p-4 ${section.bgColor} ${section.hoverBg} transition-colors border-b ${section.borderColor}`}
							>
								<div
									className={`p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 ${section.iconColor}`}
								>
									<Icon className="h-6 w-6" />
								</div>
								<span className="text-sm font-medium text-slate-700 dark:text-slate-200 text-center">
									{t(`finance.dashboard.nav.${section.id}`)}
								</span>
							</Link>

							{/* Create Section (Bottom) */}
							<Link
								href={section.createPath}
								className="flex items-center justify-center gap-2 p-3 bg-white/50 dark:bg-slate-800/30 hover:bg-white/80 dark:hover:bg-slate-800/50 transition-colors"
							>
								<Plus className={`h-4 w-4 ${section.iconColor}`} />
								<span className={`text-xs font-medium ${section.iconColor}`}>
									{t(`finance.dashboard.nav.${section.id}New`)}
								</span>
							</Link>
						</div>
					);
				})}
			</div>

			{/* Secondary Navigation Links */}
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
		</div>
	);
}
