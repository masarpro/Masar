"use client";

import {
	AlertTriangle,
	Bell,
	ChevronLeft,
	Clock,
	Receipt,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const glassCard =
	"backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5";

interface Activity {
	type: "change_order" | "claim" | "issue";
	id: string;
	title: string;
	createdAt: Date | string;
	createdBy: { id: string; name: string };
	project: { id: string; name: string };
	metadata?: Record<string, unknown>;
}

interface Milestone {
	id: string;
	title: string;
	plannedEnd: Date | string | null;
	status: string;
	progress: number | { toString(): string };
	project: { id: string; name: string };
}

interface RecentActivitySectionProps {
	activities: Activity[];
	upcomingMilestones: Milestone[];
	organizationSlug: string;
}

function formatDate(date: Date | string): string {
	return new Date(date).toLocaleDateString("ar-SA", {
		month: "short",
		day: "numeric",
	});
}

function formatRelativeTime(date: Date | string): string {
	const now = new Date();
	const d = new Date(date);
	const diffMs = now.getTime() - d.getTime();
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffHours < 1) return "\u0627\u0644\u0622\u0646";
	if (diffHours < 24) return `\u0645\u0646\u0630 ${diffHours} \u0633\u0627\u0639\u0629`;
	if (diffDays === 1) return "\u0623\u0645\u0633";
	return `\u0645\u0646\u0630 ${diffDays} \u064a\u0648\u0645`;
}

export function RecentActivitySection({
	activities,
	upcomingMilestones,
	organizationSlug,
}: RecentActivitySectionProps) {
	const t = useTranslations();

	return (
		<div
			className={`${glassCard} flex h-full min-h-[240px] flex-col p-4 animate-in fade-in slide-in-from-bottom-3 duration-500`}
			style={{ animationDelay: "580ms" }}
		>
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-1.5">
					<Bell className="h-3.5 w-3.5 text-muted-foreground" />
					<span className="text-[11px] font-semibold text-muted-foreground">
						{t("dashboard.recentActivity.title")}
					</span>
				</div>
				<Link
					href={`/app/${organizationSlug}/projects`}
					className="flex items-center gap-1 text-[10px] text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 px-2 py-1 rounded-md hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors"
				>
					<span>{t("dashboard.viewAll")}</span>
					<ChevronLeft className="h-3 w-3" />
				</Link>
			</div>

			{/* Activities List */}
			<div className="flex-1 space-y-1 overflow-hidden">
				{activities && activities.length > 0 ? (
					activities.slice(0, 4).map((activity, idx) => {
						const iconConfig = {
							change_order: {
								bg: "bg-amber-50 dark:bg-amber-900/20",
								color: "text-amber-500",
								icon: TrendingUp,
							},
							claim: {
								bg: "bg-sky-50 dark:bg-sky-900/20",
								color: "text-sky-500",
								icon: Receipt,
							},
							issue: {
								bg: "bg-red-50 dark:bg-red-900/20",
								color: "text-red-500",
								icon: AlertTriangle,
							},
						};
						const config = iconConfig[activity.type] ?? iconConfig.issue;
						const ActivityIcon = config.icon;
						return (
							<div
								key={`${activity.type}-${activity.id}-${idx}`}
								className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0 animate-in fade-in slide-in-from-right-2 duration-300"
								style={{ animationDelay: `${620 + idx * 50}ms` }}
							>
								<div
									className={`w-6 h-6 rounded-md ${config.bg} flex items-center justify-center shrink-0`}
								>
									<ActivityIcon className={`h-3 w-3 ${config.color}`} />
								</div>
								<div className="min-w-0">
									<p className="text-[10px] font-medium text-foreground/80 truncate">
										{activity.title}
									</p>
									<p className="text-[8px] text-muted-foreground">
										{formatRelativeTime(activity.createdAt)}
									</p>
								</div>
							</div>
						);
					})
				) : (
					<p className="text-center text-[11px] text-muted-foreground py-4">
						{t("dashboard.noRecentActivities")}
					</p>
				)}
			</div>

			{/* Upcoming Payments/Milestones */}
			<div className="mt-3 pt-3 border-t border-border/50">
				<div className="flex items-center gap-1.5 mb-2">
					<Clock className="h-3 w-3 text-muted-foreground" />
					<span className="text-[10px] font-semibold text-muted-foreground">
						{t("dashboard.upcomingPayments.title")}
					</span>
				</div>
				{upcomingMilestones && upcomingMilestones.length > 0 ? (
					upcomingMilestones.slice(0, 2).map((m) => (
						<Link
							key={m.id}
							href={`/app/${organizationSlug}/projects/${m.project.id}/execution`}
							className="flex items-center justify-between p-2 rounded-md bg-muted/40 mb-1.5 hover:bg-muted/60 transition-colors"
						>
							<div>
								<p className="text-[10px] font-semibold text-foreground/80">
									{m.project.name}
								</p>
								<p className="text-[8px] text-muted-foreground">
									{m.title} &mdash;{" "}
									{m.plannedEnd ? formatDate(m.plannedEnd) : ""}
								</p>
							</div>
							<span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
								{Number(m.progress)}%
							</span>
						</Link>
					))
				) : (
					<p className="text-center text-[10px] text-muted-foreground py-2">
						{t("dashboard.noUpcomingMilestones")}
					</p>
				)}
			</div>
		</div>
	);
}
