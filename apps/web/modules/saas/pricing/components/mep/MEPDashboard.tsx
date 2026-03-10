"use client";

import { useMemo } from "react";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { RefreshCw, Settings } from "lucide-react";
import {
	MEP_CATEGORIES,
	MEP_CATEGORY_ORDER,
} from "../../lib/mep-categories";
import { MEP_ICON_MAP } from "../../lib/mep-icons";
import type { MEPCategoryId, MEPMergedItem } from "../../types/mep";
import { MEPSummaryBar } from "./MEPSummaryBar";
import { MEPCategorySection } from "./MEPCategorySection";
import { MEPManualAdder } from "./MEPManualAdder";
import { useTranslations } from "next-intl";

interface MEPDashboardProps {
	mergedItems: MEPMergedItem[];
	onToggleEnabled: (item: MEPMergedItem, enabled: boolean) => void;
	onEdit: (item: MEPMergedItem) => void;
	onRederive: () => void;
	isRederiving?: boolean;
	onAddManual?: (item: {
		category: string;
		subCategory: string;
		name: string;
		quantity: number;
		unit: string;
		materialPrice: number;
		laborPrice: number;
	}) => void;
	hasNewItems?: boolean;
	showPricing?: boolean;
}

export function MEPDashboard({
	mergedItems,
	onToggleEnabled,
	onEdit,
	onRederive,
	isRederiving,
	onAddManual,
	hasNewItems,
	showPricing = true,
}: MEPDashboardProps) {
	const t = useTranslations("pricing.studies.mep");

	// Group items by category
	const categoryData = useMemo(() => {
		return MEP_CATEGORY_ORDER.map((catId) => {
			const catItems = mergedItems.filter(
				(i) => i.category === catId,
			);
			const enabledItems = catItems.filter((i) => i.isEnabled);

			return {
				id: catId,
				config: MEP_CATEGORIES[catId],
				items: catItems,
				enabledCount: enabledItems.length,
			};
		}).filter((c) => c.items.length > 0);
	}, [mergedItems]);

	return (
		<div className="space-y-6">
			{/* Summary Bar */}
			<MEPSummaryBar items={mergedItems} />

			{/* Cascade notification */}
			{hasNewItems && (
				<div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-4 py-3 flex items-center justify-between">
					<p className="text-sm text-amber-800 dark:text-amber-200">
						{t("cascade.message")}
					</p>
					<Button
						size="sm"
						variant="outline"
						onClick={onRederive}
						disabled={isRederiving}
						className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-200"
					>
						<RefreshCw
							className={`h-3.5 w-3.5 me-1.5 ${isRederiving ? "animate-spin" : ""}`}
						/>
						{t("cascade.saveButton")}
					</Button>
				</div>
			)}

			{/* Action buttons */}
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">
					{t("dashboard.title")}
				</h2>
				<div className="flex items-center gap-2">
					{onAddManual && (
						<MEPManualAdder onAdd={onAddManual} />
					)}
					<Button
						variant="outline"
						size="sm"
						onClick={onRederive}
						disabled={isRederiving}
					>
						<RefreshCw
							className={`h-3.5 w-3.5 me-1.5 ${isRederiving ? "animate-spin" : ""}`}
						/>
						{t("rederive")}
					</Button>
				</div>
			</div>

			{/* Category Cards Overview */}
			<div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
				{categoryData.map((cat) => {
					const IconComp =
						MEP_ICON_MAP[cat.config.icon] ?? Settings;
					return (
						<Card key={cat.id} className="overflow-hidden">
							<CardContent className="p-3">
								<div className="flex items-center gap-2 mb-2">
									<div
										className="flex items-center justify-center h-7 w-7 rounded-lg shrink-0"
										style={{
											backgroundColor: `${cat.config.color}20`,
										}}
									>
										<IconComp
											className="h-3.5 w-3.5"
											style={{
												color: cat.config.color,
											}}
										/>
									</div>
									<span className="text-xs font-medium truncate">
										{cat.config.nameAr}
									</span>
								</div>
								<p className="text-sm font-medium text-muted-foreground mt-1">
									{t("categoryItemCount", { count: cat.enabledCount })}
								</p>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Category Sections */}
			<div className="space-y-4">
				{categoryData.map((cat) => (
					<MEPCategorySection
						key={cat.id}
						categoryId={cat.id}
						items={cat.items}
						onToggleEnabled={onToggleEnabled}
						onEdit={onEdit}
						showPricing={showPricing}
					/>
				))}
			</div>
		</div>
	);
}
