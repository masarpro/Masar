"use client";

import {
	AlertTriangle,
	CheckCircle,
	FolderOpen,
	Gauge,
	PauseCircle,
} from "lucide-react";
import Link from "next/link";
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

const LEAD_STATUS_ORDER = [
	"NEW",
	"STUDYING",
	"QUOTED",
	"NEGOTIATING",
	"WON",
	"LOST",
];

interface OperationalSectionProps {
	activeProjects: number;
	completedProjects: number;
	onHoldProjects: number;
	openIssues: number;
	leadsPipeline: Record<string, number>;
	organizationSlug: string;
}

export function OperationalSection({
	activeProjects,
	completedProjects,
	onHoldProjects,
	openIssues,
	leadsPipeline,
	organizationSlug,
}: OperationalSectionProps) {
	const t = useTranslations();

	const projectsPath = `/app/${organizationSlug}/projects`;

	// كل بطاقة تنقل إلى قائمة المشاريع (صفحة المشاريع لا تدعم فلترة عبر
	// الرابط حالياً — لا نزيّف فلتراً غير موجود).
	const miniStats = [
		{
			label: t("dashboard.operational.activeProjects"),
			value: activeProjects,
			color: "text-blue-700 dark:text-blue-400",
			bgColor: "bg-blue-50 dark:bg-blue-950/20",
			hoverBg: "hover:bg-blue-100/80 dark:hover:bg-blue-950/40",
			icon: FolderOpen,
			href: projectsPath,
		},
		{
			label: t("dashboard.operational.completedProjects"),
			value: completedProjects,
			color: "text-green-700 dark:text-green-400",
			bgColor: "bg-green-50 dark:bg-green-950/20",
			hoverBg: "hover:bg-green-100/80 dark:hover:bg-green-950/40",
			icon: CheckCircle,
			href: projectsPath,
		},
		{
			label: t("dashboard.operational.onHoldProjects"),
			value: onHoldProjects,
			color: "text-amber-700 dark:text-amber-400",
			bgColor: "bg-amber-50 dark:bg-amber-950/20",
			hoverBg: "hover:bg-amber-100/80 dark:hover:bg-amber-950/40",
			icon: PauseCircle,
			href: projectsPath,
		},
		{
			label: t("dashboard.operational.openIssues"),
			value: openIssues,
			color: "text-red-700 dark:text-red-400",
			bgColor: "bg-red-50 dark:bg-red-950/20",
			hoverBg: "hover:bg-red-100/80 dark:hover:bg-red-950/40",
			icon: AlertTriangle,
			href: projectsPath,
		},
	];

	const pipelineTotal = Object.values(leadsPipeline).reduce(
		(s, v) => s + v,
		0,
	);
	const hasPipeline = pipelineTotal > 0;

	return (
		<div className={`${glassCard} flex flex-col p-3.5`}>
			<div className="flex items-center gap-2 mb-2">
				<Gauge className="h-4 w-4 text-muted-foreground" />
				<h3 className="text-sm font-bold text-foreground">
					{t("dashboard.operational.title")}
				</h3>
			</div>

			{/* Mini stats — بطاقات قابلة للنقر تنتقل للقائمة ذات الصلة */}
			<div className="grid grid-cols-2 gap-2 mb-2">
				{miniStats.map((stat, i) => {
					const Icon = stat.icon;
					const isZero = stat.value === 0;
					return (
						<Link
							key={i}
							href={stat.href}
							aria-label={`${stat.label}: ${stat.value}`}
							className={`rounded-lg ${stat.bgColor} ${stat.hoverBg} p-2.5 flex items-center gap-2 cursor-pointer transition-colors hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
						>
							<Icon
								className={`h-4 w-4 shrink-0 ${isZero ? "text-muted-foreground/60" : stat.color}`}
							/>
							<div className="min-w-0">
								<p className="truncate text-xs text-foreground/70">
									{stat.label}
								</p>
								{/* قيمة صفر تُعرض بهدوء دون لفت الانتباه */}
								<p
									className={`text-base sm:text-xl font-bold tabular-nums ${isZero ? "text-muted-foreground/70" : stat.color}`}
								>
									{stat.value}
								</p>
							</div>
						</Link>
					);
				})}
			</div>

			{/* Leads Pipeline */}
			{hasPipeline && (
				<div className="mb-3">
					<p className="text-xs font-medium text-foreground/70 mb-1.5">
						{t("dashboard.operational.leadsPipeline")}
					</p>
					<div className="flex h-6 rounded-md overflow-hidden">
						{LEAD_STATUS_ORDER.filter(
							(s) => (leadsPipeline[s] ?? 0) > 0,
						).map((status) => {
							const count = leadsPipeline[status] ?? 0;
							const pct = (count / pipelineTotal) * 100;
							return (
								<div
									key={status}
									className="flex items-center justify-center text-[10px] font-bold text-white"
									style={{
										width: `${pct}%`,
										backgroundColor:
											LEAD_STATUS_COLORS[status] ??
											"#6b7280",
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
