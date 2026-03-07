"use client";

import { Card, CardContent } from "@ui/components/card";
import { useTranslations } from "next-intl";
import { formatCurrency } from "../../../lib/utils";

interface FinishingSummaryProps {
	totalItems: number;
	totalCost: number;
}

export function FinishingSummary({ totalItems, totalCost }: FinishingSummaryProps) {
	const t = useTranslations("pricing.studies");

	return (
		<Card>
			<CardContent className="pt-6">
				<div className="grid gap-4 sm:grid-cols-2">
					<div>
						<p className="text-sm text-muted-foreground">{t("totalItems")}</p>
						<p className="text-2xl font-bold">{totalItems}</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">{t("totalCost")}</p>
						<p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
