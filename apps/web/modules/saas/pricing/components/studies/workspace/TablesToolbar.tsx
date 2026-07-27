"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { CheckCheck, FilterX, ListChecks } from "lucide-react";
import { useTranslations } from "next-intl";

import { BOQExportDropdown } from "../BOQExportDropdown";
import { useBOQTables, type BOQTableTab } from "../boq/BOQTablesContext";

// ═══════════════════════════════════════════════════════════════
// شريط أدوات الجداول — فلاتر + تحديد + تصدير وطباعة
// يعلو الجداول الأربعة ويتشارك الحالة نفسها معها
// ═══════════════════════════════════════════════════════════════

interface TablesToolbarProps {
	tab: BOQTableTab;
	title: string;
	/** التقرير المالي شامل للمشروع فلا تُعرض له فلاتر النطاق */
	showFilters?: boolean;
}

export function TablesToolbar({
	tab,
	title,
	showFilters = true,
}: TablesToolbarProps) {
	const t = useTranslations("pricing.studies");
	const {
		floorOptions,
		sectionOptions,
		itemOptions,
		selectedFloor,
		setSelectedFloor,
		selectedSection,
		setSelectedSection,
		selectedItemId,
		setSelectedItemId,
		selectedIds,
		selectAll,
		clearSelection,
		selectionCount,
		selectableCount,
		hasActiveFilters,
		resetFilters,
		exportActive,
		printActive,
	} = useBOQTables();

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h3 className="font-bold text-base">{title}</h3>
				<div className="flex items-center gap-2">
					{hasActiveFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={resetFilters}
							className="gap-1.5 text-xs"
						>
							<FilterX className="h-3.5 w-3.5" />
							{t("boq.clearFilters")}
						</Button>
					)}
					<BOQExportDropdown
						onExcelExport={() => exportActive(tab)}
						onPrint={() => printActive(tab)}
					/>
				</div>
			</div>

			{showFilters && (
				<div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/20 px-3 py-2 print:hidden">
					{floorOptions.length > 2 && (
						<FilterSelect
							label={t("structural.boq.floorFilter")}
							value={selectedFloor}
							onChange={setSelectedFloor}
							options={floorOptions}
							width="w-[170px]"
						/>
					)}
					{sectionOptions.length > 2 && (
						<FilterSelect
							label={t("structural.boq.sectionFilter")}
							value={selectedSection}
							onChange={setSelectedSection}
							options={sectionOptions}
							width="w-[170px]"
						/>
					)}
					{itemOptions.length > 2 && (
						<FilterSelect
							label={t("structural.boq.itemFilter")}
							value={selectedItemId}
							onChange={setSelectedItemId}
							options={itemOptions}
							width="w-[220px]"
						/>
					)}

					{/* حالة التحديد بالصح */}
					<div className="ms-auto flex items-center gap-2">
						<Badge
							variant={selectedIds ? "default" : "secondary"}
							className="gap-1 font-normal text-[11px]"
						>
							<ListChecks className="h-3 w-3" />
							{t("boq.selectedOfTotal", {
								selected: selectionCount,
								total: selectableCount,
							})}
						</Badge>
						{selectedIds ? (
							<Button
								variant="ghost"
								size="sm"
								onClick={selectAll}
								className="h-7 gap-1 px-2 text-xs"
							>
								<CheckCheck className="h-3.5 w-3.5" />
								{t("boq.selectAll")}
							</Button>
						) : (
							<Button
								variant="ghost"
								size="sm"
								onClick={clearSelection}
								className="h-7 px-2 text-xs"
							>
								{t("boq.deselectAll")}
							</Button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

function FilterSelect({
	label,
	value,
	onChange,
	options,
	width,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	options: Array<{ value: string; label: string; icon?: string }>;
	width: string;
}) {
	return (
		<div className="flex items-center gap-1.5">
			<span className="font-medium text-muted-foreground text-xs">
				{label}
			</span>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger className={`h-8 text-xs ${width}`}>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.icon ? `${option.icon} ` : ""}
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
