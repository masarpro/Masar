"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { Button } from "@ui/components/button";
import {
	BarChart3,
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
import { useState } from "react";
import { useTranslations } from "next-intl";

function daysRemaining(endDate: Date | string | null): number | null {
	if (!endDate) return null;
	const now = new Date();
	const end = new Date(endDate);
	return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

interface Project {
	id: string;
	name: string | null;
	status: string;
	progress: number | string | null;
	contractValue: number | string | { toString(): string } | null;
	endDate: Date | string | null;
	clientName: string | null;
	photos?: { url: string }[];
	coverPhoto?: { url: string } | null;
}

interface ActiveProjectsSectionProps {
	projects: Project[];
	organizationSlug: string;
}

/**
 * Botly Earnings table (Figma 71:4242 / 71:4085 Bot row): white 32px card,
 * gray small column labels, rows separated by 2px Stroke borders — avatar
 * chip + name/sub, semibold value, yellow progress bar, trailing figure.
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
		<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border-2 bg-card p-5">
			{/* Header */}
			<div className="flex shrink-0 items-center justify-between">
				<p className="text-base font-semibold text-card-foreground">
					{t("dashboard.activeProjects")}
				</p>
				<Link
					href={`/app/${organizationSlug}/projects`}
					className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
				>
					{t("dashboard.viewAll")}
					<ChevronLeft className="h-3 w-3 rtl-flip" />
				</Link>
			</div>

			{/* Column labels (Botly table title row) */}
			<div className="mt-3 hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.4fr)] gap-3 border-b-2 pb-2 text-sm font-medium text-muted-foreground sm:grid">
				<span>{t("dashboard.activeProjects")}</span>
				<span>{t("projects.contractBar.contractValue")}</span>
				<span>{t("projects.overview.progress")}</span>
			</div>

			{/* Rows */}
			<div className="min-h-0 flex-1 overflow-y-auto">
				{visibleProjects.map((project) => {
					const progress = Math.round(Number(project.progress ?? 0));
					const contractValue = Number(project.contractValue ?? 0);
					const days = daysRemaining(project.endDate);

					return (
						<Link
							key={project.id}
							href={`/app/${organizationSlug}/projects/${project.id}`}
							className="group grid grid-cols-1 items-center gap-3 border-b-2 py-3 transition-colors last:border-0 hover:bg-accent/40 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.4fr)]"
						>
							{/* Project: avatar chip + name/client */}
							<div className="flex min-w-0 items-center gap-3">
								<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-chart-4/15 xl:h-11 xl:w-11">
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
									<p className="truncate text-base font-semibold text-card-foreground">
										{project.name || t("projects.unnamed")}
									</p>
									<p className="truncate text-sm font-medium text-muted-foreground">
										{project.clientName || t("dashboard.noClient")}
									</p>
								</div>
							</div>

							{/* Contract value */}
							<p className="truncate text-base font-semibold tabular-nums text-card-foreground">
								<Currency amount={contractValue} />
							</p>

							{/* Progress bar + trailing figure */}
							<div className="flex items-center gap-3">
								<div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-[4px] bg-muted">
									<div
										className="h-full rounded-[4px] bg-chart-1"
										style={{ width: `${Math.min(progress, 100)}%` }}
									/>
								</div>
								<p className="shrink-0 text-base font-semibold tabular-nums text-card-foreground">
									{progress}
									<span className="text-muted-foreground">%</span>
								</p>
								{days !== null && days > 0 && (
									<p className="hidden shrink-0 text-xs text-muted-foreground lg:block">
										{days} {t("dashboard.alerts.daysRemaining")}
									</p>
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
				<FolderOpen className="h-5 w-5 text-chart-4" />
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
