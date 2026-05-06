"use client";

import { Button } from "@ui/components/button";
import {
	FileText,
	LayoutGrid,
	Layers,
	Package,
	Plus,
	Settings2,
	Table as TableIcon,
} from "lucide-react";
import type { Domain } from "../types";
import { DomainFilterChips } from "./DomainFilterChips";
import { WorkspaceStatPills } from "./WorkspaceStatPills";

export type ViewMode = "spreadsheet" | "cards";

interface Props {
	totalGrossCost: number;
	totalSellAmount: number;
	totalProfitAmount: number;
	totalProfitPercent: number;
	itemCount: number;

	domainCounts: Record<Domain, number>;
	selectedDomains: Set<Domain>;
	onToggleDomain: (domain: Domain) => void;
	onClearDomains: () => void;

	onAddItem: () => void;
	onApplyPreset: () => void;
	onGenerateQuote: () => void;
	onOpenContext: () => void;

	canGenerateQuote: boolean;

	viewMode: ViewMode;
	onViewModeChange: (mode: ViewMode) => void;
}

/**
 * Sticky workspace chrome — three compact stat pills on the start, the
 * domain filter chips in the middle, and the four primary actions on the
 * end. Replaces the old StudyHeader stacked layout (3 large stat cards +
 * markup slider + actions card) with a single horizontal bar that stays
 * visible while the user scrolls a long item list.
 */
export function WorkspaceBar({
	totalGrossCost,
	totalSellAmount,
	totalProfitAmount,
	totalProfitPercent,
	itemCount,
	domainCounts,
	selectedDomains,
	onToggleDomain,
	onClearDomains,
	onAddItem,
	onApplyPreset,
	onGenerateQuote,
	onOpenContext,
	canGenerateQuote,
	viewMode,
	onViewModeChange,
}: Props) {
	return (
		<div className="sticky top-0 z-30 -mx-4 mb-4 border-b bg-background/95 px-4 pb-3 pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<WorkspaceStatPills
					totalGrossCost={totalGrossCost}
					totalSellAmount={totalSellAmount}
					totalProfitAmount={totalProfitAmount}
					totalProfitPercent={totalProfitPercent}
				/>

				<div className="flex flex-wrap items-center gap-2">
					<div
						className="inline-flex items-center rounded-md border bg-muted/30 p-0.5"
						role="group"
						aria-label="طريقة العرض"
					>
						<button
							type="button"
							onClick={() => onViewModeChange("spreadsheet")}
							className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs transition ${
								viewMode === "spreadsheet"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							}`}
							aria-pressed={viewMode === "spreadsheet"}
							title="عرض جدولي — إدخال سريع"
						>
							<TableIcon className="h-3.5 w-3.5" />
							جدول
						</button>
						<button
							type="button"
							onClick={() => onViewModeChange("cards")}
							className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs transition ${
								viewMode === "cards"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							}`}
							aria-pressed={viewMode === "cards"}
							title="عرض بطاقات — تحكّم تفصيلي"
						>
							<LayoutGrid className="h-3.5 w-3.5" />
							بطاقات
						</button>
					</div>

					<Button
						size="sm"
						variant="outline"
						onClick={onOpenContext}
						title="السياق المشترك"
					>
						<Settings2 className="me-1.5 h-3.5 w-3.5" />
						السياق
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={onApplyPreset}
						title="باقات جاهزة"
					>
						<Package className="me-1.5 h-3.5 w-3.5" />
						باقات
					</Button>
					<Button size="sm" onClick={onAddItem}>
						<Plus className="me-1.5 h-3.5 w-3.5" />
						بند جديد
					</Button>
					<Button
						size="sm"
						className="bg-emerald-600 text-white hover:bg-emerald-700"
						onClick={onGenerateQuote}
						disabled={!canGenerateQuote}
					>
						<FileText className="me-1.5 h-3.5 w-3.5" />
						عرض سعر
					</Button>
				</div>
			</div>

			{itemCount > 0 && (
				<div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
					<DomainFilterChips
						selected={selectedDomains}
						onToggle={onToggleDomain}
						onClear={onClearDomains}
						counts={domainCounts}
					/>
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<Layers className="h-3.5 w-3.5" />
						<span className="tabular-nums">{itemCount} بند</span>
					</div>
				</div>
			)}
		</div>
	);
}
