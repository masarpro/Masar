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
	typeDistribution: Array<{ type: string | null; count: number }>;
}

export function OperationalSection({
	activeProjects,
	completedProjects,
	onHoldProjects,
	openIssues,
	leadsPipeline,
	typeDistribution,
}: OperationalSectionProps) {
	const t = useTranslations();

	const miniStats = [
		{
			label: t("dashboard.operational.activeProjects"),
			value: activeProjects,
			color: "text-blue-600 dark:text-blue-400",
			bgColor: "bg-blue-50 dark:bg-blue-950/20",
			icon: FolderOpen,
		},
		{
			label: t("dashboard.operational.completedProjects"),
			value: completedProjects,
			color: "text-green-600 dark:text-green-400",
			bgColor: "bg-green-50 dark:bg-green-950/20",
			icon: CheckCircle,
		},
		{
			label: t("dashboard.operational.onHoldProjects"),
			value: onHoldProjects,
			color: "text-amber-600 dark:text-amber-400",
			bgColor: "bg-amber-50 dark:bg-amber-950/20",
			icon: PauseCircle,
		},
		{
			label: t("dashboard.operational.openIssues"),
			value: openIssues,
			color: "text-red-600 dark:text-red-400",
			bgColor: "bg-red-50 dark:bg-red-950/20",
			icon: AlertTriangle,
		},
	];

	// Leads pipeline
	const pipelineTotal = Object.values(leadsPipeline).reduce((s, v) => s + v, 0);
	const hasPipeline = pipelineTotal > 0;

	// Type distribution
	const TYPE_COLORS: Record<string, string> = {
		RESIDENTIAL: "#3b82f6",
		COMMERCIAL: "#10b981",
		INDUSTRIAL: "#f97316",
		INFRASTRUCTURE: "#6b7280",
		MIXED: "#8b5cf6",
	};

	return (
		<div
			className={`${glassCard} flex flex-col p-4 animate-in fade-in slide-in-from-bottom-3 duration-500`}
			style={{ animationDelay: "460ms" }}
		>
			<div className="flex items-center gap-2 mb-4">
				<Gauge className="h-4 w-4 text-muted-foreground" />
				<span className="text-sm font-semibold text-foreground">
					{t("dashboard.operational.title")}
				</span>
			</div>

			{/* Mini stats grid */}
			<div className="grid grid-cols-2 gap-3 mb-4">
				{miniStats.map((stat, i) => {
					const Icon = stat.icon;
					return (
						<div
							key={i}
							className={`rounded-lg ${stat.bgColor} p-2.5 flex items-center gap-2`}
						>
							<Icon className={`h-4 w-4 ${stat.color}`} />
							<div>
								<p className="text-[10px] text-muted-foreground">
									{stat.label}
								</p>
								<p className={`text-sm font-bold ${stat.color}`}>
									{stat.value}
								</p>
							</div>
						</div>
					);
				})}
			</div>

			{/* Leads Pipeline */}
			{hasPipeline && (
				<div className="mb-4">
					<p className="text-xs font-medium text-muted-foreground mb-2">
						{t("dashboard.operational.leadsPipeline")}
					</p>
					<div className="flex h-6 rounded-lg overflow-hidden">
						{LEAD_STATUS_ORDER.filter(
							(status) => (leadsPipeline[status] ?? 0) > 0,
						).map((status) => {
							const count = leadsPipeline[status] ?? 0;
							const pct = (count / pipelineTotal) * 100;
							return (
								<div
									key={status}
									className="flex items-center justify-center text-[9px] font-bold text-white transition-all"
									style={{
										width: `${pct}%`,
										backgroundColor: LEAD_STATUS_COLORS[status] ?? "#6b7280",
										minWidth: count > 0 ? "24px" : 0,
									}}
									title={`${t(`leads.status.${status}`)} (${count})`}
								>
									{count}
								</div>
							);
						})}
					</div>
					<div className="flex flex-wrap gap-2 mt-1.5">
						{LEAD_STATUS_ORDER.filter(
							(status) => (leadsPipeline[status] ?? 0) > 0,
						).map((status) => (
							<div key={status} className="flex items-center gap-1">
								<div
									className="h-2 w-2 rounded-full"
									style={{
										backgroundColor: LEAD_STATUS_COLORS[status] ?? "#6b7280",
									}}
								/>
								<span className="text-[9px] text-muted-foreground">
									{t(`leads.status.${status}`)}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Type distribution */}
			{typeDistribution.length > 0 && (
				<div>
					<p className="text-xs font-medium text-muted-foreground mb-2">
						{t("dashboard.operational.projectsByType")}
					</p>
					<div className="space-y-1.5">
						{typeDistribution
							.filter((item) => item.type != null)
							.map((item) => {
								const typeKey = item.type as string;
								const totalProjects = typeDistribution.reduce(
									(s, d) => s + d.count,
									0,
								);
								const pct =
									totalProjects > 0
										? Math.round((item.count / totalProjects) * 100)
										: 0;
								return (
									<div key={typeKey} className="flex items-center gap-2">
										<div
											className="h-2 w-2 rounded-full shrink-0"
											style={{
												backgroundColor:
													TYPE_COLORS[typeKey] ?? "#6b7280",
											}}
										/>
										<span className="text-[10px] text-foreground/80 flex-1">
											{t(`dashboard.operational.types.${typeKey}`)}
										</span>
										<span className="text-[10px] font-bold tabular-nums text-foreground">
											{item.count}
										</span>
										<span className="text-[9px] text-muted-foreground w-8 text-end">
											{pct}%
										</span>
									</div>
								);
							})}
					</div>
				</div>
			)}
		</div>
	);
}
