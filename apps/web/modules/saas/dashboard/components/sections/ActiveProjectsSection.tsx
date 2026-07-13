"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { Button } from "@ui/components/button";
import {
	BarChart3,
	ChevronLeft,
	FileText,
	FolderOpen,
	FolderPlus,
	MapPin,
	Plus,
	Receipt,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface Project {
	id: string;
	name: string | null;
	clientName: string | null;
	progress: number | string | null;
	coverPhoto?: { url: string } | null;
	photos?: { url: string }[];
	expensesTotal?: number;
	paymentsTotal?: number;
	currentMilestone?: { title: string; days: number | null } | null;
}

interface ActiveProjectsSectionProps {
	projects: Project[];
	organizationSlug: string;
}

/**
 * Specialised active-project cards (Botly surface): per-project progress taken
 * from the project's execution progress, مدفوعات (expenses) + مقبوضات (payments)
 * instead of contract value, the current milestone with days-on-phase, and the
 * latest published photos as thumbnails on the leading (visual-left) side.
 */
export function ActiveProjectsSection({
	projects,
	organizationSlug,
}: ActiveProjectsSectionProps) {
	const t = useTranslations();

	// Empty state
	if (projects.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-[var(--botly-radius-card)] border-2 bg-card p-6 text-center">
				<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
					<FolderPlus className="h-8 w-8 text-primary" />
				</div>
				<h3 className="mb-2 text-lg font-bold">
					{t("dashboard.addFirstProject")}
				</h3>
				<p className="mb-4 max-w-xs text-sm text-muted-foreground">
					{t("dashboard.addFirstProjectDesc")}
				</p>
				<div className="mb-4 grid w-full max-w-sm grid-cols-2 gap-2">
					{[
						{ icon: BarChart3, label: t("dashboard.feature.tracking"), color: "text-chart-4" },
						{ icon: Receipt, label: t("dashboard.feature.invoicing"), color: "text-success" },
						{ icon: Users, label: t("dashboard.feature.team"), color: "text-chart-2" },
						{ icon: FileText, label: t("dashboard.feature.documents"), color: "text-chart-1" },
					].map((feat, i) => {
						const Icon = feat.icon;
						return (
							<div key={i} className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5 text-start">
								<Icon className={`h-4 w-4 ${feat.color} shrink-0`} />
								<span className="text-xs">{feat.label}</span>
							</div>
						);
					})}
				</div>
				<Button asChild variant="primary" size="md">
					<Link href={`/app/${organizationSlug}/projects/new`}>
						<Plus className="h-4 w-4 me-1" />
						{t("dashboard.createFirstProject")}
					</Link>
				</Button>
			</div>
		);
	}

	const MAX_VISIBLE = 4;
	const visibleProjects = projects.slice(0, MAX_VISIBLE);
	const hasMore = projects.length > MAX_VISIBLE;

	return (
		// Botly Earnings table (71:4242): 32px card, px-8 py-6, 20px title,
		// 14px medium column labels with roomy header/row spacing.
		<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--botly-radius-card)] border-2 bg-card px-8 py-6">
			{/* Header */}
			<div className="flex shrink-0 items-center justify-between">
				<p className="text-base font-semibold text-card-foreground">
					{t("dashboard.activeProjects")}
				</p>
				<Link
					href={`/app/${organizationSlug}/projects`}
					className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
				>
					{t("dashboard.viewAll")}
					<ChevronLeft className="h-3 w-3 rtl-flip" />
				</Link>
			</div>

			{/* Column labels (single-line table title row) */}
			<div className="mt-4 hidden grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)] items-center gap-3 border-b-2 pb-4 text-sm font-medium text-muted-foreground sm:grid">
				<span className="truncate">{t("dashboard.activeProjects")}</span>
				<span className="truncate">{t("projects.overview.progress")}</span>
				<span className="truncate">{t("dashboard.projectCard.paymentsShort")}</span>
				<span className="truncate">{t("dashboard.projectCard.receiptsShort")}</span>
				<span className="truncate text-end">{t("dashboard.projectCard.photos")}</span>
			</div>

			{/* Rows — one project per line */}
			<div className="min-h-0 flex-1 overflow-y-auto">
				{visibleProjects.map((project) => {
					const progress = Math.min(
						Math.round(Number(project.progress ?? 0)),
						100,
					);
					const milestone = project.currentMilestone ?? null;
					const photos = (project.photos ?? []).slice(0, 4);
					const milestoneText = milestone
						? milestone.days !== null
							? `${milestone.title} · ${t("dashboard.projectCard.daysOnPhase", { days: milestone.days })}`
							: milestone.title
						: t("dashboard.projectCard.noPhase");

					return (
						<Link
							key={project.id}
							href={`/app/${organizationSlug}/projects/${project.id}`}
							className="group grid grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)] items-center gap-3 border-b-2 py-3.5 transition-colors last:border-0 hover:bg-accent/40 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]"
						>
							{/* Project: cover + name + milestone·days subline */}
							<div className="flex min-w-0 items-center gap-3">
								<div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-chart-4/15">
									<ProjectThumb
										src={
											project.coverPhoto?.url ??
											project.photos?.[0]?.url ??
											null
										}
										alt={project.name || ""}
									/>
								</div>
								<div className="min-w-0">
									<p className="truncate text-sm font-semibold text-card-foreground">
										{project.name || t("projects.unnamed")}
									</p>
									<p className="flex items-center gap-1 truncate text-xs leading-tight text-muted-foreground">
										<MapPin className="size-3 shrink-0 text-chart-3" />
										<span className="truncate">{milestoneText}</span>
									</p>
								</div>
							</div>

							{/* Progress bar + % */}
							<div className="flex items-center gap-2">
								<div className="h-2 min-w-0 flex-1 overflow-hidden rounded-[4px] bg-muted">
									<div
										className="h-full rounded-[4px] bg-chart-1"
										style={{ width: `${progress}%` }}
									/>
								</div>
								<span className="shrink-0 text-sm font-semibold tabular-nums text-card-foreground">
									{progress}
									<span className="text-muted-foreground">%</span>
								</span>
							</div>

							{/* Payments (out) */}
							<p className="hidden truncate text-xs font-semibold tabular-nums text-destructive sm:block">
								<Currency amount={project.expensesTotal ?? 0} />
							</p>

							{/* Receipts (in) */}
							<p className="hidden truncate text-xs font-semibold tabular-nums text-success sm:block">
								<Currency amount={project.paymentsTotal ?? 0} />
							</p>

							{/* Latest photos — visual-left in RTL */}
							<div className="hidden shrink-0 items-center justify-end gap-1 sm:flex">
								{photos.length > 0 ? (
									photos.map((photo, i) => (
										<div
											key={i}
											className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md bg-muted"
										>
											<ProjectThumb src={photo.url} alt="" />
										</div>
									))
								) : (
									<span className="text-[11px] text-muted-foreground">—</span>
								)}
							</div>
						</Link>
					);
				})}
			</div>

			{hasMore && (
				<Link
					href={`/app/${organizationSlug}/projects`}
					className="mt-2 shrink-0 pt-2 text-center text-xs font-medium text-muted-foreground hover:text-foreground"
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
			<div className="flex h-full w-full items-center justify-center bg-chart-4/15">
				<FolderOpen className="h-4 w-4 text-chart-4" />
			</div>
		);
	}

	return (
		<Image
			src={src}
			alt={alt}
			fill
			className="object-cover"
			sizes="48px"
			unoptimized
			onError={() => setFailed(true)}
		/>
	);
}
