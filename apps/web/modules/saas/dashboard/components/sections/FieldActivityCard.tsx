"use client";

import {
	AlertTriangle,
	CalendarClock,
	Camera,
	CircleCheck,
	Clock,
	MapPin,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface FieldActivity {
	siteUpdates: {
		updatedTodayCount: number;
		newPhotos: number;
		newReports: number;
		stalest: { projectName: string; days: number } | null;
	};
	issues: {
		openCount: number;
		highPriorityCount: number;
		avgResolutionDays: number | null;
	};
}

/**
 * Botly-style field-activity widget (replaces the old average-progress card):
 * real site-update signals (projects touched today, new media, stalest site)
 * on top + open-issue counters below, split by the same 2px Stroke divider as
 * AttentionCard. Data comes from getFieldActivitySummary via dashboard.getAll.
 */
export function FieldActivityCard({
	fieldActivity,
	organizationSlug,
}: {
	fieldActivity: FieldActivity | null;
	organizationSlug: string;
}) {
	const t = useTranslations();

	const site = fieldActivity?.siteUpdates ?? {
		updatedTodayCount: 0,
		newPhotos: 0,
		newReports: 0,
		stalest: null,
	};
	const issues = fieldActivity?.issues ?? {
		openCount: 0,
		highPriorityCount: 0,
		avgResolutionDays: null,
	};

	const projectsHref = `/app/${organizationSlug}/projects`;

	const mediaLine =
		site.newPhotos > 0 && site.newReports > 0
			? t("dashboard.fieldActivity.newMedia", {
					photos: site.newPhotos,
					reports: site.newReports,
				})
			: site.newPhotos > 0
				? t("dashboard.fieldActivity.newMediaPhotosOnly", {
						photos: site.newPhotos,
					})
				: site.newReports > 0
					? t("dashboard.fieldActivity.newMediaReportsOnly", {
							reports: site.newReports,
						})
					: t("dashboard.fieldActivity.noNewMedia");

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border-2 bg-card p-5">
			<p className="shrink-0 text-base font-semibold text-card-foreground">
				{t("dashboard.fieldActivity.title")}
			</p>

			{/* Site updates */}
			<Link
				href={projectsHref}
				className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto"
			>
				<p className="text-sm font-semibold text-muted-foreground">
					{t("dashboard.fieldActivity.siteUpdates")}
				</p>

				<div className="flex items-center gap-2.5">
					<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-chart-1/25 text-foreground">
						<MapPin className="size-4" />
					</span>
					<span className="min-w-0 flex-1 truncate text-sm text-card-foreground">
						{site.updatedTodayCount > 0
							? t("dashboard.fieldActivity.updatedToday", {
									count: site.updatedTodayCount,
								})
							: t("dashboard.fieldActivity.noneToday")}
					</span>
				</div>

				<div className="flex items-center gap-2.5">
					<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-chart-4/15 text-chart-4">
						<Camera className="size-4" />
					</span>
					<span className="min-w-0 flex-1 truncate text-sm text-card-foreground">
						{mediaLine}
					</span>
				</div>

				<div className="flex items-center gap-2.5">
					{site.stalest ? (
						<>
							<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-chart-3/20 text-chart-3">
								<CalendarClock className="size-4" />
							</span>
							<span className="min-w-0 flex-1 truncate text-sm text-card-foreground">
								{t("dashboard.fieldActivity.stale", {
									name: site.stalest.projectName,
									days: site.stalest.days,
								})}
							</span>
						</>
					) : (
						<>
							<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
								<CircleCheck className="size-4" />
							</span>
							<span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
								{t("dashboard.fieldActivity.allFresh")}
							</span>
						</>
					)}
				</div>
			</Link>

			{/* Open issues */}
			<Link href={projectsHref} className="mt-3 shrink-0 border-t-2 pt-3">
				<div className="flex items-baseline justify-between gap-2">
					<p className="text-sm font-semibold text-muted-foreground">
						{t("dashboard.fieldActivity.openIssues")}
					</p>
					<p className="shrink-0 text-2xl font-bold tabular-nums text-card-foreground">
						{issues.openCount}
					</p>
				</div>

				<div className="mt-2 space-y-1.5">
					{issues.openCount === 0 ? (
						<div className="flex items-center gap-2.5">
							<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
								<CircleCheck className="size-3.5" />
							</span>
							<span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
								{t("dashboard.fieldActivity.noOpenIssues")}
							</span>
						</div>
					) : (
						<>
							{issues.highPriorityCount > 0 && (
								<div className="flex items-center gap-2.5">
									<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
										<AlertTriangle className="size-3.5" />
									</span>
									<span className="min-w-0 flex-1 truncate text-xs font-medium text-card-foreground">
										{t("dashboard.fieldActivity.highPriority", {
											count: issues.highPriorityCount,
										})}
									</span>
								</div>
							)}
							{issues.avgResolutionDays !== null && (
								<div className="flex items-center gap-2.5">
									<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-chart-1/25 text-foreground">
										<Clock className="size-3.5" />
									</span>
									<span className="min-w-0 flex-1 truncate text-xs text-card-foreground">
										{t("dashboard.fieldActivity.avgResolution", {
											days: issues.avgResolutionDays,
										})}
									</span>
								</div>
							)}
						</>
					)}
				</div>
			</Link>
		</div>
	);
}
