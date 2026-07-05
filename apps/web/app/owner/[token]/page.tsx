"use client";

import {
	OwnerSummarySectionCards,
	type OwnerSummarySections,
} from "@saas/projects-owner/components/OwnerSummarySectionCards";
import { OwnerSummarySkeleton } from "@saas/projects-owner/components/skeletons";
import { useOwnerSession } from "@saas/projects-owner/hooks/use-owner-session";
import { OWNER_QUERY_FRESHNESS } from "@saas/projects-owner/lib/query-freshness";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { GlassStatCard } from "@ui/components/glass-stat-card";
import { Progress } from "@ui/components/progress";
import {
	Banknote,
	Clock,
	FileText,
	MapPin,
	TrendingUp,
	User,
	Wallet,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

function getStatusBadge(status: string, t: (key: string) => string) {
	switch (status) {
		case "ACTIVE":
			return (
				<Badge className="border-0 bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
					{t("projects.status.ACTIVE")}
				</Badge>
			);
		case "ON_HOLD":
			return (
				<Badge className="border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
					{t("projects.status.ON_HOLD")}
				</Badge>
			);
		case "COMPLETED":
			return (
				<Badge className="border-0 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
					{t("projects.status.COMPLETED")}
				</Badge>
			);
		default:
			return null;
	}
}

function calculateDaysRemaining(endDate: Date | null): number | null {
	if (!endDate) return null;
	const end = new Date(endDate);
	const today = new Date();
	const diff = end.getTime() - today.getTime();
	return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function OwnerPortalSummary() {
	const params = useParams();
	const token = params.token as string;
	const sessionToken = useOwnerSession();
	const t = useTranslations();

	// Prefer the session token (matches the layout), fall back to the URL token.
	const authInput = sessionToken ? { sessionToken } : { token };

	const { data, isLoading } = useQuery(
		orpc.projectOwner.portal.getSummary.queryOptions({
			input: authInput,
			...OWNER_QUERY_FRESHNESS,
		}),
	) as { data: any; isLoading: boolean };

	if (isLoading || !data?.project) {
		return <OwnerSummarySkeleton />;
	}

	const {
		project,
		currentPhase,
		latestOfficialUpdate,
		contractValueWithVat,
		sections,
	} = data as {
		project: any;
		currentPhase: string | null;
		latestOfficialUpdate: any;
		contractValueWithVat: number;
		sections: OwnerSummarySections;
	};
	const daysRemaining = calculateDaysRemaining(project.endDate);
	const progress = Math.round(Number(project.progress));

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Hero header */}
			<div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0">
						<div className="mb-2 flex flex-wrap items-center gap-3">
							<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl">
								{project.name}
							</h2>
							{getStatusBadge(project.status, t)}
						</div>
						<div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-500">
							{project.clientName && (
								<div className="flex items-center gap-1.5">
									<User className="h-4 w-4 shrink-0" />
									<span>{project.clientName}</span>
								</div>
							)}
							{project.location && (
								<div className="flex items-center gap-1.5">
									<MapPin className="h-4 w-4 shrink-0" />
									<span>{project.location}</span>
								</div>
							)}
						</div>
					</div>
					{currentPhase && (
						<Badge className="border-0 bg-primary/10 text-primary">
							{t("ownerPortal.currentPhase")}: {currentPhase}
						</Badge>
					)}
				</div>

				{/* Overall progress */}
				<div className="mt-5">
					<div className="mb-2 flex items-center justify-between">
						<span className="text-sm font-medium text-slate-600 dark:text-slate-400">
							{t("ownerPortal.progress")}
						</span>
						<span className="text-2xl font-bold text-sky-600 dark:text-sky-400">
							{progress}%
						</span>
					</div>
					<Progress value={progress} className="h-3" />
				</div>
			</div>

			{/* KPI row */}
			<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
				<GlassStatCard
					colorScheme="blue"
					icon={
						<Banknote className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					}
					title={t("ownerPortal.contractValue")}
					value={
						contractValueWithVat
							? formatCurrency(Number(contractValueWithVat))
							: project.contractValue
								? formatCurrency(Number(project.contractValue))
								: "-"
					}
					subtitle={t("ownerPortal.contractValueHint")}
				/>
				<GlassStatCard
					colorScheme="sky"
					icon={
						<TrendingUp className="h-5 w-5 text-sky-600 dark:text-sky-400" />
					}
					title={t("ownerPortal.payments.paidPercentage")}
					value={`${sections.payments.collectionPercent}%`}
				/>
				<GlassStatCard
					colorScheme="amber"
					icon={
						<Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
					}
					title={t("ownerPortal.payments.remaining")}
					value={formatCurrency(sections.payments.remaining)}
				/>
				<GlassStatCard
					colorScheme="slate"
					icon={<Clock className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
					title={t("ownerPortal.daysRemaining")}
					value={daysRemaining !== null ? daysRemaining : "-"}
				/>
			</div>

			{/* Live section cards */}
			<OwnerSummarySectionCards
				sections={sections}
				basePath={`/owner/${token}`}
			/>

			{/* Latest official update */}
			{latestOfficialUpdate && (
				<div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
					<div className="mb-4 flex items-center justify-between gap-2">
						<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
							<FileText className="inline h-5 w-5 me-2 text-slate-400" />
							{t("ownerPortal.latestUpdate")}
						</h3>
						<span className="shrink-0 text-xs text-slate-500">
							{new Date(latestOfficialUpdate.createdAt).toLocaleDateString(
								"ar-SA",
							)}
						</span>
					</div>
					<p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
						{latestOfficialUpdate.content}
					</p>
					<p className="mt-2 text-sm text-slate-500">
						— {latestOfficialUpdate.sender.name}
					</p>
				</div>
			)}
		</div>
	);
}
