"use client";

import {
	OwnerPaymentMilestonesGrid,
	type OwnerPaymentTerm,
} from "@saas/projects-owner/components/OwnerPaymentMilestonesGrid";
import { OWNER_QUERY_FRESHNESS } from "@saas/projects-owner/lib/query-freshness";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { GlassStatCard } from "@ui/components/glass-stat-card";
import { Skeleton } from "@ui/components/skeleton";
import {
	Banknote,
	CheckCircle,
	ListChecks,
	TrendingUp,
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

function formatDate(date: string | Date | null | undefined): string {
	if (!date) return "-";
	const d = typeof date === "string" ? new Date(date) : date;
	if (Number.isNaN(d.getTime())) return "-";
	return d.toLocaleDateString("ar-SA");
}

function getStatusBadge(status: string, t: (key: string) => string) {
	switch (status) {
		case "DRAFT":
			return (
				<Badge className="border-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
					{t("ownerPortal.payments.statuses.draft")}
				</Badge>
			);
		case "SUBMITTED":
			return (
				<Badge className="border-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
					{t("ownerPortal.payments.statuses.submitted")}
				</Badge>
			);
		case "APPROVED":
			return (
				<Badge className="border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
					{t("ownerPortal.payments.statuses.approved")}
				</Badge>
			);
		case "PAID":
			return (
				<Badge className="border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
					{t("ownerPortal.payments.statuses.paid")}
				</Badge>
			);
		case "REJECTED":
			return (
				<Badge className="border-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
					{t("ownerPortal.payments.statuses.rejected")}
				</Badge>
			);
		default:
			return null;
	}
}

interface OwnerPaymentRow {
	id: string;
	paymentNo: string;
	amount: number;
	date: string | Date | null;
	description: string | null;
	termLabel: string | null;
}

export default function OwnerPortalPayments() {
	const params = useParams();
	const token = params.token as string;
	const t = useTranslations();

	const { data, isLoading } = useQuery(
		orpc.projectOwner.portal.getPayments.queryOptions({
			input: { token },
			...OWNER_QUERY_FRESHNESS,
		}),
	) as { data: any; isLoading: boolean };

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-24 rounded-2xl" />
					))}
				</div>
				<Skeleton className="h-40 w-full rounded-2xl" />
				<Skeleton className="h-48 w-full rounded-2xl" />
			</div>
		);
	}

	if (!data) {
		return null;
	}

	const {
		contractValue,
		paidAmount,
		remaining,
		collectionPercent,
		currentTermId,
		dueOnCurrentStage,
		terms,
		payments,
		claims,
	} = data as {
		contractValue: number;
		paidAmount: number;
		remaining: number;
		collectionPercent: number;
		currentTermId: string | null;
		dueOnCurrentStage: number;
		terms: OwnerPaymentTerm[];
		payments: OwnerPaymentRow[];
		claims: any[];
	};

	return (
		<div className="space-y-4 sm:space-y-6" dir="rtl">
			{/* Header */}
			<div>
				<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl">
					{t("ownerPortal.payments.title")}
				</h2>
				<p className="text-sm text-slate-500 dark:text-slate-400">
					{t("ownerPortal.payments.subtitle")}
				</p>
			</div>

			{/* KPI row */}
			<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
				<GlassStatCard
					colorScheme="blue"
					icon={
						<Banknote className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					}
					title={t("ownerPortal.payments.contractValue")}
					value={formatCurrency(contractValue)}
					subtitle={t("ownerPortal.contractValueHint")}
				/>
				<GlassStatCard
					colorScheme="green"
					icon={
						<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
					}
					title={t("ownerPortal.payments.totalPaid")}
					value={formatCurrency(paidAmount)}
				/>
				<GlassStatCard
					colorScheme="amber"
					icon={
						<Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
					}
					title={t("ownerPortal.payments.remaining")}
					value={formatCurrency(remaining)}
				/>
				<GlassStatCard
					colorScheme="sky"
					icon={
						<TrendingUp className="h-5 w-5 text-sky-600 dark:text-sky-400" />
					}
					title={t("ownerPortal.payments.paidPercentage")}
					value={`${Math.round(collectionPercent)}%`}
				/>
			</div>

			{/* Due on current stage */}
			{dueOnCurrentStage > 0 && (
				<div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 dark:border-sky-900 dark:bg-sky-950/30">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<h3 className="font-semibold text-sky-800 dark:text-sky-300">
							{t("ownerPortal.payments.dueCurrentStage")}
						</h3>
						<p className="text-xl font-bold text-sky-800 dark:text-sky-300">
							{formatCurrency(dueOnCurrentStage)}
						</p>
					</div>
				</div>
			)}

			{/* Payment milestones / stages */}
			{terms.length > 0 && (
				<div className="space-y-4">
					<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
						{t("ownerPortal.payments.stagesTitle")}
					</h3>
					<OwnerPaymentMilestonesGrid
						terms={terms}
						currentTermId={currentTermId}
					/>
				</div>
			)}

			{/* Recorded payments */}
			<div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
				<h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100 sm:mb-6">
					<ListChecks className="h-5 w-5 text-slate-400" />
					{t("ownerPortal.payments.recordedTitle")}
				</h3>

				{payments.length === 0 ? (
					<p className="py-8 text-center text-slate-500">
						{t("ownerPortal.payments.noPayments")}
					</p>
				) : (
					<>
						{/* Mobile: card list */}
						<div className="space-y-2.5 sm:hidden">
							{payments.map((p) => (
								<div
									key={p.id}
									className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800"
								>
									<div className="flex items-start justify-between gap-2">
										<div className="min-w-0">
											<p className="font-medium text-slate-900 dark:text-slate-100">
												{p.paymentNo}
											</p>
											<p className="truncate text-xs text-slate-500 dark:text-slate-400">
												{p.termLabel || p.description || "-"}
											</p>
										</div>
										<p className="shrink-0 font-semibold text-green-700 dark:text-green-400">
											{formatCurrency(Number(p.amount))}
										</p>
									</div>
									<p className="mt-2 text-xs text-slate-400">
										{formatDate(p.date)}
									</p>
								</div>
							))}
						</div>

						{/* Desktop: table */}
						<div className="hidden overflow-x-auto sm:block">
							<table className="w-full min-w-[480px]">
								<thead>
									<tr className="border-b border-slate-200 dark:border-slate-700">
										<th className="pb-3 text-start text-sm font-medium text-slate-500">
											{t("ownerPortal.payments.paymentNo")}
										</th>
										<th className="pb-3 text-start text-sm font-medium text-slate-500">
											{t("ownerPortal.payments.stage")}
										</th>
										<th className="pb-3 text-start text-sm font-medium text-slate-500">
											{t("ownerPortal.payments.amount")}
										</th>
										<th className="pb-3 text-start text-sm font-medium text-slate-500">
											{t("ownerPortal.payments.date")}
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
									{payments.map((p) => (
										<tr key={p.id}>
											<td className="py-4 font-medium text-slate-900 dark:text-slate-100">
												{p.paymentNo}
											</td>
											<td className="py-4 text-slate-600 dark:text-slate-400">
												{p.termLabel || p.description || "-"}
											</td>
											<td className="py-4 font-medium text-green-700 dark:text-green-400">
												{formatCurrency(Number(p.amount))}
											</td>
											<td className="py-4 text-slate-600 dark:text-slate-400">
												{formatDate(p.date)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</>
				)}
			</div>

			{/* Claims / مستخلصات */}
			<div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
				<h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100 sm:mb-6">
					{t("ownerPortal.payments.claimsTitle")}
				</h3>

				{claims.length === 0 ? (
					<p className="py-8 text-center text-slate-500">
						{t("ownerPortal.payments.noClaims")}
					</p>
				) : (
					<>
						{/* Mobile: card list */}
						<div className="space-y-2.5 sm:hidden">
							{claims.map((claim: any) => (
								<div
									key={claim.id}
									className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800"
								>
									<div className="flex items-start justify-between gap-2">
										<p className="font-medium text-slate-900 dark:text-slate-100">
											#{claim.claimNo}
										</p>
										{getStatusBadge(claim.status, t)}
									</div>
									<div className="mt-2 flex items-center justify-between gap-2">
										<p className="font-semibold text-slate-900 dark:text-slate-100">
											{formatCurrency(Number(claim.amount))}
										</p>
										<p className="text-xs text-slate-400">
											{formatDate(claim.dueDate)}
										</p>
									</div>
									{claim.periodStart && claim.periodEnd && (
										<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
											{formatDate(claim.periodStart)} -{" "}
											{formatDate(claim.periodEnd)}
										</p>
									)}
								</div>
							))}
						</div>

						{/* Desktop: table */}
						<div className="hidden overflow-x-auto sm:block">
						<table className="w-full min-w-[480px]">
							<thead>
								<tr className="border-b border-slate-200 dark:border-slate-700">
									<th className="pb-3 text-start text-sm font-medium text-slate-500">
										{t("ownerPortal.payments.claimNo")}
									</th>
									<th className="pb-3 text-start text-sm font-medium text-slate-500">
										{t("ownerPortal.payments.period")}
									</th>
									<th className="pb-3 text-start text-sm font-medium text-slate-500">
										{t("ownerPortal.payments.amount")}
									</th>
									<th className="pb-3 text-start text-sm font-medium text-slate-500">
										{t("ownerPortal.payments.dueDate")}
									</th>
									<th className="pb-3 text-start text-sm font-medium text-slate-500">
										{t("ownerPortal.payments.status")}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
								{claims.map((claim: any) => (
									<tr key={claim.id}>
										<td className="py-4">
											<span className="font-medium text-slate-900 dark:text-slate-100">
												#{claim.claimNo}
											</span>
										</td>
										<td className="py-4 text-slate-600 dark:text-slate-400">
											{claim.periodStart && claim.periodEnd
												? `${formatDate(claim.periodStart)} - ${formatDate(claim.periodEnd)}`
												: "-"}
										</td>
										<td className="py-4 font-medium text-slate-900 dark:text-slate-100">
											{formatCurrency(Number(claim.amount))}
										</td>
										<td className="py-4 text-slate-600 dark:text-slate-400">
											{formatDate(claim.dueDate)}
										</td>
										<td className="py-4">{getStatusBadge(claim.status, t)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</>
				)}
			</div>
		</div>
	);
}
