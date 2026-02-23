"use client";

import { FileText, Camera, Receipt, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useProjectRole } from "../../hooks/use-project-role";

interface QuickActionsProps {
	basePath: string;
}

export function QuickActions({ basePath }: QuickActionsProps) {
	const t = useTranslations();
	const { canViewSection } = useProjectRole();

	const actions = [
		{
			id: "daily-report",
			icon: FileText,
			label: t("projects.commandCenter.dailyReport"),
			href: `${basePath}/execution/new-report`,
			section: "execution",
			bgColor: "bg-blue-50 dark:bg-blue-950/30",
			iconBg: "bg-blue-100 dark:bg-blue-900/50",
			iconColor: "text-blue-600 dark:text-blue-400",
			textColor: "text-blue-700 dark:text-blue-300",
		},
		{
			id: "upload-photo",
			icon: Camera,
			label: t("projects.commandCenter.uploadPhoto"),
			href: `${basePath}/execution/upload`,
			section: "execution",
			bgColor: "bg-purple-50 dark:bg-purple-950/30",
			iconBg: "bg-purple-100 dark:bg-purple-900/50",
			iconColor: "text-purple-600 dark:text-purple-400",
			textColor: "text-purple-700 dark:text-purple-300",
		},
		{
			id: "add-expense",
			icon: Receipt,
			label: t("projects.commandCenter.addExpense"),
			href: `${basePath}/finance/expenses/new`,
			section: "finance",
			bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
			iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
			iconColor: "text-emerald-600 dark:text-emerald-400",
			textColor: "text-emerald-700 dark:text-emerald-300",
		},
		{
			id: "report-issue",
			icon: AlertTriangle,
			label: t("projects.commandCenter.reportIssue"),
			href: `${basePath}/execution/new-issue`,
			section: "execution",
			bgColor: "bg-amber-50 dark:bg-amber-950/30",
			iconBg: "bg-amber-100 dark:bg-amber-900/50",
			iconColor: "text-amber-600 dark:text-amber-400",
			textColor: "text-amber-700 dark:text-amber-300",
		},
	].filter((a) => canViewSection(a.section));

	if (actions.length === 0) return null;

	return (
		<div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
			{actions.map((action) => {
				const Icon = action.icon;
				return (
					<Link
						key={action.id}
						href={action.href}
						className={`flex min-w-0 flex-1 rounded-2xl border border-slate-200/60 shadow-lg shadow-black/5 transition-all hover:shadow-xl dark:border-slate-700/50 ${action.bgColor} p-4`}
					>
						<div className="flex min-w-0 items-center gap-3">
							<div className={`shrink-0 rounded-xl ${action.iconBg} p-2.5`}>
								<Icon className={`h-5 w-5 shrink-0 ${action.iconColor}`} />
							</div>
							<span
								className={`truncate text-sm font-semibold ${action.textColor}`}
							>
								{action.label}
							</span>
						</div>
					</Link>
				);
			})}
		</div>
	);
}
