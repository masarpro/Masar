"use client";

import {
	CalendarClock,
	Camera,
	CircleCheck,
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
}

/**
 * Botly-style field-activity widget (replaces the old average-progress card):
 * real site-update signals — projects touched today (headline), new media this
 * week, and the stalest active site. Data comes from getFieldActivitySummary
 * via dashboard.getAll.
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
		<Link
			href={projectsHref}
			className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border-2 bg-card p-5 transition-colors hover:border-primary/20"
		>
			<div className="flex shrink-0 items-baseline justify-between gap-2">
				<p className="truncate text-base font-semibold text-card-foreground">
					{t("dashboard.fieldActivity.title")}
				</p>
				<p className="shrink-0 text-2xl font-bold tabular-nums text-card-foreground">
					{site.updatedTodayCount}
				</p>
			</div>
			<p className="shrink-0 text-sm font-medium text-muted-foreground">
				{t("dashboard.fieldActivity.siteUpdates")}
			</p>

			<div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
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
							<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success dark:text-success">
								<CircleCheck className="size-4" />
							</span>
							<span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
								{t("dashboard.fieldActivity.allFresh")}
							</span>
						</>
					)}
				</div>
			</div>
		</Link>
	);
}
