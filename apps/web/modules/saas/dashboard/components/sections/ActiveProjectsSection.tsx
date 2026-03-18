"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { EmptyProjectsState } from "../EmptyProjectsState";
import { Badge } from "@ui/components/badge";
import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

function daysRemaining(endDate: Date | string | null): number {
	if (!endDate) return 0;
	const now = new Date();
	const end = new Date(endDate);
	return Math.max(
		0,
		Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
	);
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

	if (projects.length === 0) {
		return (
			<div className="rounded-xl bg-card p-6 shadow-sm">
				<h2 className="mb-4 text-lg font-semibold text-foreground">
					{t("dashboard.activeProjects")}
				</h2>
				<EmptyProjectsState organizationSlug={organizationSlug} />
			</div>
		);
	}

	const COLS = 4;
	const useScroll = projects.length > 4;

	const projectCardBase =
		"rounded-2xl border border-border bg-muted/30 flex flex-row overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-500 group";
	const cardSizeClass = useScroll
		? "h-[88px] w-[340px] min-w-[340px] shrink-0"
		: "h-[88px] min-w-0";

	const renderProjectCard = (project: Project, i: number) => {
		const progress = Math.round(Number(project.progress ?? 0));
		const contractValue = Number(project.contractValue ?? 0);
		const days = daysRemaining(project.endDate);
		const coverImageUrl = project.photos?.[0]?.url;
		return (
			<Link
				key={project.id}
				href={`/app/${organizationSlug}/projects/${project.id}`}
				className={`${projectCardBase} ${cardSizeClass}`}
				style={{ animationDelay: `${160 + i * 70}ms` }}
			>
				{/* Square image */}
				<div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden bg-muted">
					{coverImageUrl ? (
						<Image
							src={coverImageUrl}
							alt={project.name || t("projects.unnamed")}
							fill
							className="object-cover transition-transform duration-300 group-hover:scale-105"
							sizes="88px"
							loading="lazy"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-muted/50">
							<span className="text-2xl font-bold text-muted-foreground/50">
								{(project.name || "?")[0]}
							</span>
						</div>
					)}
					<div
						className="absolute top-0 right-0 left-0 h-[2px]"
						style={{ background: i % 2 === 0 ? "#0ea5e9" : "#3b82f6" }}
					/>
					<div className="absolute start-1 top-1">
						<Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-0 text-[8px] px-1 py-0">
							{t(`projects.status.${project.status}`)}
						</Badge>
					</div>
					<div className="absolute end-1 top-1 rounded-full bg-card/90 px-1.5 py-0.5 text-[9px] font-bold text-foreground">
						{progress}%
					</div>
				</div>
				{/* Info section */}
				<div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 p-2.5">
					<h3 className="wrap-break-word text-sm font-bold text-foreground line-clamp-2">
						{project.name || t("projects.unnamed")}
					</h3>
					<p className="wrap-break-word text-[10px] text-muted-foreground line-clamp-2">
						{project.clientName || "\u2014"}
					</p>
					<div className="mt-2 flex items-center gap-2 text-[9px] text-muted-foreground">
						<span title={t("dashboard.project.contractValue")}>
							<Currency
								amount={contractValue}
								className="text-[10px] font-semibold text-foreground/80"
							/>
						</span>
						<span>&bull;</span>
						<span>
							{days} {t("dashboard.project.daysShort")}
						</span>
					</div>
				</div>
			</Link>
		);
	};

	const newProjectButton = (
		<Link
			href={`/app/${organizationSlug}/projects/new`}
			className={`flex shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-border transition-all duration-300 hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-900/10 ${useScroll ? "h-[88px] w-14" : "h-[88px] w-14"}`}
			title={t("projects.newProject")}
		>
			<Plus className="h-6 w-6 text-muted-foreground" />
		</Link>
	);

	return (
		<div className="rounded-xl bg-card p-6 shadow-sm">
			<h2 className="mb-4 text-lg font-semibold text-foreground">
				{t("dashboard.activeProjects")}
			</h2>
			{useScroll ? (
				<div className="overflow-x-auto pb-2">
					<div className="flex w-max items-stretch gap-3">
						{projects.map((p, i) => renderProjectCard(p, i))}
						{newProjectButton}
					</div>
				</div>
			) : (
				<div
					className="grid w-full gap-3"
					style={{
						gridTemplateColumns: `repeat(${Math.min(projects.length, COLS)}, minmax(0, 1fr)) auto`,
					}}
				>
					{projects.map((p, i) => renderProjectCard(p, i))}
					{newProjectButton}
				</div>
			)}
		</div>
	);
}
