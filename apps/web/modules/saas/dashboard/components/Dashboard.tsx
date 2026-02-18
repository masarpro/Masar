"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { StatsTile } from "@saas/start/components/StatsTile";
import { apiClient } from "@shared/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	AlertTriangle,
	ArrowRight,
	Banknote,
	Calendar,
	CheckCircle,
	Clock,
	FileText,
	FolderKanban,
	Receipt,
	TrendingUp,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

// Type definitions for API responses
interface Milestone {
	id: string;
	title: string;
	plannedEnd: Date | string | null;
	status: string;
	progress: number;
	project: {
		id: string;
		name: string;
	};
}

interface Activity {
	type: "change_order" | "claim" | "issue";
	id: string;
	title: string;
	createdAt: Date | string;
	createdBy: { id: string; name: string };
	project: { id: string; name: string };
	metadata?: Record<string, unknown>;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

function formatDate(date: Date | string): string {
	return new Date(date).toLocaleDateString("ar-SA", {
		month: "short",
		day: "numeric",
	});
}

export function Dashboard() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const organizationSlug = activeOrganization?.slug ?? "";

	// Fetch dashboard stats
	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["dashboard-stats", activeOrganization?.id],
		queryFn: async () => {
			if (!activeOrganization?.id) return null;
			return apiClient.dashboard.getStats({
				organizationId: activeOrganization.id,
			});
		},
		enabled: !!activeOrganization?.id,
	});

	// Fetch upcoming milestones
	const { data: upcomingMilestones } = useQuery({
		queryKey: ["dashboard-upcoming", activeOrganization?.id],
		queryFn: async () => {
			if (!activeOrganization?.id) return [];
			return apiClient.dashboard.getUpcoming({
				organizationId: activeOrganization.id,
				limit: 5,
			});
		},
		enabled: !!activeOrganization?.id,
	});

	// Fetch overdue milestones
	const { data: overdueMilestones } = useQuery({
		queryKey: ["dashboard-overdue", activeOrganization?.id],
		queryFn: async () => {
			if (!activeOrganization?.id) return [];
			return apiClient.dashboard.getOverdue({
				organizationId: activeOrganization.id,
				limit: 5,
			});
		},
		enabled: !!activeOrganization?.id,
	});

	// Fetch recent activities
	const { data: activities } = useQuery({
		queryKey: ["dashboard-activities", activeOrganization?.id],
		queryFn: async () => {
			if (!activeOrganization?.id) return [];
			return apiClient.dashboard.getActivities({
				organizationId: activeOrganization.id,
				limit: 10,
			});
		},
		enabled: !!activeOrganization?.id,
	});

	// Fetch financial trend
	const { data: financialTrend } = useQuery({
		queryKey: ["dashboard-financial-trend", activeOrganization?.id],
		queryFn: async () => {
			if (!activeOrganization?.id) return [];
			return apiClient.dashboard.getFinancialTrend({
				organizationId: activeOrganization.id,
			});
		},
		enabled: !!activeOrganization?.id,
	});

	if (statsLoading) {
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
			{/* KPI Cards Row 1 - Project Stats */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-900">
					<CardContent className="p-6">
						<div className="flex items-center gap-4">
							<div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/50">
								<FolderKanban className="h-6 w-6 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("dashboard.totalProjects")}
								</p>
								<p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
									{stats?.projects.total ?? 0}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-slate-900">
					<CardContent className="p-6">
						<div className="flex items-center gap-4">
							<div className="rounded-xl bg-emerald-100 p-3 dark:bg-emerald-900/50">
								<TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
							</div>
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("dashboard.activeProjects")}
								</p>
								<p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
									{stats?.projects.active ?? 0}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900">
					<CardContent className="p-6">
						<div className="flex items-center gap-4">
							<div className="rounded-xl bg-amber-100 p-3 dark:bg-amber-900/50">
								<Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
							</div>
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("dashboard.onHoldProjects")}
								</p>
								<p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
									{stats?.projects.onHold ?? 0}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900">
					<CardContent className="p-6">
						<div className="flex items-center gap-4">
							<div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-700">
								<CheckCircle className="h-6 w-6 text-slate-600 dark:text-slate-400" />
							</div>
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("dashboard.completedProjects")}
								</p>
								<p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
									{stats?.projects.completed ?? 0}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* KPI Cards Row 2 - Financial Stats */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center gap-4">
							<div className="rounded-xl bg-indigo-100 p-3 dark:bg-indigo-900/50">
								<Banknote className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
							</div>
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("dashboard.totalContractValue")}
								</p>
								<p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
									{formatCurrency(stats?.financials.totalContractValue ?? 0)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center gap-4">
							<div className="rounded-xl bg-red-100 p-3 dark:bg-red-900/50">
								<Receipt className="h-6 w-6 text-red-600 dark:text-red-400" />
							</div>
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("dashboard.totalExpenses")}
								</p>
								<p className="text-lg font-bold text-red-600 dark:text-red-400">
									{formatCurrency(stats?.financials.totalExpenses ?? 0)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center gap-4">
							<div className="rounded-xl bg-green-100 p-3 dark:bg-green-900/50">
								<CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
							</div>
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("dashboard.paidClaims")}
								</p>
								<p className="text-lg font-bold text-green-600 dark:text-green-400">
									{formatCurrency(stats?.financials.totalPaidClaims ?? 0)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center gap-4">
							<div className="rounded-xl bg-orange-100 p-3 dark:bg-orange-900/50">
								<Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
							</div>
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("dashboard.pendingClaims")}
								</p>
								<p className="text-lg font-bold text-orange-600 dark:text-orange-400">
									{formatCurrency(stats?.financials.pendingClaimsValue ?? 0)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Content Grid */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Left Column - Milestones & Activities */}
				<div className="lg:col-span-2 space-y-6">
					{/* Overdue Milestones Alert */}
					{overdueMilestones && overdueMilestones.length > 0 && (
						<Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
									<AlertTriangle className="h-5 w-5" />
									{t("dashboard.overdueMilestones")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{overdueMilestones.map((m: Milestone) => (
										<Link
											key={m.id}
											href={`/app/${organizationSlug}/projects/${m.project.id}/timeline`}
											className="flex items-center justify-between rounded-lg bg-white/50 p-3 transition-colors hover:bg-white dark:bg-slate-900/50 dark:hover:bg-slate-900"
										>
											<div>
												<p className="font-medium text-slate-900 dark:text-slate-100">
													{m.title}
												</p>
												<p className="text-sm text-slate-500">
													{m.project.name}
												</p>
											</div>
											<div className="text-end">
												<p className="text-sm font-medium text-red-600 dark:text-red-400">
													{m.plannedEnd ? formatDate(m.plannedEnd) : "-"}
												</p>
												<Badge status="error" className="text-xs">
													{t("dashboard.overdue")}
												</Badge>
											</div>
										</Link>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Upcoming Milestones */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="flex items-center gap-2">
								<Calendar className="h-5 w-5 text-slate-400" />
								{t("dashboard.upcomingMilestones")}
							</CardTitle>
							<Button variant="ghost" size="sm" asChild>
								<Link href={`/app/${organizationSlug}/projects`}>
									{t("dashboard.viewAll")}
									<ArrowRight className="ms-1 h-4 w-4" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent>
							{upcomingMilestones && upcomingMilestones.length > 0 ? (
								<div className="space-y-3">
									{upcomingMilestones.map((m: Milestone) => (
										<Link
											key={m.id}
											href={`/app/${organizationSlug}/projects/${m.project.id}/timeline`}
											className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
										>
											<div>
												<p className="font-medium text-slate-900 dark:text-slate-100">
													{m.title}
												</p>
												<p className="text-sm text-slate-500">
													{m.project.name}
												</p>
											</div>
											<div className="text-end">
												<p className="text-sm text-slate-600 dark:text-slate-400">
													{m.plannedEnd ? formatDate(m.plannedEnd) : "-"}
												</p>
												<div className="flex items-center gap-1 text-xs text-slate-400">
													<span>{m.progress}%</span>
												</div>
											</div>
										</Link>
									))}
								</div>
							) : (
								<p className="text-center text-slate-500 py-8">
									{t("dashboard.noUpcomingMilestones")}
								</p>
							)}
						</CardContent>
					</Card>

					{/* Recent Activities */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5 text-slate-400" />
								{t("dashboard.recentActivities")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{activities && activities.length > 0 ? (
								<div className="space-y-3">
									{activities.map((activity: Activity, idx: number) => (
										<div
											key={`${activity.type}-${activity.id}-${idx}`}
											className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0 dark:border-slate-800"
										>
											<div
												className={`rounded-full p-2 ${
													activity.type === "change_order"
														? "bg-amber-100 dark:bg-amber-900/50"
														: activity.type === "claim"
															? "bg-green-100 dark:bg-green-900/50"
															: "bg-red-100 dark:bg-red-900/50"
												}`}
											>
												{activity.type === "change_order" && (
													<TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
												)}
												{activity.type === "claim" && (
													<Receipt className="h-4 w-4 text-green-600 dark:text-green-400" />
												)}
												{activity.type === "issue" && (
													<AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
												)}
											</div>
											<div className="flex-1 min-w-0">
												<p className="font-medium text-slate-900 dark:text-slate-100 truncate">
													{activity.title}
												</p>
												<p className="text-sm text-slate-500 truncate">
													{activity.project.name} • {activity.createdBy.name}
												</p>
											</div>
											<p className="text-xs text-slate-400 whitespace-nowrap">
												{formatDate(activity.createdAt)}
											</p>
										</div>
									))}
								</div>
							) : (
								<p className="text-center text-slate-500 py-8">
									{t("dashboard.noRecentActivities")}
								</p>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Right Column - Stats & Change Orders */}
				<div className="space-y-6">
					{/* Milestone Stats */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								{t("dashboard.milestoneStats")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-slate-500">{t("dashboard.completed")}</span>
									<span className="font-semibold text-emerald-600 dark:text-emerald-400">
										{stats?.milestones.completed ?? 0}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-slate-500">{t("dashboard.pending")}</span>
									<span className="font-semibold text-slate-600 dark:text-slate-400">
										{stats?.milestones.pending ?? 0}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-slate-500">{t("dashboard.overdue")}</span>
									<span className="font-semibold text-red-600 dark:text-red-400">
										{stats?.milestones.overdue ?? 0}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Change Orders Stats */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								{t("dashboard.changeOrderStats")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-slate-500">{t("dashboard.total")}</span>
									<span className="font-semibold">
										{stats?.changeOrders.total ?? 0}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-slate-500">{t("dashboard.pendingApproval")}</span>
									<span className="font-semibold text-amber-600 dark:text-amber-400">
										{stats?.changeOrders.pending ?? 0}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-slate-500">{t("dashboard.approved")}</span>
									<span className="font-semibold text-emerald-600 dark:text-emerald-400">
										{stats?.changeOrders.approved ?? 0}
									</span>
								</div>
								<div className="border-t pt-4 dark:border-slate-800">
									<div className="flex items-center justify-between">
										<span className="text-slate-500">{t("dashboard.costImpact")}</span>
										<span
											className={`font-semibold ${
												(stats?.changeOrders.totalCostImpact ?? 0) >= 0
													? "text-emerald-600 dark:text-emerald-400"
													: "text-red-600 dark:text-red-400"
											}`}
										>
											{(stats?.changeOrders.totalCostImpact ?? 0) > 0 ? "+" : ""}
											{formatCurrency(stats?.changeOrders.totalCostImpact ?? 0)}
										</span>
									</div>
									<div className="flex items-center justify-between mt-2">
										<span className="text-slate-500">{t("dashboard.timeImpact")}</span>
										<span className="font-semibold text-blue-600 dark:text-blue-400">
											{(stats?.changeOrders.totalTimeImpact ?? 0) > 0 ? "+" : ""}
											{stats?.changeOrders.totalTimeImpact ?? 0} {t("common.days")}
										</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Quick Actions */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								{t("dashboard.quickActions")}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<Button variant="outline" className="w-full justify-start" asChild>
								<Link href={`/app/${organizationSlug}/projects`}>
									<FolderKanban className="me-2 h-4 w-4" />
									{t("dashboard.viewProjects")}
								</Link>
							</Button>
							<Button variant="outline" className="w-full justify-start" asChild>
								<Link href={`/app/${organizationSlug}/quantities`}>
									<Receipt className="me-2 h-4 w-4" />
									{t("dashboard.quantities")}
								</Link>
							</Button>
							<Button variant="outline" className="w-full justify-start" asChild>
								<Link href={`/app/${organizationSlug}/settings`}>
									<Users className="me-2 h-4 w-4" />
									{t("dashboard.settings")}
								</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
