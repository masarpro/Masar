"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

const ProjectsDonutChart = dynamic(() => import("./ProjectsDonutChart"), {
	ssr: false,
	loading: () => <div className="size-28 rounded-full bg-muted" />,
});

/**
 * Botly Audiences widget (Figma 69:3173 + Dashboard/Light 120:11546):
 * white 32px card, title, donut + huge percentage, legend rows with
 * rounded color squares. Mapped to Masar project-status distribution.
 */
export function ProjectsDonutCard({
	activeProjects,
	completedProjects,
	onHoldProjects,
}: {
	activeProjects: number;
	completedProjects: number;
	onHoldProjects: number;
}) {
	const t = useTranslations();
	const total = activeProjects + completedProjects + onHoldProjects;
	const activePct = total > 0 ? Math.round((activeProjects / total) * 100) : 0;

	const segments = [
		{
			name: t("dashboard.operational.activeProjects"),
			value: activeProjects,
			color: "var(--chart-4)",
		},
		{
			name: t("dashboard.operational.completedProjects"),
			value: completedProjects,
			color: "var(--chart-3)",
		},
		{
			name: t("dashboard.operational.onHoldProjects"),
			value: onHoldProjects,
			color: "var(--chart-1)",
		},
	].filter((s) => s.value > 0);

	return (
		<div className="flex flex-col gap-4 rounded-[var(--botly-radius-card)] border-2 bg-card p-6">
			<p className="text-xl font-semibold leading-6 text-card-foreground">
				{t("dashboard.operational.title")}
			</p>
			<div className="flex items-center gap-5">
				<div className="size-28 shrink-0">
					{total > 0 ? (
						<ProjectsDonutChart data={segments} />
					) : (
						<div className="size-28 rounded-full border-[14px] border-muted" />
					)}
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-4xl font-bold tabular-nums text-card-foreground">
						{activePct}%
					</p>
					<div className="mt-2 space-y-1.5">
						{segments.map((s) => (
							<div key={s.name} className="flex items-center gap-2 text-xs">
								<span
									className="size-3 shrink-0 rounded-[4px]"
									style={{ backgroundColor: s.color }}
								/>
								<span className="truncate text-muted-foreground">
									{s.name}
								</span>
								<span className="ms-auto font-semibold tabular-nums text-card-foreground">
									{s.value}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
