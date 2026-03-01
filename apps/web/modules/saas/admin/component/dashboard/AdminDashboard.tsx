"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@ui/components/skeleton";
import {
	AlertTriangleIcon,
	Building2Icon,
	DollarSignIcon,
	TrendingDownIcon,
	UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { MrrChart } from "./MrrChart";
import { NewOrgsChart } from "./NewOrgsChart";
import { PlanDistributionChart } from "./PlanDistributionChart";
import { StatsCard } from "./StatsCard";

export function AdminDashboard() {
	const t = useTranslations();

	const { data: stats, isLoading: statsLoading } = useQuery(
		orpc.superAdmin.dashboard.getStats.queryOptions({ input: undefined }),
	);

	const { data: mrrTrend } = useQuery(
		orpc.superAdmin.dashboard.getMrrTrend.queryOptions({
			input: { months: 6 },
		}),
	);

	const { data: newOrgsTrend } = useQuery(
		orpc.superAdmin.dashboard.getNewOrgsTrend.queryOptions({
			input: { months: 6 },
		}),
	);

	const { data: churnData } = useQuery(
		orpc.superAdmin.dashboard.getChurnRate.queryOptions({
			input: { months: 1 },
		}),
	);

	if (statsLoading) {
		return (
			<div className="space-y-6">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-28 rounded-lg" />
					))}
				</div>
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<Skeleton className="h-80 rounded-lg" />
					<Skeleton className="h-80 rounded-lg" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<h2 className="font-semibold text-2xl">
				{t("admin.dashboard.title")}
			</h2>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<StatsCard
					title={t("admin.dashboard.totalOrgs")}
					value={stats?.totalOrgs ?? 0}
					icon={Building2Icon}
					description={`${stats?.activeOrgs ?? 0} ${t("admin.dashboard.active")}`}
				/>
				<StatsCard
					title={t("admin.dashboard.totalUsers")}
					value={stats?.totalUsers ?? 0}
					icon={UsersIcon}
				/>
				<StatsCard
					title={t("admin.dashboard.mrr")}
					value={`${(churnData ? 0 : 0).toLocaleString()} SAR`}
					icon={DollarSignIcon}
				/>
				<StatsCard
					title={t("admin.dashboard.churnRate")}
					value={`${((churnData?.churnRate ?? 0) * 100).toFixed(1)}%`}
					icon={TrendingDownIcon}
				/>
			</div>

			{(stats?.pastDueOrgs ?? 0) > 0 && (
				<div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400">
					<AlertTriangleIcon className="size-5" />
					<span>
						{t("admin.dashboard.pastDueWarning", {
							count: stats?.pastDueOrgs ?? 0,
						})}
					</span>
				</div>
			)}

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<MrrChart data={mrrTrend ?? []} />
				<PlanDistributionChart
					data={stats?.planDistribution ?? []}
				/>
			</div>

			<NewOrgsChart data={newOrgsTrend ?? []} />
		</div>
	);
}
