"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import {
	Building2,
	Hammer,
	PaintBucket,
	Wrench,
	FileEdit,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface QuantitiesSummaryProps {
	organizationId: string;
	studyId: string;
}

export function QuantitiesSummary({
	organizationId,
	studyId,
}: QuantitiesSummaryProps) {
	const t = useTranslations();

	const { data, isLoading } = useQuery(
		orpc.pricing.studies.quantitiesSummary.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const sections = [
		{
			label: t("pricing.pipeline.summaryStructural"),
			count: (data as any)?.structural ?? 0,
			icon: Building2,
			color: "text-blue-600",
			bg: "bg-blue-50 dark:bg-blue-950/30",
		},
		{
			label: t("pricing.pipeline.summaryFinishing"),
			count: (data as any)?.finishing ?? 0,
			icon: PaintBucket,
			color: "text-amber-600",
			bg: "bg-amber-50 dark:bg-amber-950/30",
		},
		{
			label: t("pricing.pipeline.summaryMep"),
			count: (data as any)?.mep ?? 0,
			icon: Wrench,
			color: "text-emerald-600",
			bg: "bg-emerald-50 dark:bg-emerald-950/30",
		},
		{
			label: t("pricing.pipeline.summaryManual"),
			count: (data as any)?.manual ?? 0,
			icon: FileEdit,
			color: "text-purple-600",
			bg: "bg-purple-50 dark:bg-purple-950/30",
		},
	];

	return (
		<Card dir="rtl">
			<CardContent className="p-4">
				<div className="flex items-center justify-between mb-3">
					<h3 className="font-semibold text-sm">
						{t("pricing.pipeline.quantitiesSummary")}
					</h3>
					{!isLoading && (
						<span className="text-xs text-muted-foreground">
							{t("pricing.pipeline.totalItems")}: {(data as any)?.total ?? 0}
						</span>
					)}
				</div>

				<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
					{sections.map((section) => {
						const Icon = section.icon;
						return (
							<div
								key={section.label}
								className={`flex items-center gap-2 rounded-lg p-2.5 ${section.bg}`}
							>
								<Icon className={`h-4 w-4 shrink-0 ${section.color}`} />
								<div className="min-w-0">
									<p className="text-xs text-muted-foreground truncate">
										{section.label}
									</p>
									{isLoading ? (
										<Skeleton className="h-4 w-8 mt-0.5" />
									) : (
										<p className="text-sm font-semibold tabular-nums">
											{section.count} {t("pricing.pipeline.itemUnit")}
										</p>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
