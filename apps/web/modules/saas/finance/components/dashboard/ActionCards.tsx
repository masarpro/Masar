"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
	Receipt,
	TrendingDown,
	TrendingUp,
	Plus,
} from "lucide-react";

interface ActionCardsProps {
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

export function ActionCards({ organizationSlug }: ActionCardsProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/finance`;

	// Main 3 sections with cards
	const mainSections: MainSection[] = [
		{
			id: "invoices",
			icon: Receipt,
			browsePath: `${basePath}/invoices`,
			createPath: `${basePath}/invoices/new`,
			iconColor: "text-sky-500 dark:text-sky-400",
			bgColor: "bg-sky-50/80 dark:bg-sky-950/30",
			hoverBg: "hover:bg-sky-100 dark:hover:bg-sky-900/50",
			borderColor: "border-sky-200/50 dark:border-sky-800/50",
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
			iconColor: "text-sky-500 dark:text-sky-400",
			bgColor: "bg-sky-50/80 dark:bg-sky-950/30",
			hoverBg: "hover:bg-sky-100 dark:hover:bg-sky-900/50",
			borderColor: "border-sky-200/50 dark:border-sky-800/50",
		},
	];

	return (
		<div className="grid grid-cols-3 gap-4">
			{mainSections.map((section) => {
				const Icon = section.icon;
				return (
					<div
						key={section.id}
						className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5 overflow-hidden transition-all duration-300 hover:shadow-xl"
					>
						{/* Browse Section (Top) */}
						<Link
							href={section.browsePath}
							className={`flex flex-col items-center gap-2 p-4 ${section.bgColor} ${section.hoverBg} transition-colors border-b ${section.borderColor}`}
						>
							<div
								className={`p-3 rounded-xl bg-card/60 ${section.iconColor}`}
							>
								<Icon className="h-6 w-6" />
							</div>
							<span className="text-sm font-medium text-foreground/80 text-center">
								{t(`finance.dashboard.nav.${section.id}`)}
							</span>
						</Link>

						{/* Create Section (Bottom) */}
						<Link
							href={section.createPath}
							className="flex items-center justify-center gap-2 p-3 bg-card/50 hover:bg-card/80 transition-colors"
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
	);
}
