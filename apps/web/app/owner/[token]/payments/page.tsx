"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import {
	Banknote,
	CheckCircle,
	Clock,
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

function getStatusBadge(status: string, t: (key: string) => string) {
	switch (status) {
		case "DRAFT":
			return (
				<Badge className="border-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
					{t("ownerPortal.payments.status.draft")}
				</Badge>
			);
		case "SUBMITTED":
			return (
				<Badge className="border-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
					{t("ownerPortal.payments.status.submitted")}
				</Badge>
			);
		case "APPROVED":
			return (
				<Badge className="border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
					{t("ownerPortal.payments.status.approved")}
				</Badge>
			);
		case "PAID":
			return (
				<Badge className="border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
					{t("ownerPortal.payments.status.paid")}
				</Badge>
			);
		case "REJECTED":
			return (
				<Badge className="border-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
					{t("ownerPortal.payments.status.rejected")}
				</Badge>
			);
		default:
			return null;
	}
}

export default function OwnerPortalPayments() {
	const params = useParams();
	const token = params.token as string;
	const t = useTranslations();

	const { data, isLoading } = useQuery(
		orpc.projectOwner.portal.getPayments.queryOptions({
			input: { token },
		}),
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="h-12 w-12 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	if (!data) {
		return null;
	}

	const { contractValue, paidAmount, remaining, claims } = data;
	const paidPercentage = contractValue > 0 ? (paidAmount / contractValue) * 100 : 0;

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

				<div className="rounded-2xl bg-teal-50 p-5 dark:bg-teal-950/30">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-teal-100 p-2.5 dark:bg-teal-900/50">
							<TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
						</div>
						<div>
							<p className="text-xs text-teal-600 dark:text-teal-400">
								{t("ownerPortal.payments.paidPercentage")}
							</p>
							<p className="text-lg font-semibold text-teal-700 dark:text-teal-300">
								{Math.round(paidPercentage)}%
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Payment Claims Table */}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
				<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
					{t("ownerPortal.payments.claimsTitle")}
				</h3>

				{claims.length === 0 ? (
					<p className="text-center text-slate-500 py-8">
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
								{claims.map((claim) => (
									<tr key={claim.id}>
										<td className="py-4">
											<span className="font-medium text-slate-900 dark:text-slate-100">
												#{claim.claimNo}
											</span>
										</td>
										<td className="py-4 text-slate-600 dark:text-slate-400">
											{claim.periodStart && claim.periodEnd
												? `${new Date(claim.periodStart).toLocaleDateString("ar-SA")} - ${new Date(claim.periodEnd).toLocaleDateString("ar-SA")}`
												: "-"}
										</td>
										<td className="py-4 font-medium text-slate-900 dark:text-slate-100">
											{formatCurrency(Number(claim.amount))}
										</td>
										<td className="py-4 text-slate-600 dark:text-slate-400">
											{claim.dueDate
												? new Date(claim.dueDate).toLocaleDateString("ar-SA")
												: "-"}
										</td>
										<td className="py-4">
											{getStatusBadge(claim.status, t)}
										</td>
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
