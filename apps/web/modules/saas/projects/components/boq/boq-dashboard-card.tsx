"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Skeleton } from "@ui/components/skeleton";

interface BOQDashboardCardProps {
	organizationId: string;
	projectId: string;
	basePath: string;
}

function formatNumber(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
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

	const { data: summary, isLoading } = useQuery(
		orpc.projectBoq.getSummary.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	if (isLoading) {
		return (
			<div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-black/5 dark:border-slate-700/50 dark:bg-slate-900/50">
				<div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
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
		<div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-black/5 dark:border-slate-700/50 dark:bg-slate-900/50">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
				<div className="flex items-center gap-2">
					<div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/40">
						<ClipboardList className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
					</div>
					<h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-200">
						{t("title")}
					</h3>
				</div>
				{!isEmpty && (
					<span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
						{summary.totalItems} {t("dashboard.items")}
					</span>
				)}
			</div>

			{/* Body */}
			<div className="flex flex-1 flex-col gap-3.5 p-5">
				{isEmpty ? (
					<div className="flex flex-col items-center justify-center py-6 text-center">
						<ClipboardList className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
						<p className="text-sm text-slate-500">
							{t("dashboard.noItems")}
						</p>
					</div>
				) : (
					<>
						{/* Grand Total */}
						<div className="rounded-xl border border-emerald-200 bg-gradient-to-bl from-emerald-50 to-emerald-50/50 p-3.5 dark:border-emerald-800/30 dark:from-emerald-950/30 dark:to-emerald-950/10">
							<div className="text-[11px] text-slate-500">
								{t("summary.grandTotal")}
							</div>
							<div
								className="text-xl font-bold text-emerald-700 dark:text-emerald-400"
								dir="ltr"
								style={{ textAlign: "right" }}
							>
								{formatNumber(summary.grandTotal)} ر.س
							</div>
						</div>

						{/* Priced / Unpriced */}
						<div className="grid grid-cols-2 gap-2">
							<div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
								<div className="truncate text-[11px] text-slate-400">
									{t("summary.pricedItems")}
								</div>
								<div className="text-base font-bold leading-tight text-emerald-600 dark:text-emerald-400">
									{summary.pricedItems}
								</div>
							</div>
							<div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
								<div className="truncate text-[11px] text-slate-400">
									{t("summary.unpricedItems")}
								</div>
								<div className={`text-base font-bold leading-tight ${summary.unpricedItems > 0 ? "text-amber-500" : "text-slate-400"}`}>
									{summary.unpricedItems}
								</div>
							</div>
						</div>

						{/* Estimated vs label */}
						{summary.grandTotal > 0 && (
							<div className="flex items-center justify-between text-[11px] text-slate-400">
								<span>{t("dashboard.estimatedCost")}</span>
								<span
									className="font-semibold text-emerald-600 dark:text-emerald-400"
									dir="ltr"
								>
									{formatNumber(summary.grandTotal)} ر.س
								</span>
							</div>
						)}
					</>
				)}

				{/* View Details Link */}
				<Link
					href={`${basePath}/quantities`}
					className="mt-auto flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
				>
					{t("dashboard.viewDetails")}
					<ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
				</Link>
			</div>
		</div>
	);
}
