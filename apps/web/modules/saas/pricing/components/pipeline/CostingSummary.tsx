"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import { useTranslations } from "next-intl";
import { SECTION_LABELS } from "../../lib/costing-constants";
import { formatAmount } from "../../lib/utils";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface CostingSummaryProps {
	organizationId: string;
	studyId: string;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function CostingSummary({
	organizationId,
	studyId,
}: CostingSummaryProps) {
	const t = useTranslations();

	const { data, isLoading } = useQuery(
		orpc.pricing.studies.costing.getSummary.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	if (isLoading) {
		return (
			<Card>
				<CardContent className="p-4">
					<Skeleton className="h-32 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!data) return null;

	return (
		<Card dir="rtl">
			<CardHeader className="pb-3">
				<CardTitle className="text-base">
					{t("pricing.pipeline.costingSummaryTitle")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/50 text-muted-foreground">
								<th className="px-3 py-2 text-right font-medium">{t("pricing.pipeline.costingSection")}</th>
								<th className="px-3 py-2 text-left font-medium">{t("pricing.pipeline.costingMaterial")}</th>
								<th className="px-3 py-2 text-left font-medium">{t("pricing.pipeline.costingLabor")}</th>
								<th className="px-3 py-2 text-left font-medium">{t("pricing.pipeline.costingStorage")}</th>
								<th className="px-3 py-2 text-left font-medium">{t("pricing.pipeline.costingTotal")}</th>
							</tr>
						</thead>
						<tbody>
							{data.sections.map((sec) => (
								<tr key={sec.section} className="border-b">
									<td className="px-3 py-2 font-medium">
										{SECTION_LABELS[sec.section] || sec.section}
									</td>
									<td className="px-3 py-2 tabular-nums text-left" dir="ltr">
										{formatAmount(sec.materialTotal)}
									</td>
									<td className="px-3 py-2 tabular-nums text-left" dir="ltr">
										{formatAmount(sec.laborTotal)}
									</td>
									<td className="px-3 py-2 tabular-nums text-left" dir="ltr">
										{formatAmount(sec.storageTotal)}
									</td>
									<td className="px-3 py-2 tabular-nums text-left font-medium" dir="ltr">
										{formatAmount(sec.total)}
									</td>
								</tr>
							))}

							{/* Grand total row */}
							<tr className="border-t-2 bg-muted/30 font-semibold">
								<td className="px-3 py-2">{t("pricing.pipeline.costingGrandTotal")}</td>
								<td className="px-3 py-2 tabular-nums text-left" dir="ltr">
									{formatAmount(data.grandTotal.material)}
								</td>
								<td className="px-3 py-2 tabular-nums text-left" dir="ltr">
									{formatAmount(data.grandTotal.labor)}
								</td>
								<td className="px-3 py-2 tabular-nums text-left" dir="ltr">
									{formatAmount(data.grandTotal.storage)}
								</td>
								<td className="px-3 py-2 tabular-nums text-left" dir="ltr">
									{formatAmount(data.grandTotal.total)}
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				{/* Overhead row */}
				<div className="mt-4 flex items-center justify-between border-t pt-3">
					<span className="text-sm text-muted-foreground">
						{t("pricing.pipeline.costingOverhead")} ({data.overheadPercent}%)
					</span>
					<span className="text-sm font-medium tabular-nums" dir="ltr">
						{formatAmount(data.overheadAmount)} ر.س
					</span>
				</div>

				{/* Total with overhead */}
				<div className="flex items-center justify-between mt-2 pt-2 border-t">
					<span className="font-semibold">
						{t("pricing.pipeline.costingTotalWithOverhead")}
					</span>
					<span className="text-lg font-bold text-primary tabular-nums" dir="ltr">
						{formatAmount(data.costWithOverhead)} ر.س
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
