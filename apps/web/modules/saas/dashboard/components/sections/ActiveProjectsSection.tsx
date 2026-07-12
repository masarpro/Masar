"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { Button } from "@ui/components/button";
import { StatusChip } from "@ui/components/status-chip";
import {
	Banknote,
	BarChart3,
	Calendar,
	ChevronLeft,
	FileText,
	FolderOpen,
	FolderPlus,
	Plus,
	Receipt,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

const glassCard =
	"backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5";

function daysRemaining(endDate: Date | string | null): number | null {
	if (!endDate) return null;
	const now = new Date();
	const end = new Date(endDate);
	if (Number.isNaN(end.getTime())) return null;
	return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

interface Project {
	id: string;
	name: string | null;
	status: string;
	progress: number | string | null;
	contractValue: number | string | { toString(): string } | null;
	endDate: Date | string | null;
	updatedAt?: Date | string | null;
	clientName: string | null;
	photos?: { url: string }[];
	coverPhoto?: { url: string } | null;
}

interface ActiveProjectsSectionProps {
	projects: Project[];
	organizationSlug: string;
}

export function ActiveProjectsSection({
	projects,
	organizationSlug,
}: ActiveProjectsSectionProps) {
	const t = useTranslations();
	const locale = useLocale();

	// Empty state
	if (projects.length === 0) {
		return (
			<div
				className={`${glassCard} flex flex-col items-center justify-center p-4 text-center`}
			>
				<div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
					<FolderPlus className="h-8 w-8 text-primary" />
				</div>
				<h3 className="text-lg font-bold mb-2">
					{t("dashboard.addFirstProject")}
				</h3>
				<p className="text-sm text-muted-foreground mb-4 max-w-xs">
					{t("dashboard.addFirstProjectDesc")}
				</p>
				<div className="grid grid-cols-2 gap-2 mb-4 w-full max-w-sm">
					{[
						{
							icon: BarChart3,
							label: t("dashboard.feature.tracking"),
							color: "text-blue-500",
						},
						{
							icon: Receipt,
							label: t("dashboard.feature.invoicing"),
							color: "text-green-500",
						},
						{
							icon: Users,
							label: t("dashboard.feature.team"),
							color: "text-purple-500",
						},
						{
							icon: FileText,
							label: t("dashboard.feature.documents"),
							color: "text-amber-500",
						},
					].map((feat, i) => {
						const Icon = feat.icon;
						return (
							<div
								key={i}
								className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 text-start"
							>
								<Icon
									className={`h-4 w-4 ${feat.color} shrink-0`}
								/>
								<span className="text-xs">{feat.label}</span>
							</div>
						);
					})}
				</div>
				<Button asChild size="sm">
					<Link href={`/app/${organizationSlug}/projects/new`}>
						<Plus className="h-4 w-4 me-1" />
						{t("dashboard.createFirstProject")}
					</Link>
				</Button>
			</div>
		);
	}

	const MAX_VISIBLE = 3;
	const visibleProjects = projects.slice(0, MAX_VISIBLE);
	const hasMore = projects.length > MAX_VISIBLE;

	const updatedFmt = new Intl.DateTimeFormat(locale, {
		day: "numeric",
		month: "short",
	});

	return (
		<div className={`${glassCard} flex flex-col p-4 overflow-hidden`}>
			{/* Header */}
			<div className="flex items-center justify-between mb-3 shrink-0 -mx-4 -mt-4 px-4 py-2.5 rounded-t-2xl bg-gradient-to-l from-blue-50/70 via-blue-50/40 to-sky-50/60 dark:from-blue-950/30 dark:via-blue-950/20 dark:to-sky-950/25 border-b border-blue-200/30 dark:border-blue-500/15">
				<div className="flex items-center gap-2">
					<div className="p-1.5 rounded-lg bg-blue-500/10">
						<FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
					</div>
					<h2 className="text-sm sm:text-base font-bold text-foreground">
						{t("dashboard.activeProjects")}
					</h2>
					<span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
						{projects.length}
					</span>
				</div>
				<Link
					href={`/app/${organizationSlug}/projects`}
					className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					{t("dashboard.viewAll")}
					<ChevronLeft className="h-3 w-3" />
				</Link>
			</div>

			{/* Project list */}
			<div className="flex-1 overflow-y-auto min-h-0 space-y-1.5">
				{visibleProjects.map((project, i) => {
					const progress = Math.round(Number(project.progress ?? 0));
					const contractValue = Number(project.contractValue ?? 0);
					const days = daysRemaining(project.endDate);

					// حالة مشتقة من البيانات المتوفرة فعلاً (لا افتراضات):
					// متوقف (ON_HOLD) · متأخر (تجاوز تاريخ النهاية دون اكتمال) · قيد التنفيذ
					const isDelayed =
						days !== null && days < 0 && progress < 100;
					const statusLabel =
						project.status === "ON_HOLD"
							? t("dashboard.projectCard.onHold")
							: isDelayed
								? t("dashboard.projectCard.delayed", {
										days: Math.abs(days ?? 0),
									})
								: t("dashboard.projectCard.inProgress");
					const statusTone =
						project.status === "ON_HOLD"
							? ("warning" as const)
							: isDelayed
								? ("danger" as const)
								: ("info" as const);

					const healthBarColor =
						progress >= 70
							? "bg-emerald-500"
							: progress >= 40
								? "bg-amber-500"
								: "bg-red-500";
					const progressHint = `${t("dashboard.projectCard.progressLabel")}: ${progress}%`;

					return (
						<Link
							key={project.id}
							href={`/app/${organizationSlug}/projects/${project.id}`}
							className="group relative flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card/50 hover:bg-card hover:border-border/60 hover:shadow-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							style={{ animationDelay: `${80 + i * 50}ms` }}
						>
							{/* شريط جانبي يعكس نسبة الإنجاز — مشروح عبر Tooltip ونص مرئي */}
							<div
								title={progressHint}
								className={`absolute top-2 bottom-2 start-0 w-1 rounded-full ${healthBarColor}`}
							/>

							{/* Project photo */}
							<div className="relative h-10 w-10 shrink-0 ms-2 rounded-lg overflow-hidden bg-muted/30">
								<ProjectThumb
									src={
										project.coverPhoto?.url ??
										project.photos?.[0]?.url ??
										null
									}
									alt={project.name || ""}
								/>
							</div>

							{/* Info */}
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
										{project.name || t("projects.unnamed")}
									</p>
									<StatusChip
										tone={statusTone}
										className="shrink-0"
									>
										{statusLabel}
									</StatusChip>
								</div>
								{/* Progress bar + نسبة الإنجاز نصاً (لا اعتماد على اللون وحده) */}
								<div className="flex items-center gap-2 mt-1">
									<div
										className="h-1.5 flex-1 bg-muted/30 rounded-full overflow-hidden"
										role="progressbar"
										aria-valuenow={progress}
										aria-valuemin={0}
										aria-valuemax={100}
										aria-label={progressHint}
										title={progressHint}
									>
										<div
											className={`h-full rounded-full transition-all ${healthBarColor}`}
											style={{ width: `${progress}%` }}
										/>
									</div>
									<span
										className={`text-[11px] font-bold shrink-0 tabular-nums ${progress >= 70 ? "text-emerald-700 dark:text-emerald-400" : progress >= 40 ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400"}`}
									>
										{progress}%
									</span>
								</div>

								{/* سطر بيانات واحد لا يلتف: العميل يُقتطع والقيمة والأيام لا تنكسر */}
								<div className="flex min-w-0 items-center gap-2 sm:gap-3 mt-1">
									<span className="min-w-0 flex-1 truncate text-xs text-foreground/70">
										{project.clientName ||
											t("dashboard.noClient")}
									</span>
									<div className="flex shrink-0 items-center gap-1">
										<Banknote className="h-3 w-3 text-emerald-500" />
										<span className="whitespace-nowrap text-xs font-bold text-foreground tabular-nums">
											<Currency amount={contractValue} />
										</span>
									</div>
									{days !== null && days >= 0 && (
										<div className="flex shrink-0 items-center gap-1">
											<Calendar className="h-3 w-3 text-blue-500" />
											<span className="whitespace-nowrap text-xs text-foreground/70">
												{days > 0
													? `${days} ${t("dashboard.alerts.daysRemaining")}`
													: t(
															"dashboard.projectEnded",
														)}
											</span>
										</div>
									)}
									{project.updatedAt && (
										<span className="hidden lg:inline whitespace-nowrap text-xs text-foreground/60">
											{t(
												"dashboard.projectCard.lastUpdate",
												{
													date: updatedFmt.format(
														new Date(
															project.updatedAt,
														),
													),
												},
											)}
										</span>
									)}
								</div>
							</div>

							{/* Arrow */}
							<ChevronLeft className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors" />
						</Link>
					);
				})}
			</div>

			{hasMore && (
				<Link
					href={`/app/${organizationSlug}/projects`}
					className="text-center text-xs text-primary hover:underline mt-2 pt-2 border-t border-border/50 shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					{t("dashboard.viewAll")} ({projects.length})
				</Link>
			)}
		</div>
	);
}

/**
 * صورة المشروع المصغرة مع بديل أنيق عند فشل التحميل
 * (الروابط الموقّعة تنتهي صلاحيتها فتظهر أيقونة مكسورة بدون هذا).
 */
function ProjectThumb({ src, alt }: { src: string | null; alt: string }) {
	const [failed, setFailed] = useState(false);

	if (!src || failed) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/20 to-sky-500/20">
				<FolderOpen className="h-4 w-4 text-blue-400/60" />
			</div>
		);
	}

	return (
		<Image
			src={src}
			alt={alt}
			fill
			className="object-cover"
			sizes="40px"
			unoptimized
			onError={() => setFailed(true)}
		/>
	);
}
