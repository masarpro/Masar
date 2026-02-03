"use client";

import { formatCurrency } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	AlertTriangle,
	Banknote,
	Calendar,
	Camera,
	FileText,
	FolderKanban,
	MessageSquare,
	Plus,
	Receipt,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface ProjectOverviewProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function ProjectOverview({
	organizationId,
	organizationSlug,
	projectId,
}: ProjectOverviewProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;

	// Fetch finance summary for quick stats
	const { data: financeSummary } = useQuery(
		orpc.projectFinance.getSummary.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	// Fetch recent field timeline
	const { data: fieldData } = useQuery(
		orpc.projectField.getTimeline.queryOptions({
			input: {
				organizationId,
				projectId,
				limit: 5,
			},
		}),
	);

	// Quick actions for the command center
	const quickActions = [
		{
			label: t("projects.commandCenter.newReport"),
			icon: FileText,
			href: `${basePath}/field/new-report`,
			color: "bg-blue-500 hover:bg-blue-600 text-white",
		},
		{
			label: t("projects.commandCenter.uploadPhoto"),
			icon: Camera,
			href: `${basePath}/field/upload`,
			color: "bg-green-500 hover:bg-green-600 text-white",
		},
		{
			label: t("projects.commandCenter.newExpense"),
			icon: Banknote,
			href: `${basePath}/finance/new-expense`,
			color: "bg-amber-500 hover:bg-amber-600 text-white",
		},
		{
			label: t("projects.commandCenter.newClaim"),
			icon: Receipt,
			href: `${basePath}/finance/new-claim`,
			color: "bg-indigo-500 hover:bg-indigo-600 text-white",
		},
		{
			label: t("projects.commandCenter.newIssue"),
			icon: AlertTriangle,
			href: `${basePath}/field/new-issue`,
			color: "bg-red-500 hover:bg-red-600 text-white",
		},
		{
			label: t("projects.commandCenter.addDocument"),
			icon: FolderKanban,
			href: `${basePath}/documents/new`,
			color: "bg-purple-500 hover:bg-purple-600 text-white",
		},
	];

	// Module shortcuts - grouped navigation tiles
	const moduleShortcuts = [
		{
			label: t("projects.commandCenter.fieldTimeline"),
			icon: FileText,
			href: `${basePath}/field`,
			bg: "bg-blue-50 dark:bg-blue-950/30",
			iconBg: "bg-blue-100 dark:bg-blue-900/50",
			iconColor: "text-blue-600 dark:text-blue-400",
		},
		{
			label: t("projects.commandCenter.finance"),
			icon: Banknote,
			href: `${basePath}/finance`,
			bg: "bg-emerald-50 dark:bg-emerald-950/30",
			iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
			iconColor: "text-emerald-600 dark:text-emerald-400",
		},
		{
			label: t("projects.commandCenter.timeline"),
			icon: Calendar,
			href: `${basePath}/timeline`,
			bg: "bg-amber-50 dark:bg-amber-950/30",
			iconBg: "bg-amber-100 dark:bg-amber-900/50",
			iconColor: "text-amber-600 dark:text-amber-400",
		},
		{
			label: t("projects.commandCenter.chat"),
			icon: MessageSquare,
			href: `${basePath}/chat`,
			bg: "bg-purple-50 dark:bg-purple-950/30",
			iconBg: "bg-purple-100 dark:bg-purple-900/50",
			iconColor: "text-purple-600 dark:text-purple-400",
		},
	];

	// Calculate finance snapshot
	const claimsPaid = financeSummary?.claimsPaid ?? 0;
	const actualExpenses = financeSummary?.actualExpenses ?? 0;
	const remaining = financeSummary?.remaining ?? 0;

	// Get recent activity count
	const recentActivityCount = fieldData?.timeline?.length ?? 0;
	const lastReportDate = fieldData?.timeline?.[0]?.createdAt;

	return (
		<div className="space-y-6">
			{/* Today's Summary Cards */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{/* Claims Paid */}
				<div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-green-100 p-2.5 dark:bg-green-900/50">
							<TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-xs text-slate-500 dark:text-slate-400">
								{t("projects.commandCenter.claimsPaid")}
							</p>
							<p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
								{formatCurrency(claimsPaid)}
							</p>
						</div>
					</div>
				</div>

				{/* Actual Expenses */}
				<div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-red-100 p-2.5 dark:bg-red-900/50">
							<Banknote className="h-5 w-5 text-red-600 dark:text-red-400" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-xs text-slate-500 dark:text-slate-400">
								{t("projects.commandCenter.expenses")}
							</p>
							<p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
								{formatCurrency(actualExpenses)}
							</p>
						</div>
					</div>
				</div>

				{/* Remaining Budget */}
				<div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/50">
							<Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-xs text-slate-500 dark:text-slate-400">
								{t("projects.commandCenter.remaining")}
							</p>
							<p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
								{formatCurrency(remaining)}
							</p>
						</div>
					</div>
				</div>

				{/* Recent Activity */}
				<div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-amber-100 p-2.5 dark:bg-amber-900/50">
							<FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-xs text-slate-500 dark:text-slate-400">
								{t("projects.commandCenter.recentActivities")}
							</p>
							<p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
								{recentActivityCount}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Quick Actions Grid */}
			<div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
						{t("projects.commandCenter.quickActions")}
					</h2>
					<Plus className="h-5 w-5 text-slate-400" />
				</div>
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
					{quickActions.map((action) => (
						<Link key={action.label} href={action.href}>
							<div
								className={`flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-all active:scale-95 ${action.color}`}
							>
								<action.icon className="h-6 w-6" />
								<span className="text-xs font-medium leading-tight">
									{action.label}
								</span>
							</div>
						</Link>
					))}
				</div>
			</div>

			{/* Module Shortcuts */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{moduleShortcuts.map((module) => (
					<Link key={module.label} href={module.href}>
						<div
							className={`group rounded-2xl ${module.bg} p-5 transition-all hover:shadow-md`}
						>
							<div className="mb-3 flex items-center gap-3">
								<div className={`rounded-xl p-2.5 ${module.iconBg}`}>
									<module.icon className={`h-5 w-5 ${module.iconColor}`} />
								</div>
								<span className="font-medium text-slate-900 dark:text-slate-100">
									{module.label}
								</span>
							</div>
						</div>
					</Link>
				))}
			</div>

			{/* Last Report Info */}
			{lastReportDate && (
				<div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
					<div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
						<FileText className="h-4 w-4" />
						<span>
							{t("projects.commandCenter.lastReport")}:{" "}
							{new Date(lastReportDate).toLocaleDateString("ar-SA", {
								day: "numeric",
								month: "short",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</span>
						<Link
							href={`${basePath}/field`}
							className="ms-auto text-primary hover:underline"
						>
							{t("projects.commandCenter.viewAll")}
						</Link>
					</div>
				</div>
			)}
		</div>
	);
}
