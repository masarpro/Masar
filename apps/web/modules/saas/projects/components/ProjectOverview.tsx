"use client";

import { ProjectOverviewSkeleton } from "@saas/shared/components/skeletons";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useProjectRole } from "../hooks/use-project-role";
import { Skeleton } from "@ui/components/skeleton";
import dynamic from "next/dynamic";
import { QuickActions } from "./overview/QuickActions";
import { ExecutionPhasesCard } from "./overview/ExecutionPhasesCard";
import { FinanceBudgetCard } from "./overview/FinanceBudgetCard";
import { RecentActivitiesCard } from "./overview/RecentActivitiesCard";
import { QuickDocumentsCard } from "./overview/QuickDocumentsCard";
import { BOQDashboardCard } from "./boq/boq-dashboard-card";

const ChartSkeleton = () => <Skeleton className="h-[200px] w-full rounded-lg" />;

const ExpenseCategoryChart = dynamic(
	() => import("./finance/ExpenseCategoryChart").then((m) => ({ default: m.ExpenseCategoryChart })),
	{ loading: ChartSkeleton, ssr: false },
);
const ProjectTimelineChart = dynamic(
	() => import("./overview/ProjectTimelineChart").then((m) => ({ default: m.ProjectTimelineChart })),
	{ loading: ChartSkeleton, ssr: false },
);
const TimelineScheduleCard = dynamic(
	() => import("./overview/TimelineScheduleCard").then((m) => ({ default: m.TimelineScheduleCard })),
	{ loading: ChartSkeleton, ssr: false },
);
const ActivityPulseCard = dynamic(
	() => import("./overview/ActivityPulseCard").then((m) => ({ default: m.ActivityPulseCard })),
	{ loading: ChartSkeleton, ssr: false },
);

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
		return <ProjectOverviewSkeleton />;
	}

	return (
		<div className="space-y-6">
			{/* Three Overview Cards: Execution, Finance, Timeline */}
			{canViewSection("finance") && (
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
					<ExecutionPhasesCard
						organizationId={organizationId}
						projectId={projectId}
						projectProgress={projectData?.progress != null ? Number(projectData.progress) : undefined}
						projectStatus={projectData?.status}
					/>
					<FinanceBudgetCard
						contractValue={financeSummary?.contractValue ?? 0}
						actualExpenses={financeSummary?.actualExpenses ?? 0}
						totalPayments={financeSummary?.totalPayments ?? 0}
						remaining={financeSummary?.remaining ?? 0}
						claimsPaid={financeSummary?.claimsPaid ?? 0}
					/>
					<TimelineScheduleCard
						projectProgress={projectData?.progress != null ? Number(projectData.progress) : undefined}
						startDate={projectData?.startDate}
						endDate={projectData?.endDate}
					/>
				</div>
			)}

			{/* Quick Actions */}
			<QuickActions basePath={basePath} />

			{/* BOQ Dashboard Card */}
			{canViewSection("finance") && (
				<BOQDashboardCard
					organizationId={organizationId}
					projectId={projectId}
					basePath={basePath}
				/>
			)}

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
