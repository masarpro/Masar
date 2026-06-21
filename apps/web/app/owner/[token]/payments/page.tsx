"use client";

import {
	OwnerPaymentMilestonesGrid,
	type OwnerPaymentTerm,
} from "@saas/projects-owner/components/OwnerPaymentMilestonesGrid";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
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
		<div className="space-y-6">
			{/* Summary Cards */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<div className="rounded-2xl bg-indigo-50 p-5 dark:bg-indigo-950/30">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-indigo-100 p-2.5 dark:bg-indigo-900/50">
							<Banknote className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
						</div>
						<div>
							<p className="text-xs text-indigo-600 dark:text-indigo-400">
								{t("ownerPortal.payments.contractValue")}
							</p>
							<p className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">
								{formatCurrency(contractValue)}
							</p>
							<p className="mt-0.5 text-[10px] text-indigo-500/70 dark:text-indigo-400/70">
								{t("ownerPortal.contractValueHint")}
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-2xl bg-green-50 p-5 dark:bg-green-950/30">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-green-100 p-2.5 dark:bg-green-900/50">
							<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
						</div>
						<div>
							<p className="text-xs text-green-600 dark:text-green-400">
								{t("ownerPortal.payments.paidAmount")}
							</p>
							<p className="text-lg font-semibold text-green-700 dark:text-green-300">
								{formatCurrency(paidAmount)}
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-2xl bg-amber-50 p-5 dark:bg-amber-950/30">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-amber-100 p-2.5 dark:bg-amber-900/50">
							<Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
						</div>
						<div>
							<p className="text-xs text-amber-600 dark:text-amber-400">
								{t("ownerPortal.payments.remaining")}
							</p>
							<p className="text-lg font-semibold text-amber-700 dark:text-amber-300">
								{formatCurrency(remaining)}
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-2xl bg-sky-50 p-5 dark:bg-sky-950/30">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-sky-100 p-2.5 dark:bg-sky-900/50">
							<TrendingUp className="h-5 w-5 text-sky-600 dark:text-sky-400" />
						</div>
						<div>
							<p className="text-xs text-sky-600 dark:text-sky-400">
								{t("ownerPortal.payments.paidPercentage")}
							</p>
							<p className="text-lg font-semibold text-sky-700 dark:text-sky-300">
								{Math.round(collectionPercent)}%
							</p>
						</div>
					</div>
				</div>
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
			<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
				<h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
					<ListChecks className="h-5 w-5 text-slate-400" />
					{t("ownerPortal.payments.recordedTitle")}
				</h3>

				{payments.length === 0 ? (
					<p className="py-8 text-center text-slate-500">
						{t("ownerPortal.payments.noPayments")}
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
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
				)}
			</div>

			{/* Claims / مستخلصات */}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
				<h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
					{t("ownerPortal.payments.claimsTitle")}
				</h3>

				{claims.length === 0 ? (
					<p className="py-8 text-center text-slate-500">
						{t("ownerPortal.payments.noClaims")}
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
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
				)}
			</div>
		</div>
	);
}
