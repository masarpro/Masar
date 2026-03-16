"use client";

import { useState } from "react";
import { Card, CardContent } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatNumber } from "../../../../lib/utils";
import type { OtherStructuralResult } from "../../../../types/other-structural";

interface ElementResultCardProps {
	result: OtherStructuralResult;
}

export function ElementResultCard({ result }: ElementResultCardProps) {
	const t = useTranslations("pricing.studies.structural.otherStructural");
	const [expanded, setExpanded] = useState(false);

	const stats = [
		{ label: t("results.concreteRC"), value: result.concreteVolumeRC, unit: "م³", icon: "🏗", show: result.concreteVolumeRC > 0 },
		{ label: t("results.concretePlain"), value: result.concreteVolumePlain, unit: "م³", icon: "🧱", show: result.concreteVolumePlain > 0 },
		{ label: t("results.steel"), value: result.steelWeight, unit: "كجم", icon: "⚙️", show: result.steelWeight > 0 },
		{ label: t("results.formwork"), value: result.formworkArea, unit: "م²", icon: "📐", show: result.formworkArea > 0 },
		{ label: t("results.waterproofing"), value: result.waterproofingArea, unit: "م²", icon: "💧", show: result.waterproofingArea > 0 },
		{ label: t("results.excavation"), value: result.excavationVolume, unit: "م³", icon: "⛏️", show: result.excavationVolume > 0 },
		{ label: t("results.blocks"), value: result.blockCount, unit: t("results.blockUnit"), icon: "🧱", show: result.blockCount > 0 },
	];

	return (
		<Card className="bg-muted/30 border-dashed">
			<CardContent className="p-3">
				<div className="flex flex-wrap gap-3">
					{stats.filter(s => s.show).map((stat) => (
						<Badge key={stat.label} variant="secondary" className="text-xs gap-1 px-2 py-1">
							<span>{stat.icon}</span>
							<span className="text-muted-foreground">{stat.label}:</span>
							<span className="font-semibold">{formatNumber(stat.value)}</span>
							<span className="text-muted-foreground">{stat.unit}</span>
						</Badge>
					))}
				</div>

				{result.quantity > 1 && (
					<div className="mt-2 text-xs text-muted-foreground">
						{t("results.totalWithQty", { qty: result.quantity })}:
						{" "}{t("results.concreteRC")} {formatNumber(result.totalConcreteRC)} م³
						{" | "}{t("results.steel")} {formatNumber(result.totalSteelWeight)} كجم
					</div>
				)}

				{result.breakdown.length > 1 && (
					<button
						type="button"
						onClick={() => setExpanded(!expanded)}
						className="mt-2 text-xs text-primary flex items-center gap-1 hover:underline"
					>
						{expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
						{t("results.showBreakdown")}
					</button>
				)}

				{expanded && (
					<div className="mt-2 border rounded overflow-hidden">
						<table className="w-full text-xs">
							<thead className="bg-muted">
								<tr>
									<th className="text-start p-1.5">{t("results.component")}</th>
									<th className="text-center p-1.5">{t("results.concreteRC")} (م³)</th>
									<th className="text-center p-1.5">{t("results.steel")} (كجم)</th>
									<th className="text-center p-1.5">{t("results.formwork")} (م²)</th>
								</tr>
							</thead>
							<tbody>
								{result.breakdown.map((row, i) => (
									<tr key={i} className="border-t">
										<td className="p-1.5">{row.component}</td>
										<td className="text-center p-1.5">{formatNumber(row.concreteVolume)}</td>
										<td className="text-center p-1.5">{formatNumber(row.steelWeight)}</td>
										<td className="text-center p-1.5">{formatNumber(row.formworkArea)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
