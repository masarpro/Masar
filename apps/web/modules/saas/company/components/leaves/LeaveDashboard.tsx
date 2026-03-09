"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import Link from "next/link";
import { Badge } from "@ui/components/badge";
import {
	CalendarDays,
	Clock,
	AlertTriangle,
	Users,
	ArrowLeft,
	ClipboardList,
	Wallet,
	Settings,
} from "lucide-react";
import { Button } from "@ui/components/button";

interface LeaveDashboardProps {
	organizationId: string;
	organizationSlug: string;
}

export function LeaveDashboard({ organizationId, organizationSlug }: LeaveDashboardProps) {
	const t = useTranslations();
	const base = `/app/${organizationSlug}/company/leaves`;

	const { data, isLoading } = useQuery(
		orpc.company.leaves.dashboard.queryOptions({
			input: { organizationId },
		}),
	);

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "PENDING":
				return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-[10px] px-2 py-0.5">{t("company.leaves.statusPending")}</Badge>;
			case "APPROVED":
				return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-[10px] px-2 py-0.5">{t("company.leaves.statusApproved")}</Badge>;
			case "REJECTED":
				return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-[10px] px-2 py-0.5">{t("company.leaves.statusRejected")}</Badge>;
			case "CANCELLED":
				return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-0 text-[10px] px-2 py-0.5">{t("company.leaves.statusCancelled")}</Badge>;
			default:
				return null;
		}
	};

	const quickLinks = [
		{ href: `${base}/requests`, icon: ClipboardList, label: t("company.leaves.requests.title"), color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
		{ href: `${base}/balances`, icon: Wallet, label: t("company.leaves.balances.title"), color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
		{ href: `${base}/types`, icon: Settings, label: t("company.leaves.types.title"), color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30" },
	];

	return (
		<div className="space-y-6" dir="rtl">
			{/* Summary Cards */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30">
							<Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />
						</div>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("company.leaves.dashboard.onLeaveToday")}
					</p>
					<p className="text-2xl font-bold text-sky-700 dark:text-sky-300">
						{isLoading ? "..." : data?.onLeaveToday?.length ?? 0}
					</p>
				</div>

				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
							<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
						</div>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("company.leaves.dashboard.pendingRequests")}
					</p>
					<p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
						{isLoading ? "..." : data?.pendingRequests ?? 0}
					</p>
				</div>

				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
							<AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
						</div>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("company.leaves.dashboard.lowBalances")}
					</p>
					<p className="text-2xl font-bold text-red-700 dark:text-red-300">
						{isLoading ? "..." : data?.lowBalances?.length ?? 0}
					</p>
				</div>

				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
							<CalendarDays className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
						</div>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("company.leaves.title")}
					</p>
					<p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
						{new Date().getFullYear()}
					</p>
				</div>
			</div>

			{/* Quick Links */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{quickLinks.map((link) => (
					<Link key={link.href} href={link.href} prefetch>
						<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4 hover:bg-white/90 dark:hover:bg-slate-800/70 transition-colors cursor-pointer">
							<div className="flex items-center gap-3">
								<div className={`p-2 rounded-lg ${link.bg}`}>
									<link.icon className={`h-5 w-5 ${link.color}`} />
								</div>
								<span className="font-medium text-slate-700 dark:text-slate-300">{link.label}</span>
								<ArrowLeft className="h-4 w-4 text-slate-400 mr-auto" />
							</div>
						</div>
					</Link>
				))}
			</div>

			{/* On Leave Today */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-6">
				<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
					{t("company.leaves.dashboard.onLeaveToday")}
				</h3>
				{isLoading ? (
					<div className="space-y-3">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="h-10 animate-pulse rounded-xl bg-muted" />
						))}
					</div>
				) : data?.onLeaveToday?.length ? (
					<div className="space-y-3">
						{data.onLeaveToday.map((req) => (
							<div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: req.leaveType.color || "#6b7280" }}>
										{req.employee.name.charAt(0)}
									</div>
									<div>
										<p className="font-medium text-sm text-slate-900 dark:text-slate-100">{req.employee.name}</p>
										<p className="text-xs text-slate-500">{req.leaveType.name}</p>
									</div>
								</div>
								<p className="text-xs text-slate-500">
									{new Date(req.endDate).toLocaleDateString("ar-SA")}
								</p>
							</div>
						))}
					</div>
				) : (
					<p className="text-sm text-slate-500 text-center py-4">{t("company.leaves.dashboard.noOneOnLeave")}</p>
				)}
			</div>

			{/* Recent Requests + Low Balances side by side */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Recent Requests */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
							{t("company.leaves.dashboard.recentRequests")}
						</h3>
						<Link href={`${base}/requests`}>
							<Button variant="ghost" size="sm" className="rounded-xl text-xs">
								{t("company.common.viewAll")}
							</Button>
						</Link>
					</div>
					{isLoading ? (
						<div className="space-y-3">
							{[...Array(3)].map((_, i) => (
								<div key={i} className="h-10 animate-pulse rounded-xl bg-muted" />
							))}
						</div>
					) : data?.recentRequests?.length ? (
						<div className="space-y-3">
							{data.recentRequests.map((req) => (
								<div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
									<div>
										<p className="font-medium text-sm text-slate-900 dark:text-slate-100">{req.employee.name}</p>
										<p className="text-xs text-slate-500">{req.leaveType.name}</p>
									</div>
									{getStatusBadge(req.status)}
								</div>
							))}
						</div>
					) : (
						<p className="text-sm text-slate-500 text-center py-4">{t("company.leaves.requests.noRequests")}</p>
					)}
				</div>

				{/* Low Balances */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
							{t("company.leaves.dashboard.lowBalancesTitle")}
						</h3>
						<Link href={`${base}/balances`}>
							<Button variant="ghost" size="sm" className="rounded-xl text-xs">
								{t("company.common.viewAll")}
							</Button>
						</Link>
					</div>
					{isLoading ? (
						<div className="space-y-3">
							{[...Array(3)].map((_, i) => (
								<div key={i} className="h-10 animate-pulse rounded-xl bg-muted" />
							))}
						</div>
					) : data?.lowBalances?.length ? (
						<div className="space-y-3">
							{data.lowBalances.map((bal) => (
								<div key={bal.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
									<div>
										<p className="font-medium text-sm text-slate-900 dark:text-slate-100">{bal.employee.name}</p>
										<p className="text-xs text-slate-500">{bal.leaveType.name}</p>
									</div>
									<Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-[10px] px-2 py-0.5">
										{bal.remainingDays} {t("company.leaves.days")}
									</Badge>
								</div>
							))}
						</div>
					) : (
						<p className="text-sm text-slate-500 text-center py-4">{t("company.leaves.dashboard.noLowBalances")}</p>
					)}
				</div>
			</div>
		</div>
	);
}
