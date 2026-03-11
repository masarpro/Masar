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
			value: formatNumber(structural.concrete),
			unit: t("pricing.studies.units.m3"),
			color: "text-blue-600",
			bgColor: "bg-blue-50 dark:bg-blue-950/30",
			borderColor: "border-blue-200 dark:border-blue-800",
			show: true,
		},
		{
			title: t("pricing.studies.summary.totalRebar"),
			icon: Columns3,
			value: formatNumber(structural.rebar / 1000, 2),
			unit: t("pricing.studies.units.ton"),
			subValue: `(${formatNumber(structural.rebar)} ${t("pricing.studies.units.kg")})`,
			color: "text-orange-600",
			bgColor: "bg-orange-50 dark:bg-orange-950/30",
			borderColor: "border-orange-200 dark:border-orange-800",
			show: true,
		},
		{
			title: "إجمالي البلوك",
			icon: Grid3X3,
			value: formatNumber(structural.blocks ?? 0),
			unit: "بلوكة",
			color: "text-emerald-600",
			bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
			borderColor: "border-emerald-200 dark:border-emerald-800",
			show: (structural.blocks ?? 0) > 0,
		},
		{
			title: "إجمالي الطوبار",
			icon: Ruler,
			value: formatNumber(structural.formwork ?? 0),
			unit: "م²",
			color: "text-amber-600",
			bgColor: "bg-amber-50 dark:bg-amber-950/30",
			borderColor: "border-amber-200 dark:border-amber-800",
			show: (structural.formwork ?? 0) > 0,
		},
	].filter((card) => card.show);

	return (
		<div className={`grid grid-cols-1 ${cards.length >= 4 ? 'md:grid-cols-4' : cards.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
			{cards.map((card, index) => (
				<Card
					key={index}
					className={card.borderColor}
				>
					<CardContent className="p-4">
						<div className="flex items-start justify-between">
							<div className="space-y-1">
								<p className="text-sm text-muted-foreground font-medium">
									{card.title}
								</p>
								<p className={`text-2xl font-bold ${card.color}`}>
									{card.value} <span className="text-base font-normal">{card.unit}</span>
								</p>
								{'subValue' in card && card.subValue && (
									<p className="text-xs text-muted-foreground">{card.subValue}</p>
								)}
							</div>
							<div className={`p-2.5 rounded-lg ${card.bgColor}`}>
								<card.icon className={`h-5 w-5 ${card.color}`} />
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
