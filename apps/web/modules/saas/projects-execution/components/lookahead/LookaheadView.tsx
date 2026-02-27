"use client";

import { useMemo, useState } from "react";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { apiClient } from "@shared/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
	addWeeks,
	startOfWeek,
	endOfWeek,
	isSameWeek,
	isWithinInterval,
} from "date-fns";
import { LookaheadWeekGroup } from "./LookaheadWeekGroup";
import { LookaheadSummary } from "./LookaheadSummary";

interface LookaheadViewProps {
	projectId: string;
}

export function LookaheadView({ projectId }: LookaheadViewProps) {
	const t = useTranslations();
	const params = useParams();
	const organizationSlug = params.organizationSlug as string;
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;
	const [weekCount, setWeekCount] = useState("4");

	const { data: lookaheadData, isLoading } = useQuery({
		queryKey: [
			"project-execution-lookahead",
			organizationId,
			projectId,
			weekCount,
		],
		queryFn: async () => {
			if (!organizationId) return null;
			return apiClient.projectExecution.getLookahead({
				organizationId,
				projectId,
				weeks: Number(weekCount),
			});
		},
		enabled: !!organizationId,
	});

	const activities = (lookaheadData as any)?.activities ?? [];
	const now = new Date();

	// Group activities by week
	const weeks = useMemo(() => {
		const count = Number(weekCount);
		const result = [];
		for (let i = 0; i < count; i++) {
			const weekStart = startOfWeek(addWeeks(now, i), { weekStartsOn: 6 });
			const weekEnd = endOfWeek(addWeeks(now, i), { weekStartsOn: 6 });
			const weekActivities = activities.filter((a: any) => {
				const start = a.plannedStart ? new Date(a.plannedStart) : null;
				const end = a.plannedEnd ? new Date(a.plannedEnd) : null;
				const d = end ?? start;
				if (!d) return false;
				return isWithinInterval(d, { start: weekStart, end: weekEnd });
			});
			result.push({
				weekStart,
				weekEnd,
				activities: weekActivities,
				isCurrentWeek: i === 0,
			});
		}
		return result;
	}, [activities, weekCount]);

	// Summary stats
	const totalActivities = activities.length;
	const criticalActivities = activities.filter(
		(a: any) => a.isCritical,
	).length;
	const completedActivities = activities.filter(
		(a: any) => a.status === "COMPLETED",
	).length;
	const delayedActivities = activities.filter(
		(a: any) => a.status === "DELAYED",
	).length;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between gap-4 flex-wrap">
				<div>
					<h2 className="text-lg font-semibold">
						{t("execution.lookahead.title")}
					</h2>
					<p className="text-sm text-muted-foreground">
						{t("execution.lookahead.subtitle")}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Select value={weekCount} onValueChange={setWeekCount}>
						<SelectTrigger className="w-[120px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="2">
								{t("execution.lookahead.weeks2")}
							</SelectItem>
							<SelectItem value="4">
								{t("execution.lookahead.weeks4")}
							</SelectItem>
							<SelectItem value="6">
								{t("execution.lookahead.weeks6")}
							</SelectItem>
						</SelectContent>
					</Select>
					<Button variant="outline" size="sm" asChild>
						<Link
							href={`/app/${organizationSlug}/projects/${projectId}/execution`}
						>
							<ArrowRightIcon className="h-4 w-4 me-1" />
							{t("execution.lookahead.backToExecution")}
						</Link>
					</Button>
				</div>
			</div>

			{/* Summary */}
			<LookaheadSummary
				totalActivities={totalActivities}
				criticalActivities={criticalActivities}
				completedActivities={completedActivities}
				delayedActivities={delayedActivities}
			/>

			{/* Loading */}
			{isLoading ? (
				<div className="space-y-4">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
					))}
				</div>
			) : (
				/* Week groups */
				<div className="space-y-6">
					{weeks.map((week, i) => (
						<LookaheadWeekGroup
							key={i}
							weekStart={week.weekStart}
							weekEnd={week.weekEnd}
							activities={week.activities}
							isCurrentWeek={week.isCurrentWeek}
						/>
					))}
				</div>
			)}
		</div>
	);
}
