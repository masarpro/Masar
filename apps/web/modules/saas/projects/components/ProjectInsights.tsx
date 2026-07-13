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
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { CompactStatGrid } from "@saas/shared/components/mobile/CompactStatGrid";

interface ProjectInsightsProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

function getSeverityBadge(severity: string, t: (key: string) => string) {
	switch (severity) {
		case "CRITICAL":
			return (
				<Badge className="border-0 bg-destructive/15 text-destructive">
					{t("projects.insights.critical")}
				</Badge>
			);
		case "WARN":
			return (
				<Badge className="border-0 bg-chart-1/15 text-chart-1">
					{t("projects.insights.warnings")}
				</Badge>
			);
		case "INFO":
			return (
				<Badge className="border-0 bg-chart-4/15 text-chart-4">
					{t("projects.insights.info")}
				</Badge>
			);
		default:
			return null;
	}
}

function getSeverityIcon(severity: string) {
	switch (severity) {
		case "CRITICAL":
			return <AlertCircle className="h-5 w-5 text-destructive" />;
		case "WARN":
			return <AlertTriangle className="h-5 w-5 text-chart-1" />;
		case "INFO":
			return <Info className="h-5 w-5 text-chart-4" />;
		default:
			return <Info className="h-5 w-5 text-muted-foreground" />;
	}
}

function getAlertTypeLabel(type: string, t: (key: string) => string) {
	const key = `projects.insights.alertTypes.${type}`;
	const translated = t(key);
	return translated !== key ? translated : type;
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
					queryKey: orpc.projectInsights.get.key(),
				});
				toast.success(t("projects.insights.toastAcknowledged"));
			},
			onError: () => {
				toast.error(t("projects.insights.toastError"));
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
		return <DashboardSkeleton />;
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* الجوال: شريط إحصائيات مضغوط */}
			<CompactStatGrid
				className="sm:hidden"
				items={[
					{
						label: t("projects.insights.critical"),
						value: data?.stats.critical || 0,
						icon: AlertCircle,
						iconClassName: "text-destructive",
						iconBgClassName: "bg-destructive/15",
						valueClassName: "text-destructive",
					},
					{
						label: t("projects.insights.warnings"),
						value: data?.stats.warnings || 0,
						icon: AlertTriangle,
						iconClassName: "text-chart-1",
						iconBgClassName: "bg-chart-1/15",
						valueClassName: "text-chart-1",
					},
					{
						label: t("projects.insights.info"),
						value: data?.stats.info || 0,
						icon: Info,
						iconClassName: "text-chart-4",
						iconBgClassName: "bg-chart-4/15",
						valueClassName: "text-chart-4",
					},
				]}
			/>

			{/* Stats Cards (الديسكتوب كما هو) */}
			<div className="hidden sm:grid sm:grid-cols-3 gap-4">
				<div className="rounded-2xl border-2 bg-card p-5">
					<div className="flex items-center gap-3">
						<div className="flex size-9 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
							<AlertCircle className="h-5 w-5" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">{t("projects.insights.critical")}</p>
							<p className="text-2xl font-semibold text-destructive">
								{data?.stats.critical || 0}
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-2xl border-2 bg-card p-5">
					<div className="flex items-center gap-3">
						<div className="flex size-9 items-center justify-center rounded-xl bg-chart-1/15 text-chart-1">
							<AlertTriangle className="h-5 w-5" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">
								{t("projects.insights.warnings")}
							</p>
							<p className="text-2xl font-semibold text-chart-1">
								{data?.stats.warnings || 0}
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-2xl border-2 bg-card p-5">
					<div className="flex items-center gap-3">
						<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
							<Info className="h-5 w-5" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">
								{t("projects.insights.info")}
							</p>
							<p className="text-2xl font-semibold text-chart-4">
								{data?.stats.info || 0}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Active Alerts */}
			<div className="rounded-2xl border-2 bg-card p-6">
				<h2 className="mb-4 text-lg font-semibold text-card-foreground">
					{t("projects.insights.activeAlerts")}
				</h2>

				{data?.activeAlerts && data.activeAlerts.length > 0 ? (
					<div className="space-y-3">
						{data.activeAlerts.map((alert: any) => (
							<div
								key={alert.id}
								className="flex items-start gap-4 rounded-xl border-2 bg-muted/40 p-4"
							>
								{getSeverityIcon(alert.severity)}
								<div className="flex-1">
									<div className="mb-1 flex items-center gap-2">
										<span className="font-medium text-card-foreground">
											{alert.title}
										</span>
										{getSeverityBadge(alert.severity, t)}
									</div>
									<p className="text-sm text-muted-foreground">
										{alert.description}
									</p>
									<p className="mt-1 text-xs text-muted-foreground">
										{getAlertTypeLabel(alert.type, t)}
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
									{t("projects.insights.acknowledge")}
								</Button>
							</div>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="mb-4 rounded-2xl bg-chart-4/15 p-4">
							<Check className="h-8 w-8 text-chart-4" />
						</div>
						<p className="text-muted-foreground">
							{t("projects.insights.noAlerts")}
						</p>
						<p className="text-sm text-muted-foreground">{t("projects.insights.projectHealthy")}</p>
					</div>
				)}
			</div>

			{/* Acknowledged Alerts */}
			{data?.acknowledgedAlerts && data.acknowledgedAlerts.length > 0 && (
				<div className="rounded-2xl border-2 bg-card p-6">
					<h2 className="mb-4 text-lg font-semibold text-card-foreground">
						{t("projects.insights.acknowledged")}
					</h2>
					<div className="space-y-2">
						{data.acknowledgedAlerts.map((alert: any) => (
							<div
								key={alert.id}
								className="flex items-center gap-3 rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
							>
								<Check className="h-4 w-4 text-chart-4" />
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
