"use client";

import { FileText, Camera, Receipt, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useProjectRole } from "../../hooks/use-project-role";
import { AddExpenseDialog } from "@saas/finance/components/expenses/AddExpenseDialog";

interface QuickActionsProps {
	basePath: string;
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function QuickActions({
	basePath,
	organizationId,
	organizationSlug,
	projectId,
}: QuickActionsProps) {
	const t = useTranslations();
	const { canViewSection } = useProjectRole();
	const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);

	const actions = [
		{
			id: "daily-report",
			icon: FileText,
			label: t("projects.commandCenter.dailyReport"),
			href: `${basePath}/execution/new-report`,
			section: "execution",
			bgColor: "bg-card",
			iconBg: "bg-chart-4/15",
			iconColor: "text-chart-4",
			textColor: "text-card-foreground",
		},
		{
			id: "upload-photo",
			icon: Camera,
			label: t("projects.commandCenter.uploadPhoto"),
			href: `${basePath}/execution/upload`,
			section: "execution",
			bgColor: "bg-card",
			iconBg: "bg-chart-3/15",
			iconColor: "text-chart-3",
			textColor: "text-card-foreground",
		},
		{
			id: "add-expense",
			icon: Receipt,
			label: t("projects.commandCenter.addExpense"),
			href: null,
			onClick: () => setExpenseDialogOpen(true),
			section: "finance",
			bgColor: "bg-card",
			iconBg: "bg-chart-5/15",
			iconColor: "text-chart-5",
			textColor: "text-card-foreground",
		},
		{
			id: "report-issue",
			icon: AlertTriangle,
			label: t("projects.commandCenter.reportIssue"),
			href: `${basePath}/execution/new-issue`,
			section: "execution",
			bgColor: "bg-card",
			iconBg: "bg-chart-1/15",
			iconColor: "text-chart-1",
			textColor: "text-card-foreground",
		},
	].filter((a) => canViewSection(a.section));

	if (actions.length === 0) return null;

	return (
		<>
			<div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
				{actions.map((action) => {
					const Icon = action.icon;
					const className = `flex min-w-0 flex-1 rounded-2xl border-2 transition-colors hover:bg-accent ${action.bgColor} p-4`;
					const content = (
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
					);
					if (action.onClick) {
						return (
							<button
								key={action.id}
								type="button"
								onClick={action.onClick}
								className={`${className} text-start`}
							>
								{content}
							</button>
						);
					}
					return (
						<Link key={action.id} href={action.href as string} className={className}>
							{content}
						</Link>
					);
				})}
			</div>

			<AddExpenseDialog
				open={expenseDialogOpen}
				onOpenChange={setExpenseDialogOpen}
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</>
	);
}
