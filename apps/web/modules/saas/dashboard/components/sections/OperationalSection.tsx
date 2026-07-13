"use client";

import {
	AlertTriangle,
	CheckCircle,
	FolderOpen,
	Gauge,
	PauseCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

const glassCard =
	"bg-card border-2 rounded-2xl";

const LEAD_STATUS_COLORS: Record<string, string> = {
	NEW: "#9ca3af",
	STUDYING: "#3b82f6",
	QUOTED: "#f97316",
	NEGOTIATING: "#8b5cf6",
	WON: "#10b981",
	LOST: "#ef4444",
};

const LEAD_STATUS_ORDER = ["NEW", "STUDYING", "QUOTED", "NEGOTIATING", "WON", "LOST"];

interface OperationalSectionProps {
	activeProjects: number;
	completedProjects: number;
	onHoldProjects: number;
	openIssues: number;
	leadsPipeline: Record<string, number>;
}

export function OperationalSection({
	activeProjects,
	completedProjects,
	onHoldProjects,
	openIssues,
	leadsPipeline,
}: OperationalSectionProps) {
	const t = useTranslations();

	const miniStats = [
		{ label: t("dashboard.operational.activeProjects"), value: activeProjects, color: "text-chart-4 dark:text-chart-4", bgColor: "bg-chart-4/15 dark:bg-chart-4/20", icon: FolderOpen },
		{ label: t("dashboard.operational.completedProjects"), value: completedProjects, color: "text-success dark:text-success", bgColor: "bg-success/15 dark:bg-success/20", icon: CheckCircle },
		{ label: t("dashboard.operational.onHoldProjects"), value: onHoldProjects, color: "text-chart-1 dark:text-chart-1", bgColor: "bg-chart-1/20 dark:bg-chart-1/25", icon: PauseCircle },
		{ label: t("dashboard.operational.openIssues"), value: openIssues, color: "text-destructive dark:text-destructive", bgColor: "bg-destructive/15 dark:bg-destructive/20", icon: AlertTriangle },
	];

	const pipelineTotal = Object.values(leadsPipeline).reduce((s, v) => s + v, 0);
	const hasPipeline = pipelineTotal > 0;

	return (
		<div className={`${glassCard} flex flex-col p-3.5`}>
			<div className="flex items-center gap-2 mb-2">
				<Gauge className="h-4 w-4 text-muted-foreground" />
				<span className="text-sm font-bold text-foreground">
					{t("dashboard.operational.title")}
				</span>
			</div>

			{/* Mini stats */}
			<div className="grid grid-cols-2 gap-2 mb-2">
				{miniStats.map((stat, i) => {
					const Icon = stat.icon;
					return (
						<div key={i} className={`rounded-lg ${stat.bgColor} p-2.5 flex items-center gap-2`}>
							<Icon className={`h-4 w-4 shrink-0 ${stat.color}`} />
							<div className="min-w-0">
								<p className="truncate text-[11px] sm:text-xs text-muted-foreground">{stat.label}</p>
								<p className={`text-base sm:text-xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
							</div>
						</div>
					);
				})}
			</div>

			{/* Leads Pipeline */}
			{hasPipeline && (
				<div className="mb-3">
					<p className="text-xs font-medium text-muted-foreground mb-1.5">
						{t("dashboard.operational.leadsPipeline")}
					</p>
					<div className="flex h-6 rounded-md overflow-hidden">
						{LEAD_STATUS_ORDER.filter((s) => (leadsPipeline[s] ?? 0) > 0).map((status) => {
							const count = leadsPipeline[status] ?? 0;
							const pct = (count / pipelineTotal) * 100;
							return (
								<div
									key={status}
									className="flex items-center justify-center text-[10px] font-bold text-white"
									style={{
										width: `${pct}%`,
										backgroundColor: LEAD_STATUS_COLORS[status] ?? "#6b7280",
										minWidth: count > 0 ? "22px" : 0,
									}}
									title={`${t(`pricing.leads.status.${status}`)} (${count})`}
								>
									{count}
								</div>
							);
						})}
					</div>
				</div>
			)}

		</div>
	);
}
