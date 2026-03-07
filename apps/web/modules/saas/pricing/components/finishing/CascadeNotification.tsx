"use client";

import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { AlertTriangle, ArrowDown, RefreshCw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatNumber, getUnitLabel } from "../../lib/utils";

export interface CascadeChange {
	itemKey: string;
	itemName: string;
	oldQuantity: number;
	newQuantity: number;
	unit: string;
	isManual: boolean;
}

interface CascadeNotificationProps {
	changes: CascadeChange[];
	skippedManualCount: number;
	onDismiss: () => void;
}

export function CascadeNotification({
	changes,
	skippedManualCount,
	onDismiss,
}: CascadeNotificationProps) {
	const t = useTranslations("pricing.studies.finishing.cascade");

	const autoChanges = changes.filter((c) => !c.isManual);
	const manualChanges = changes.filter((c) => c.isManual);

	return (
		<Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl p-5 space-y-3 animate-in slide-in-from-top-2 fade-in duration-300">
			{/* Header */}
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-center gap-2 text-sm font-semibold">
					<RefreshCw className="h-4 w-4 text-blue-600 shrink-0" />
					<span>{t("title")}</span>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 shrink-0"
					onClick={onDismiss}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			{/* Updated items */}
			{autoChanges.length > 0 && (
				<div className="space-y-1.5">
					<p className="text-sm text-muted-foreground font-medium">
						{t("updatedItems", { count: autoChanges.length })}
					</p>
					<ul className="space-y-1.5 text-sm">
						{autoChanges.slice(0, 8).map((change) => (
							<li
								key={change.itemKey}
								className="flex items-center gap-2 text-muted-foreground"
							>
								<ArrowDown className="h-3.5 w-3.5 text-blue-500 shrink-0" />
								<span className="truncate">
									{change.itemName}
								</span>
								<span className="ms-auto tabular-nums text-sm whitespace-nowrap" dir="ltr">
									<span className="line-through opacity-60">
										{formatNumber(change.oldQuantity, 1)}
									</span>
									{" → "}
									<span className="font-semibold text-foreground">
										{formatNumber(change.newQuantity, 1)}
									</span>
									{" "}
									{getUnitLabel(change.unit)}
								</span>
							</li>
						))}
						{autoChanges.length > 8 && (
							<li className="text-sm text-muted-foreground">
								{t("andMore", {
									count: autoChanges.length - 8,
								})}
							</li>
						)}
					</ul>
				</div>
			)}

			{/* Skipped manual items warning */}
			{(skippedManualCount > 0 || manualChanges.length > 0) && (
				<div className="flex items-center gap-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm">
					<AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
					<span>
						{t("manualSkipped", {
							count: skippedManualCount || manualChanges.length,
						})}
					</span>
				</div>
			)}

			{/* Dismiss */}
			<div className="flex items-center gap-2 pt-1">
				<Button size="sm" className="text-sm h-8 rounded-lg" onClick={onDismiss}>
					{t("done")}
				</Button>
			</div>
		</Card>
	);
}

