"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatDateShort } from "../../lib/gantt-utils";
import { LookaheadActivityCard } from "./LookaheadActivityCard";

interface LookaheadWeekGroupProps {
	weekStart: Date;
	weekEnd: Date;
	activities: any[];
	isCurrentWeek?: boolean;
}

export function LookaheadWeekGroup({
	weekStart,
	weekEnd,
	activities,
	isCurrentWeek,
}: LookaheadWeekGroupProps) {
	const t = useTranslations();
	const locale = useLocale();

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<h3 className="text-sm font-semibold">
					{formatDateShort(weekStart, locale)} –{" "}
					{formatDateShort(weekEnd, locale)}
				</h3>
				{isCurrentWeek && (
					<span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
						{t("execution.lookahead.thisWeek")}
					</span>
				)}
				<span className="text-xs text-muted-foreground">
					({activities.length})
				</span>
			</div>

			{activities.length === 0 ? (
				<p className="text-sm text-muted-foreground ps-4">
					{t("execution.lookahead.empty")}
				</p>
			) : (
				<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{activities.map((activity) => (
						<LookaheadActivityCard
							key={activity.id}
							activity={activity}
						/>
					))}
				</div>
			)}
		</div>
	);
}
