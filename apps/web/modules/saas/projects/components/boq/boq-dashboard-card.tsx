"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { EmptyState } from "@ui/components/empty-state";
import { Skeleton } from "@ui/components/skeleton";

interface BOQDashboardCardProps {
	organizationId: string;
	projectId: string;
	basePath: string;
}

function formatNumber(value: number): string {
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

export function BOQDashboardCard({
	organizationId,
	projectId,
	basePath,
}: BOQDashboardCardProps) {
	const t = useTranslations("projectBoq");
	const tCommon = useTranslations("common");

	const { data: summary, isLoading } = useQuery(
		orpc.projectBoq.getSummary.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	if (isLoading) {
		return (
			<div className="flex flex-col overflow-hidden rounded-2xl border-2 bg-card">
				<div className="flex items-center justify-between border-b-2 px-5 py-3.5">
					<Skeleton className="h-5 w-32" />
				</div>
				<div className="p-5 space-y-3">
					<Skeleton className="h-10 w-full rounded-lg" />
					<div className="grid grid-cols-2 gap-2">
						<Skeleton className="h-16 rounded-lg" />
						<Skeleton className="h-16 rounded-lg" />
					</div>
				</div>
			</div>
		);
	}

	const isEmpty = !summary || summary.totalItems === 0;

	return (
		<div className="flex flex-col overflow-hidden rounded-2xl border-2 bg-card">
			{/* Header */}
			<div className="flex items-center justify-between border-b-2 px-5 py-3.5">
				<div className="flex items-center gap-2">
					<div className="flex size-8 items-center justify-center rounded-xl bg-success/15 text-success">
						<ClipboardList className="h-4 w-4" />
					</div>
					<h3 className="text-base font-semibold text-card-foreground">
						{t("title")}
					</h3>
				</div>
				{!isEmpty && (
					<span className="inline-flex items-center rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
						{summary.totalItems} {t("dashboard.items")}
					</span>
				)}
			</div>

			{/* Body */}
			<div className="flex flex-1 flex-col gap-3.5 p-5">
				{isEmpty ? (
					<EmptyState
						icon={<ClipboardList className="h-8 w-8" />}
						description={t("dashboard.noItems")}
					/>
				) : (
					<>
						{/* Grand Total */}
						<div className="rounded-xl border-2 bg-card p-3.5">
							<div className="text-[11px] text-muted-foreground">
								{t("summary.grandTotal")}
							</div>
							<div
								className="text-xl font-bold text-success"
								dir="ltr"
								style={{ textAlign: "right" }}
							>
								{formatNumber(summary.grandTotal)} {tCommon("sar")}
							</div>
						</div>

						{/* Priced / Unpriced */}
						<div className="grid grid-cols-2 gap-2">
							<div className="rounded-lg bg-muted p-2.5">
								<div className="truncate text-[11px] text-muted-foreground">
									{t("summary.pricedItems")}
								</div>
								<div className="text-base font-bold leading-tight text-success">
									{summary.pricedItems}
								</div>
							</div>
							<div className="rounded-lg bg-muted p-2.5">
								<div className="truncate text-[11px] text-muted-foreground">
									{t("summary.unpricedItems")}
								</div>
								<div className={`text-base font-bold leading-tight ${summary.unpricedItems > 0 ? "text-chart-1" : "text-muted-foreground"}`}>
									{summary.unpricedItems}
								</div>
							</div>
						</div>

						{/* Estimated vs label */}
						{summary.grandTotal > 0 && (
							<div className="flex items-center justify-between text-[11px] text-muted-foreground">
								<span>{t("dashboard.estimatedCost")}</span>
								<span
									className="font-semibold text-success"
									dir="ltr"
								>
									{formatNumber(summary.grandTotal)} {tCommon("sar")}
								</span>
							</div>
						)}
					</>
				)}

				{/* View Details Link */}
				<Link
					href={`${basePath}/quantities`}
					className="mt-auto flex items-center justify-center gap-1.5 rounded-lg border-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
				>
					{t("dashboard.viewDetails")}
					<ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
				</Link>
			</div>
		</div>
	);
}
