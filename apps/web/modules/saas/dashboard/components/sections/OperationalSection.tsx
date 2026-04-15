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
	"backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5";

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
		{ label: t("dashboard.operational.activeProjects"), value: activeProjects, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-950/20", icon: FolderOpen },
		{ label: t("dashboard.operational.completedProjects"), value: completedProjects, color: "text-green-600 dark:text-green-400", bgColor: "bg-green-50 dark:bg-green-950/20", icon: CheckCircle },
		{ label: t("dashboard.operational.onHoldProjects"), value: onHoldProjects, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-950/20", icon: PauseCircle },
		{ label: t("dashboard.operational.openIssues"), value: openIssues, color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-950/20", icon: AlertTriangle },
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
							<Icon className={`h-4 w-4 ${stat.color}`} />
							<div>
								<p className="text-xs text-muted-foreground">{stat.label}</p>
								<p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
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
