"use client";

import {
	Receipt,
	LayoutTemplate,
	Users,
	BarChart3,
	Settings,
	Plus,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface FinanceMainNavProps {
	organizationSlug: string;
}

interface NavSection {
	id: string;
	icon: React.ComponentType<{ className?: string }>;
	browsePath: string;
	createPath?: string;
	iconColor: string;
	bgColor: string;
	hoverBg: string;
	borderColor: string;
}

export function FinanceMainNav({ organizationSlug }: FinanceMainNavProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/finance`;

	const sections: NavSection[] = [
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
			id: "templates",
			icon: LayoutTemplate,
			browsePath: `${basePath}/templates`,
			createPath: `${basePath}/templates/new`,
			iconColor: "text-violet-500 dark:text-violet-400",
			bgColor: "bg-violet-50/80 dark:bg-violet-950/30",
			hoverBg: "hover:bg-violet-100 dark:hover:bg-violet-900/50",
			borderColor: "border-violet-200/50 dark:border-violet-800/50",
		},
		{
			id: "clients",
			icon: Users,
			browsePath: `${basePath}/clients`,
			createPath: `${basePath}/clients/new`,
			iconColor: "text-amber-500 dark:text-amber-400",
			bgColor: "bg-amber-50/80 dark:bg-amber-950/30",
			hoverBg: "hover:bg-amber-100 dark:hover:bg-amber-900/50",
			borderColor: "border-amber-200/50 dark:border-amber-800/50",
		},
		{
			id: "reports",
			icon: BarChart3,
			browsePath: `${basePath}/reports`,
			createPath: `${basePath}/reports/new`,
			iconColor: "text-indigo-500 dark:text-indigo-400",
			bgColor: "bg-indigo-50/80 dark:bg-indigo-950/30",
			hoverBg: "hover:bg-indigo-100 dark:hover:bg-indigo-900/50",
			borderColor: "border-indigo-200/50 dark:border-indigo-800/50",
		},
		{
			id: "settings",
			icon: Settings,
			browsePath: `${basePath}/settings`,
			iconColor: "text-slate-500 dark:text-slate-400",
			bgColor: "bg-slate-50/80 dark:bg-slate-800/50",
			hoverBg: "hover:bg-slate-100 dark:hover:bg-slate-700/50",
			borderColor: "border-slate-200/50 dark:border-slate-700/50",
		},
	];

	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
			{sections.map((section) => {
				const Icon = section.icon;
				return (
					<div
						key={section.id}
						className={`backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden transition-all duration-300 hover:shadow-xl`}
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
						{section.createPath ? (
							<Link
								href={section.createPath}
								className={`flex items-center justify-center gap-2 p-3 bg-white/50 dark:bg-slate-800/30 hover:bg-white/80 dark:hover:bg-slate-800/50 transition-colors`}
							>
								<Plus className={`h-4 w-4 ${section.iconColor}`} />
								<span className={`text-xs font-medium ${section.iconColor}`}>
									{t(`finance.dashboard.nav.${section.id}New`)}
								</span>
							</Link>
						) : (
							<div className="h-[44px] bg-white/30 dark:bg-slate-800/20" />
						)}
					</div>
				);
			})}
		</div>
	);
}
