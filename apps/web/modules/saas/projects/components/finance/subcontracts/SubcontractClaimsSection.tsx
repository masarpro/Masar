"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { formatSAR } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Badge } from "@ui/components/badge";
import { statusToneClasses } from "@ui/components/status-chip";
import { Button } from "@ui/components/button";
import { ClipboardCheck, Plus, Printer, Eye, Loader2 } from "lucide-react";

const CLAIM_TYPE_STYLES: Record<string, { bg: string; text: string }> = {
	INTERIM: { bg: "bg-chart-4/15", text: "text-chart-4" },
	FINAL: { bg: "bg-chart-4/15", text: "text-chart-4" },
	RETENTION: { bg: "bg-chart-1/20", text: "text-chart-1" },
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
		<div className="overflow-hidden rounded-2xl border border-success bg-white dark:border-success dark:bg-muted">
			<div className="flex items-center justify-between border-b border-success p-5 dark:border-success">
				<div className="flex items-center gap-3">
					<div className="rounded-lg bg-success/15 p-2 dark:bg-success/20">
						<ClipboardCheck className="h-5 w-5 text-success dark:text-success" />
					</div>
					<div>
						<h2 className="font-semibold text-success dark:text-success">
							{t("claims.subcontractClaims")}
						</h2>
						{claims && claims.length > 0 && (
							<span className="text-xs text-muted-foreground">
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
							className="rounded-xl border-success text-success hover:bg-success/15 dark:border-success dark:text-success"
						>
							<Plus className="me-1 h-4 w-4" />
							{t("claims.new")}
						</Button>
					</Link>
				)}
			</div>

			{/* Summary badges */}
			{summary && (
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-success p-4 dark:border-success">
					<div className="rounded-lg bg-muted p-3 text-center dark:bg-muted">
						<p className="text-lg font-bold text-muted-foreground dark:text-muted-foreground">
							{formatSAR(summary.totalClaimed)}
						</p>
						<p className="text-xs text-muted-foreground">{t("claims.totalClaimed")}</p>
					</div>
					<div className="rounded-lg bg-muted p-3 text-center dark:bg-muted">
						<p className="text-lg font-bold text-success">{formatSAR(summary.totalPaid)}</p>
						<p className="text-xs text-muted-foreground">{t("claims.totalPaid")}</p>
					</div>
					<div className="rounded-lg bg-muted p-3 text-center dark:bg-muted">
						<p className="text-lg font-bold text-chart-1">{formatSAR(summary.totalOutstanding)}</p>
						<p className="text-xs text-muted-foreground">{t("claims.totalOutstanding")}</p>
					</div>
				</div>
			)}

			<div className="p-4">
				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-success" />
					</div>
				) : !claims || claims.length === 0 ? (
					<p className="py-6 text-center text-sm text-muted-foreground">
						{t("claims.empty.title")}
					</p>
				) : (
					<div className="space-y-2">
						{claims.map((claim: any) => {
							const typeStyle = CLAIM_TYPE_STYLES[claim.claimType] ?? CLAIM_TYPE_STYLES.INTERIM;
							return (
								<div
									key={claim.id}
									className="flex items-center justify-between rounded-xl bg-muted p-3 dark:bg-muted"
								>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="text-xs font-medium text-muted-foreground">#{claim.claimNo}</span>
											<Badge className={`border-0 text-[10px] ${typeStyle.bg} ${typeStyle.text}`}>
												{t(`claims.types.${claim.claimType}`)}
											</Badge>
											<Badge className={`border-0 text-[10px] ${statusToneClasses(claim.status)}`}>
												{t(`claims.statuses.${claim.status}`)}
											</Badge>
										</div>
										<p className="mt-0.5 text-sm text-muted-foreground dark:text-muted-foreground truncate">
											{claim.title}
										</p>
										<div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
											<span>{t("claims.grossAmount")}: {formatSAR(claim.grossAmount)}</span>
											<span>{t("claims.netAmount")}: {formatSAR(claim.netAmount)}</span>
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
