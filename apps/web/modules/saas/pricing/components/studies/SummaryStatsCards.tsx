"use client";

import { Card, CardContent } from "@ui/components/card";
import { Box, Columns3, Grid3X3, Ruler } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatNumber } from "../../lib/utils";

interface SummaryStatsCardsProps {
	structural: {
		concrete: number;
		rebar: number;
		blocks?: number;
		formwork?: number;
	};
}

export function SummaryStatsCards({
	structural,
}: SummaryStatsCardsProps) {
	const t = useTranslations();

	const cards = [
		{
			title: t("pricing.studies.summary.totalConcrete"),
			icon: Box,
			value: structural.concrete > 0 ? formatNumber(structural.concrete) : "—",
			unit: structural.concrete > 0 ? t("pricing.studies.units.m3") : "",
			color: "text-chart-4",
			bgColor: "bg-chart-4/15",
			borderColor: "border-2",
		},
		{
			title: t("pricing.studies.summary.totalRebar"),
			icon: Columns3,
			value: structural.rebar > 0 ? formatNumber(structural.rebar / 1000, 2) : "—",
			unit: structural.rebar > 0 ? t("pricing.studies.units.ton") : "",
			subValue: structural.rebar > 0 ? `(${formatNumber(structural.rebar)} ${t("pricing.studies.units.kg")})` : undefined,
			color: "text-chart-1",
			bgColor: "bg-chart-1/15",
			borderColor: "border-2",
		},
		{
			title: "إجمالي البلوك",
			icon: Grid3X3,
			value: (structural.blocks ?? 0) > 0 ? formatNumber(structural.blocks ?? 0) : "—",
			unit: (structural.blocks ?? 0) > 0 ? "بلوكة" : "",
			color: "text-success",
			bgColor: "bg-success/15",
			borderColor: "border-2",
		},
		{
			title: "إجمالي الطوبار",
			icon: Ruler,
			value: (structural.formwork ?? 0) > 0 ? formatNumber(structural.formwork ?? 0) : "—",
			unit: (structural.formwork ?? 0) > 0 ? "م²" : "",
			color: "text-chart-3",
			bgColor: "bg-chart-3/15",
			borderColor: "border-2",
		},
	];

	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
			{cards.map((card, index) => (
				<Card
					key={index}
					className={card.borderColor}
				>
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-start justify-between gap-2">
							<div className="min-w-0 flex-1 space-y-1">
								<p className="text-xs sm:text-sm text-muted-foreground font-medium">
									{card.title}
								</p>
								<p className={`text-lg sm:text-2xl font-bold break-words tabular-nums ${card.color}`}>
									{card.value} <span className="text-sm sm:text-base font-normal">{card.unit}</span>
								</p>
								{'subValue' in card && card.subValue && (
									<p className="text-[10px] sm:text-xs text-muted-foreground">{card.subValue}</p>
								)}
							</div>
							<div className={`p-1.5 sm:p-2.5 rounded-lg ${card.bgColor}`}>
								<card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
