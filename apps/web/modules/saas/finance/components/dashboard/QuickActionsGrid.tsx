"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
	FileText,
	Receipt,
	LayoutTemplate,
	Users,
	BarChart3,
	Settings,
} from "lucide-react";

interface QuickActionsGridProps {
	organizationSlug: string;
}

interface QuickAction {
	id: string;
	icon: React.ComponentType<{ className?: string }>;
	href: string;
	color: string;
	bgColor: string;
}

export function QuickActionsGrid({ organizationSlug }: QuickActionsGridProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/finance`;

	const actions: QuickAction[] = [
		{
			id: "quotation",
			icon: FileText,
			href: `${basePath}/quotations/new`,
			color: "text-blue-600 dark:text-blue-400",
			bgColor: "bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50",
		},
		{
			id: "invoice",
			icon: Receipt,
			href: `${basePath}/invoices/new`,
			color: "text-green-600 dark:text-green-400",
			bgColor: "bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50",
		},
		{
			id: "templates",
			icon: LayoutTemplate,
			href: `${basePath}/templates`,
			color: "text-purple-600 dark:text-purple-400",
			bgColor: "bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50",
		},
		{
			id: "clients",
			icon: Users,
			href: `${basePath}/clients`,
			color: "text-amber-600 dark:text-amber-400",
			bgColor: "bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50",
		},
		{
			id: "reports",
			icon: BarChart3,
			href: `${basePath}/reports`,
			color: "text-teal-600 dark:text-teal-400",
			bgColor: "bg-teal-100 dark:bg-teal-900/30 hover:bg-teal-200 dark:hover:bg-teal-900/50",
		},
		{
			id: "settings",
			icon: Settings,
			href: `${basePath}/settings`,
			color: "text-slate-600 dark:text-slate-400",
			bgColor: "bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800",
		},
	];

	return (
		<div className="space-y-3">
			<h2 className="text-sm font-medium text-muted-foreground">
				{t("finance.dashboard.quickActions")}
			</h2>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
				{actions.map((action) => {
					const Icon = action.icon;
					return (
						<Link
							key={action.id}
							href={action.href}
							className={`group flex flex-col items-center gap-3 rounded-2xl p-4 transition-all duration-200 ${action.bgColor}`}
						>
							<div
								className={`rounded-xl p-3 transition-transform duration-200 group-hover:scale-110 ${action.color}`}
							>
								<Icon className="h-6 w-6" />
							</div>
							<span className="text-xs font-medium text-center text-slate-700 dark:text-slate-300">
								{t(`finance.dashboard.actions.${action.id}`)}
							</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
