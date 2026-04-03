"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { ClipboardCheck, Plus, Printer, Eye, Loader2 } from "lucide-react";

// Same pattern as subcontract-shared.ts
function formatCurrency(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

const CLAIM_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
	DRAFT: { bg: "bg-slate-100", text: "text-slate-700" },
	SUBMITTED: { bg: "bg-blue-100", text: "text-blue-700" },
	UNDER_REVIEW: { bg: "bg-amber-100", text: "text-amber-700" },
	APPROVED: { bg: "bg-green-100", text: "text-green-700" },
	REJECTED: { bg: "bg-red-100", text: "text-red-700" },
	PARTIALLY_PAID: { bg: "bg-cyan-100", text: "text-cyan-700" },
	PAID: { bg: "bg-emerald-100", text: "text-emerald-800" },
	CANCELLED: { bg: "bg-gray-100", text: "text-gray-500" },
};

const CLAIM_TYPE_STYLES: Record<string, { bg: string; text: string }> = {
	INTERIM: { bg: "bg-sky-50", text: "text-sky-700" },
	FINAL: { bg: "bg-purple-50", text: "text-purple-700" },
	RETENTION: { bg: "bg-orange-50", text: "text-orange-700" },
};

interface SubcontractClaimsSectionProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
	subcontractId: string;
	contractStatus: string;
}

export const SubcontractClaimsSection = React.memo(function SubcontractClaimsSection({
	organizationId,
	organizationSlug,
	projectId,
	subcontractId,
	contractStatus,
}: SubcontractClaimsSectionProps) {
	const t = useTranslations();

	const basePath = `/app/${organizationSlug}/projects/${projectId}/finance/subcontracts/${subcontractId}`;

	const { data: claims, isLoading } = useQuery(
		orpc.subcontracts.listClaims.queryOptions({
			input: { organizationId, projectId, contractId: subcontractId },
		}),
	);

	const { data: summary } = useQuery(
		orpc.subcontracts.getClaimSummary.queryOptions({
			input: { organizationId, projectId, contractId: subcontractId },
		}),
	);

	const canCreate = contractStatus === "ACTIVE";

	return (
		<div className="overflow-hidden rounded-2xl border border-emerald-200/50 bg-white dark:border-emerald-800/30 dark:bg-slate-900/50">
			<div className="flex items-center justify-between border-b border-emerald-100 p-5 dark:border-emerald-800/30">
				<div className="flex items-center gap-3">
					<div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
						<ClipboardCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
					</div>
					<div>
						<h2 className="font-semibold text-emerald-700 dark:text-emerald-300">
							{t("claims.subcontractClaims")}
						</h2>
						{claims && claims.length > 0 && (
							<span className="text-xs text-slate-500">
								{claims.length} {t("claims.title")}
							</span>
						)}
					</div>
				</div>
				{canCreate && (
					<Link href={`${basePath}/claims/new`}>
						<Button
							variant="outline"
							size="sm"
							className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
						>
							<Plus className="me-1 h-4 w-4" />
							{t("claims.new")}
						</Button>
					</Link>
				)}
			</div>

			{/* Summary badges */}
			{summary && (
				<div className="grid grid-cols-3 gap-3 border-b border-emerald-100/50 p-4 dark:border-emerald-800/20">
					<div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800/50">
						<p className="text-lg font-bold text-slate-800 dark:text-slate-200">
							{formatCurrency(summary.totalClaimed)}
						</p>
						<p className="text-xs text-slate-500">{t("claims.totalClaimed")}</p>
					</div>
					<div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800/50">
						<p className="text-lg font-bold text-green-600">{formatCurrency(summary.totalPaid)}</p>
						<p className="text-xs text-slate-500">{t("claims.totalPaid")}</p>
					</div>
					<div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800/50">
						<p className="text-lg font-bold text-orange-600">{formatCurrency(summary.totalOutstanding)}</p>
						<p className="text-xs text-slate-500">{t("claims.totalOutstanding")}</p>
					</div>
				</div>
			)}

			<div className="p-4">
				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
					</div>
				) : !claims || claims.length === 0 ? (
					<p className="py-6 text-center text-sm text-slate-500">
						{t("claims.empty")}
					</p>
				) : (
					<div className="space-y-2">
						{claims.map((claim: any) => {
							const statusStyle = CLAIM_STATUS_STYLES[claim.status] ?? CLAIM_STATUS_STYLES.DRAFT;
							const typeStyle = CLAIM_TYPE_STYLES[claim.claimType] ?? CLAIM_TYPE_STYLES.INTERIM;
							return (
								<div
									key={claim.id}
									className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"
								>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="text-xs font-medium text-slate-500">#{claim.claimNo}</span>
											<Badge className={`border-0 text-[10px] ${typeStyle.bg} ${typeStyle.text}`}>
												{t(`claims.types.${claim.claimType}`)}
											</Badge>
											<Badge className={`border-0 text-[10px] ${statusStyle.bg} ${statusStyle.text}`}>
												{t(`claims.statuses.${claim.status}`)}
											</Badge>
										</div>
										<p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300 truncate">
											{claim.title}
										</p>
										<div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
											<span>{t("claims.grossAmount")}: {formatCurrency(claim.grossAmount)}</span>
											<span>{t("claims.netAmount")}: {formatCurrency(claim.netAmount)}</span>
										</div>
									</div>
									<div className="flex items-center gap-1.5 ms-3">
										{claim.status !== "DRAFT" && claim.status !== "CANCELLED" && (
											<Link href={`${basePath}/claims/${claim.id}`} target="_blank">
												<Button variant="ghost" size="icon" className="h-7 w-7" title={t("claims.actions.print")}>
													<Printer className="h-3.5 w-3.5" />
												</Button>
											</Link>
										)}
										<Link href={`${basePath}/claims/${claim.id}`}>
											<Button variant="ghost" size="icon" className="h-7 w-7">
												<Eye className="h-3.5 w-3.5" />
											</Button>
										</Link>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
});
