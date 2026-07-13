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
import { CompactStatGrid } from "@saas/shared/components/mobile/CompactStatGrid";

interface LeavesMiniSectionProps {
	organizationId: string;
	organizationSlug: string;
}

type LeaveSection = "requests" | "balances" | "types";

const SECTION_CONFIG: { id: LeaveSection; icon: typeof ClipboardList; color: string; bg: string }[] = [
	{ id: "requests", icon: ClipboardList, color: "text-chart-4", bg: "bg-chart-4/15" },
	{ id: "balances", icon: Wallet, color: "text-success", bg: "bg-success/15" },
	{ id: "types", icon: Settings, color: "text-chart-4", bg: "bg-chart-4/15" },
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
		<div className="space-y-6">
			{/* الجوال: شريط إحصائيات مضغوط */}
			<CompactStatGrid
				className="sm:hidden"
				items={[
					{
						label: t("company.leaves.dashboard.onLeaveToday"),
						value: isLoading ? "..." : data?.onLeaveToday?.length ?? 0,
						icon: Users,
						iconClassName: "text-chart-4",
						iconBgClassName: "bg-chart-4/15",
					},
					{
						label: t("company.leaves.dashboard.pendingRequests"),
						value: isLoading ? "..." : data?.pendingRequests ?? 0,
						icon: Clock,
						iconClassName: "text-chart-1",
						iconBgClassName: "bg-chart-1/15",
					},
					{
						label: t("company.leaves.dashboard.lowBalances"),
						value: isLoading ? "..." : data?.lowBalances?.length ?? 0,
						icon: AlertTriangle,
						iconClassName: "text-destructive",
						iconBgClassName: "bg-destructive/15",
					},
				]}
			/>

			{/* Summary Cards (الديسكتوب كما هو) */}
			<div className="hidden sm:grid sm:grid-cols-3 gap-4">
				<div className="bg-card border-2 rounded-2xl p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
							<Users className="h-5 w-5" />
						</div>
					</div>
					<p className="text-xs font-medium text-muted-foreground mb-1">
						{t("company.leaves.dashboard.onLeaveToday")}
					</p>
					<p className="text-2xl font-bold text-chart-4">
						{isLoading ? "..." : data?.onLeaveToday?.length ?? 0}
					</p>
				</div>

				<div className="bg-card border-2 rounded-2xl p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="flex size-9 items-center justify-center rounded-xl bg-chart-1/15 text-chart-1">
							<Clock className="h-5 w-5" />
						</div>
					</div>
					<p className="text-xs font-medium text-muted-foreground mb-1">
						{t("company.leaves.dashboard.pendingRequests")}
					</p>
					<p className="text-2xl font-bold text-chart-1">
						{isLoading ? "..." : data?.pendingRequests ?? 0}
					</p>
				</div>

				<div className="bg-card border-2 rounded-2xl p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="flex size-9 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
							<AlertTriangle className="h-5 w-5" />
						</div>
					</div>
					<p className="text-xs font-medium text-muted-foreground mb-1">
						{t("company.leaves.dashboard.lowBalances")}
					</p>
					<p className="text-2xl font-bold text-destructive">
						{isLoading ? "..." : data?.lowBalances?.length ?? 0}
					</p>
				</div>
			</div>

			{/* Segmented Pills */}
			<div className="flex gap-2 p-1 rounded-xl bg-muted w-fit">
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
									? "bg-card text-card-foreground"
									: "text-muted-foreground hover:text-card-foreground"
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
