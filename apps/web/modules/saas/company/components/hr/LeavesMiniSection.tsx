"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useState } from "react";
import { Badge } from "@ui/components/badge";
import {
	Users,
	Clock,
	AlertTriangle,
	ClipboardList,
	Wallet,
	Settings,
} from "lucide-react";
import { LeaveRequestList } from "@saas/company/components/leaves/LeaveRequestList";
import { LeaveBalanceList } from "@saas/company/components/leaves/LeaveBalanceList";
import { LeaveTypeList } from "@saas/company/components/leaves/LeaveTypeList";

interface LeavesMiniSectionProps {
	organizationId: string;
	organizationSlug: string;
}

type LeaveSection = "requests" | "balances" | "types";

const SECTION_CONFIG: { id: LeaveSection; icon: typeof ClipboardList; color: string; bg: string }[] = [
	{ id: "requests", icon: ClipboardList, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
	{ id: "balances", icon: Wallet, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
	{ id: "types", icon: Settings, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30" },
];

export function LeavesMiniSection({ organizationId, organizationSlug }: LeavesMiniSectionProps) {
	const t = useTranslations();
	const [activeSection, setActiveSection] = useState<LeaveSection>("requests");

	const { data, isLoading } = useQuery(
		orpc.company.leaves.dashboard.queryOptions({
			input: { organizationId },
		}),
	);

	return (
		<div className="space-y-6" dir="rtl">
			{/* Summary Cards */}
			<div className="grid grid-cols-3 gap-4">
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
			</div>

			{/* Segmented Pills */}
			<div className="flex gap-2 p-1 rounded-xl backdrop-blur-xl bg-slate-100/80 dark:bg-slate-800/50 w-fit">
				{SECTION_CONFIG.map((section) => {
					const Icon = section.icon;
					const isActive = activeSection === section.id;
					return (
						<button
							key={section.id}
							type="button"
							onClick={() => setActiveSection(section.id)}
							className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
								isActive
									? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100"
									: "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
							}`}
						>
							<Icon className="h-4 w-4" />
							{t(`company.hr.leaves.sections.${section.id}`)}
						</button>
					);
				})}
			</div>

			{/* Content */}
			{activeSection === "requests" && (
				<LeaveRequestList organizationId={organizationId} organizationSlug={organizationSlug} />
			)}
			{activeSection === "balances" && (
				<LeaveBalanceList organizationId={organizationId} organizationSlug={organizationSlug} />
			)}
			{activeSection === "types" && (
				<LeaveTypeList organizationId={organizationId} organizationSlug={organizationSlug} />
			)}
		</div>
	);
}
