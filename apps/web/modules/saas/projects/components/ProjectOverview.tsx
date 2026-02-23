"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useProjectRole } from "../hooks/use-project-role";
import { FinanceSummary } from "./finance/FinanceSummary";
import { ExpenseCategoryChart } from "./finance/ExpenseCategoryChart";
import { QuickActions } from "./overview/QuickActions";
import { ProjectStatusChart } from "./overview/ProjectStatusChart";
import { ProjectTimelineChart } from "./overview/ProjectTimelineChart";
import { ActivityPulseCard } from "./overview/ActivityPulseCard";
import { RecentActivitiesCard } from "./overview/RecentActivitiesCard";
import { QuickDocumentsCard } from "./overview/QuickDocumentsCard";

interface ProjectOverviewProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function ProjectOverview({
	organizationId,
	organizationSlug,
	projectId,
}: ProjectOverviewProps) {
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const { canViewSection, projectData } = useProjectRole();
	const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

	// Fetch finance summary
	const { data: financeSummary, isLoading: summaryLoading } = useQuery(
		orpc.projectFinance.getSummary.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	// Fetch expense categories for donut chart
	const { data: categoryData } = useQuery(
		orpc.projectFinance.getExpensesByCategory.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	if (summaryLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="h-16 w-16 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Summary Cards - same as finance page */}
			{canViewSection("finance") && (
				<>
					<FinanceSummary
						contractValue={financeSummary?.contractValue ?? 0}
						actualExpenses={financeSummary?.actualExpenses ?? 0}
						totalPayments={financeSummary?.totalPayments ?? 0}
						remaining={financeSummary?.remaining ?? 0}
						claimsPaid={financeSummary?.claimsPaid ?? 0}
						adjustedContractValue={financeSummary?.adjustedContractValue}
						changeOrdersImpact={financeSummary?.changeOrdersImpact}
					/>
					<hr className="my-4 border-slate-200 dark:border-slate-700" />
				</>
			)}

			{/* Project Status Chart - Same design as Finance page CashFlowCard */}
			{canViewSection("finance") && (
				<ProjectStatusChart
					projectProgress={projectData?.progress}
				/>
			)}

			{/* Quick Actions */}
			<QuickActions basePath={basePath} />

			{/* Timeline Chart - full width when field */}
			{canViewSection("field") && (
				<ProjectTimelineChart projectProgress={0} />
			)}

			{/* Expenses + Documents - side by side */}
			{(canViewSection("finance") || canViewSection("documents")) && (
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					{canViewSection("finance") && (
						<ExpenseCategoryChart
							data={categoryData ?? []}
							selectedCategory={selectedCategory}
							onCategoryClick={setSelectedCategory}
						/>
					)}
					{canViewSection("documents") && (
						<QuickDocumentsCard
							organizationId={organizationId}
							projectId={projectId}
							basePath={basePath}
						/>
					)}
				</div>
			)}

			{/* Bottom Cards Row */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{canViewSection("field") && <ActivityPulseCard />}
				{canViewSection("field") && (
					<RecentActivitiesCard
						organizationId={organizationId}
						projectId={projectId}
						basePath={basePath}
					/>
				)}
			</div>
		</div>
	);
}
