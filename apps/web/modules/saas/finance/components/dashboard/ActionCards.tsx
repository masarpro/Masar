"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
	FileText,
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

	// Main 4 sections with cards
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

	return (
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
	);
}
