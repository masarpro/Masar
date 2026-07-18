"use client";

import { CompactStatGrid } from "@saas/shared/components/mobile/CompactStatGrid";
import { MinimalSkeleton } from "@saas/shared/components/skeletons";
import { formatDate } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { GlassStatCard } from "@ui/components/glass-stat-card";
import {
	CalendarDays,
	ChevronLeft,
	FileText,
	HardHat,
	Plus,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DailyReportCard } from "./DailyReportCard";

const PAGE_SIZE = 10;

interface DailyReportsHubProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function DailyReportsHub({
	organizationId,
	organizationSlug,
	projectId,
}: DailyReportsHubProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const [limit, setLimit] = useState(PAGE_SIZE);

	const { data: stats, isLoading: statsLoading } = useQuery(
		orpc.projectField.getDailyReportStats.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	const { data: reportsData, isLoading: reportsLoading } = useQuery(
		orpc.projectField.listDailyReports.queryOptions({
			input: { organizationId, projectId, limit },
		}),
	);

	const reports = reportsData?.reports ?? [];
	const total = reportsData?.total ?? 0;

	const statItems = [
		{
			label: t("projects.field.totalReports"),
			value: stats?.totalReports ?? 0,
			icon: FileText,
			iconClassName: "text-chart-4",
			iconBgClassName: "bg-chart-4/15",
		},
		{
			label: t("projects.field.monthReports"),
			value: stats?.monthReports ?? 0,
			icon: CalendarDays,
			iconClassName: "text-success",
			iconBgClassName: "bg-success/15",
		},
		{
			label: t("projects.field.avgManpower"),
			value: stats?.avgManpowerThisMonth ?? 0,
			icon: HardHat,
			iconClassName: "text-chart-1",
			iconBgClassName: "bg-chart-1/20",
		},
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						asChild
						className="shrink-0 rounded-xl hover:bg-accent"
					>
						<Link href={basePath}>
							<ChevronLeft className="h-5 w-5" />
						</Link>
					</Button>
					<div>
						<h1 className="text-2xl font-semibold text-foreground">
							{t("projects.field.reportsTitle")}
						</h1>
						<p className="text-sm text-muted-foreground">
							{t("projects.field.reportsSubtitle")}
						</p>
					</div>
				</div>
				<Button asChild className="rounded-xl">
					<Link href={`${basePath}/reports/new`}>
						<Plus className="me-2 h-4 w-4" />
						{t("projects.commandCenter.newReport")}
					</Link>
				</Button>
			</div>

			{/* Stats — compact on mobile, 3 cards on desktop */}
			<CompactStatGrid className="sm:hidden" items={statItems} />
			<div className="hidden gap-3 sm:grid sm:grid-cols-3">
				<GlassStatCard
					colorScheme="blue"
					icon={<FileText className="h-5 w-5" />}
					title={t("projects.field.totalReports")}
					value={statsLoading ? "…" : (stats?.totalReports ?? 0)}
					subtitle={
						stats?.lastReportDate
							? `${t("projects.field.lastReport")}: ${formatDate(stats.lastReportDate)}`
							: undefined
					}
				/>
				<GlassStatCard
					colorScheme="green"
					icon={<CalendarDays className="h-5 w-5" />}
					title={t("projects.field.monthReports")}
					value={statsLoading ? "…" : (stats?.monthReports ?? 0)}
				/>
				<GlassStatCard
					colorScheme="orange"
					icon={<HardHat className="h-5 w-5" />}
					title={t("projects.field.avgManpower")}
					value={statsLoading ? "…" : (stats?.avgManpowerThisMonth ?? 0)}
					subtitle={t("projects.field.avgManpowerHint")}
				/>
			</div>

			{/* Latest reports */}
			<div className="space-y-4">
				<h2 className="text-lg font-semibold text-foreground">
					{t("projects.field.latestReports")}
				</h2>

				{reportsLoading ? (
					<MinimalSkeleton />
				) : reports.length === 0 ? (
					<div className="rounded-2xl border-2 border-dashed bg-card p-8 text-center">
						<FileText className="mx-auto h-12 w-12 text-muted-foreground" />
						<p className="mt-4 text-lg font-medium text-muted-foreground">
							{t("projects.field.noReports")}
						</p>
						<p className="mt-2 text-sm text-muted-foreground">
							{t("projects.field.noReportsHint")}
						</p>
						<Button asChild className="mt-4 rounded-xl">
							<Link href={`${basePath}/reports/new`}>
								<Plus className="me-2 h-4 w-4" />
								{t("projects.commandCenter.newReport")}
							</Link>
						</Button>
					</div>
				) : (
					<>
						<div className="space-y-4">
							{reports.map((report: Record<string, unknown>) => (
								<DailyReportCard
									key={report.id as string}
									report={report}
								/>
							))}
						</div>
						{reports.length < total && (
							<div className="flex justify-center">
								<Button
									variant="outline"
									className="rounded-xl"
									onClick={() => setLimit((prev) => prev + PAGE_SIZE)}
								>
									{t("projects.field.showMoreReports")}
								</Button>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
