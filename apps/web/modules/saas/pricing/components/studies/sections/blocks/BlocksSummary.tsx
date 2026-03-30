"use client";

import { useTranslations } from "next-intl";
import type { BlocksSummaryProps } from "./types";

export function BlocksSummary({ items }: BlocksSummaryProps) {
	const t = useTranslations();

	if (items.length === 0) return null;

	return (
		<div className="bg-muted/30 rounded-lg p-4">
			<h4 className="font-medium mb-2">{t("pricing.studies.summary.totalItems")}</h4>
			<div className="text-sm">
				<div>
					<span className="text-muted-foreground">
						{t("pricing.studies.structural.quantity")}:
					</span>
					<p className="font-bold">
						{items.reduce((sum, i) => sum + i.quantity, 0)} {t("pricing.studies.units.piece")}
					</p>
				</div>
			</div>
		</div>
	);
}
