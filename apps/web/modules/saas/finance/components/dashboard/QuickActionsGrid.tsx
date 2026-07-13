"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
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
			id: "invoice",
			icon: Receipt,
			href: `${basePath}/invoices/new`,
			color: "text-success",
			bgColor: "bg-success/15 hover:bg-success/20",
		},
		{
			id: "templates",
			icon: LayoutTemplate,
			href: `${basePath}/templates`,
			color: "text-chart-4",
			bgColor: "bg-chart-4/15 hover:bg-chart-4/20",
		},
		{
			id: "clients",
			icon: Users,
			href: `${basePath}/clients`,
			color: "text-chart-1",
			bgColor: "bg-chart-1/15 hover:bg-chart-1/20",
		},
		{
			id: "reports",
			icon: BarChart3,
			href: `${basePath}/reports`,
			color: "text-chart-4",
			bgColor: "bg-chart-4/15 hover:bg-chart-4/20",
		},
		{
			id: "settings",
			icon: Settings,
			href: `${basePath}/settings`,
			color: "text-muted-foreground",
			bgColor: "bg-muted hover:bg-accent",
		},
	];

	return (
		<div className="space-y-3">
			<h2 className="text-sm font-medium text-muted-foreground">
				{t("finance.dashboard.quickActions")}
			</h2>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
							<span className="text-xs font-medium text-center text-foreground">
								{t(`finance.dashboard.actions.${action.id}`)}
							</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
