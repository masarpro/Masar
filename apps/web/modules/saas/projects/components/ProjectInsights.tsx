"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	AlertCircle,
	AlertTriangle,
	Check,
	Info,
	RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface ProjectInsightsProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

function getSeverityBadge(severity: string) {
	switch (severity) {
		case "CRITICAL":
			return (
				<Badge className="border-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
					حرج
				</Badge>
			);
		case "WARN":
			return (
				<Badge className="border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
					تحذير
				</Badge>
			);
		case "INFO":
			return (
				<Badge className="border-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
					معلومة
				</Badge>
			);
		default:
			return null;
	}
}

function getSeverityIcon(severity: string) {
	switch (severity) {
		case "CRITICAL":
			return <AlertCircle className="h-5 w-5 text-red-500" />;
		case "WARN":
			return <AlertTriangle className="h-5 w-5 text-amber-500" />;
		case "INFO":
			return <Info className="h-5 w-5 text-blue-500" />;
		default:
			return <Info className="h-5 w-5 text-slate-500" />;
	}
}

function getAlertTypeLabel(type: string) {
	switch (type) {
		case "MISSING_DAILY_REPORT":
			return "تقرير يومي مفقود";
		case "STALE_PROGRESS":
			return "تقدم قديم";
		case "OVERDUE_PAYMENT":
			return "دفعة متأخرة";
		case "COST_OVERRUN_RISK":
			return "خطر تجاوز التكلفة";
		case "TOO_MANY_OPEN_ISSUES":
			return "مشاكل مفتوحة كثيرة";
		default:
			return type;
	}
}

export function ProjectInsights({
	organizationId,
	organizationSlug,
	projectId,
}: ProjectInsightsProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;

	const { data, isLoading, refetch, isRefetching } = useQuery(
		orpc.projectInsights.get.queryOptions({
			input: {
				organizationId,
				projectId,
			},
		}),
	);

	const acknowledgeMutation = useMutation(
		orpc.projectInsights.acknowledge.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["projectInsights", "get"],
				});
				toast.success("تم الاطلاع على التنبيه");
			},
			onError: () => {
				toast.error("حدث خطأ");
			},
		}),
	);

	const handleAcknowledge = (alertId: string) => {
		acknowledgeMutation.mutate({
			organizationId,
			projectId,
			alertId,
		});
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="h-16 w-16 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Stats Cards */}
			<div className="grid grid-cols-3 gap-4">
				<div className="rounded-2xl bg-red-50 p-5 dark:bg-red-950/30">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-red-100 p-2.5 dark:bg-red-900/50">
							<AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
						</div>
						<div>
							<p className="text-xs text-red-600 dark:text-red-400">حرج</p>
							<p className="text-2xl font-semibold text-red-700 dark:text-red-300">
								{data?.stats.critical || 0}
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-2xl bg-amber-50 p-5 dark:bg-amber-950/30">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-amber-100 p-2.5 dark:bg-amber-900/50">
							<AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
						</div>
						<div>
							<p className="text-xs text-amber-600 dark:text-amber-400">
								تحذيرات
							</p>
							<p className="text-2xl font-semibold text-amber-700 dark:text-amber-300">
								{data?.stats.warnings || 0}
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-2xl bg-blue-50 p-5 dark:bg-blue-950/30">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/50">
							<Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<p className="text-xs text-blue-600 dark:text-blue-400">
								معلومات
							</p>
							<p className="text-2xl font-semibold text-blue-700 dark:text-blue-300">
								{data?.stats.info || 0}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Active Alerts */}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
				<h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
					التنبيهات النشطة
				</h2>

				{data?.activeAlerts && data.activeAlerts.length > 0 ? (
					<div className="space-y-3">
						{data.activeAlerts.map((alert) => (
							<div
								key={alert.id}
								className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
							>
								{getSeverityIcon(alert.severity)}
								<div className="flex-1">
									<div className="mb-1 flex items-center gap-2">
										<span className="font-medium text-slate-900 dark:text-slate-100">
											{alert.title}
										</span>
										{getSeverityBadge(alert.severity)}
									</div>
									<p className="text-sm text-slate-600 dark:text-slate-400">
										{alert.description}
									</p>
									<p className="mt-1 text-xs text-slate-400">
										{getAlertTypeLabel(alert.type)}
									</p>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleAcknowledge(alert.id)}
									disabled={acknowledgeMutation.isPending}
									className="shrink-0 gap-1"
								>
									<Check className="h-3 w-3" />
									تم الاطلاع
								</Button>
							</div>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="mb-4 rounded-2xl bg-teal-100 p-4 dark:bg-teal-900/30">
							<Check className="h-8 w-8 text-teal-600 dark:text-teal-400" />
						</div>
						<p className="text-slate-600 dark:text-slate-400">
							لا توجد تنبيهات نشطة
						</p>
						<p className="text-sm text-slate-400">المشروع في حالة جيدة</p>
					</div>
				)}
			</div>

			{/* Acknowledged Alerts */}
			{data?.acknowledgedAlerts && data.acknowledgedAlerts.length > 0 && (
				<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
					<h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
						تنبيهات تم الاطلاع عليها
					</h2>
					<div className="space-y-2">
						{data.acknowledgedAlerts.map((alert) => (
							<div
								key={alert.id}
								className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:bg-slate-800/30"
							>
								<Check className="h-4 w-4 text-teal-500" />
								<span>{alert.title}</span>
								<span className="ms-auto text-xs">
									{alert.acknowledgedAt
										? new Date(alert.acknowledgedAt).toLocaleDateString("ar-SA")
										: ""}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
