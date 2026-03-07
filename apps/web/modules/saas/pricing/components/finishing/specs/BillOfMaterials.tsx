"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	ChevronDown,
	Download,
	Printer,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { aggregateAllSubItems } from "../../../lib/specs/spec-calculator";
import type {
	AggregatedMaterial,
	ItemSpecification,
} from "../../../lib/specs/spec-types";
import type { MergedQuantityItem } from "../../../lib/merge-quantities";
import { groupMergedItems } from "../../../lib/merge-quantities";
import { formatNumber, getUnitLabel } from "../../../lib/utils";

interface BillOfMaterialsProps {
	items: MergedQuantityItem[];
}

type BomTab = "byItem" | "aggregated";

export function BillOfMaterials({ items }: BillOfMaterialsProps) {
	const t = useTranslations("pricing.studies.finishing.bom");
	const [activeTab, setActiveTab] = useState<BomTab>("byItem");
	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
		new Set(),
	);

	// Items with specData
	const specItems = useMemo(
		() =>
			items.filter(
				(i) => i.isEnabled && i.specData,
			),
		[items],
	);

	// Extract ItemSpecification[] from items
	const specs = useMemo(
		() =>
			specItems.map((i) => i.specData as ItemSpecification),
		[specItems],
	);

	// Aggregated materials
	const aggregated = useMemo(
		() => aggregateAllSubItems(specs),
		[specs],
	);

	// By-item view: group items
	const grouped = useMemo(
		() => groupMergedItems(specItems),
		[specItems],
	);

	const toggleGroup = useCallback((key: string) => {
		setCollapsedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	}, []);

	const handleExport = useCallback(() => {
		exportToCSV(aggregated, t("exportFilename"), [
			t("colMaterial"),
			"Material",
			t("colUnit"),
			t("colTotal"),
			t("colUsedIn"),
		]);
	}, [aggregated, t]);

	const handlePrint = useCallback(() => {
		window.print();
	}, []);

	if (specItems.length === 0) {
		return (
			<div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
				{t("noSpecs")}
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{/* Tabs + actions */}
			<div className="flex items-center justify-between">
				<div className="flex gap-1.5">
					<Button
						variant={activeTab === "byItem" ? "default" : "ghost"}
						size="sm"
						className="text-sm h-8 px-3.5 rounded-full"
						onClick={() => setActiveTab("byItem")}
					>
						{t("byItem")}
					</Button>
					<Button
						variant={
							activeTab === "aggregated" ? "default" : "ghost"
						}
						size="sm"
						className="text-sm h-8 px-3.5 rounded-full"
						onClick={() => setActiveTab("aggregated")}
					>
						{t("aggregated")}
					</Button>
				</div>

				<div className="flex items-center gap-1.5">
					<Button
						variant="outline"
						size="sm"
						className="h-8 text-sm rounded-lg"
						onClick={handleExport}
					>
						<Download className="h-3.5 w-3.5 me-1.5" />
						{t("export")}
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-8 text-sm rounded-lg"
						onClick={handlePrint}
					>
						<Printer className="h-3.5 w-3.5 me-1.5" />
						{t("print")}
					</Button>
				</div>
			</div>

			{/* Content */}
			{activeTab === "byItem" ? (
				<ByItemView
					grouped={grouped}
					collapsedGroups={collapsedGroups}
					onToggleGroup={toggleGroup}
				/>
			) : (
				<AggregatedView aggregated={aggregated} />
			)}
		</div>
	);
}

// ── By Item View ──

function ByItemView({
	grouped,
	collapsedGroups,
	onToggleGroup,
}: {
	grouped: ReturnType<typeof groupMergedItems>;
	collapsedGroups: Set<string>;
	onToggleGroup: (key: string) => void;
}) {
	const t = useTranslations("pricing.studies.finishing.bom");

	return (
		<div className="rounded-lg border overflow-hidden bg-card print:border-0">
			{grouped.map((group) => {
				const isCollapsed = collapsedGroups.has(group.groupKey);

				return (
					<div key={group.groupKey}>
						{/* Group header */}
						<button
							type="button"
							className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-muted/40 border-b text-base font-semibold hover:bg-muted/60 transition-colors duration-200 print:bg-gray-100"
							onClick={() => onToggleGroup(group.groupKey)}
						>
							<ChevronDown
								className={`h-4 w-4 text-muted-foreground transition-transform duration-200 print:hidden ${isCollapsed ? "-rotate-90" : ""}`}
							/>
							<span>{group.groupName}</span>
							<Badge
								variant="secondary"
								className="text-xs h-5 px-2 rounded-full"
							>
								{group.items.length}
							</Badge>
						</button>

						{/* Items */}
						{!isCollapsed &&
							group.items.map((item) => {
								const spec =
									item.specData as ItemSpecification;
								if (!spec?.subItems?.length) return null;

								const unitLabel = getUnitLabel(item.unit);

								return (
									<div
										key={item.key}
										className="border-b last:border-b-0"
									>
										{/* Item header */}
										<div className="px-5 py-2.5 bg-muted/15 text-sm font-medium flex items-center gap-2">
											<span>
												{spec.specTypeLabel} —{" "}
												{item.name}
											</span>
											{item.floorName && (
												<span className="text-muted-foreground">
													({item.floorName})
												</span>
											)}
											<span className="text-muted-foreground ms-auto tabular-nums" dir="ltr">
												{formatNumber(
													item.effectiveQuantity,
													0,
												)}{" "}
												{unitLabel}
											</span>
										</div>

										{/* Sub-items */}
										<div className="divide-y">
											{spec.subItems.map((sub) => (
												<div
													key={sub.id}
													className="grid grid-cols-[1fr_70px_90px] gap-2 px-7 py-2 text-sm hover:bg-muted/10 transition-colors"
												>
													<div className="flex items-center gap-2">
														<span className="text-muted-foreground">
															•
														</span>
														<span>
															{sub.name}
														</span>
														{sub.isOptional && (
															<span className="text-xs text-muted-foreground">
																({t("optional")})
															</span>
														)}
													</div>
													<div className="text-center text-muted-foreground">
														{sub.unit}
													</div>
													<div className="text-end tabular-nums font-semibold" dir="ltr">
														{formatNumber(
															sub.quantity,
															1,
														)}
													</div>
												</div>
											))}
										</div>
									</div>
								);
							})}
					</div>
				);
			})}
		</div>
	);
}

// ── Aggregated View ──

function AggregatedView({
	aggregated,
}: {
	aggregated: AggregatedMaterial[];
}) {
	const t = useTranslations("pricing.studies.finishing.bom");

	if (aggregated.length === 0) {
		return (
			<div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
				{t("noMaterials")}
			</div>
		);
	}

	return (
		<div className="rounded-lg border overflow-hidden bg-card print:border-0">
			{/* Header */}
			<div className="grid grid-cols-[1fr_70px_100px_1fr] gap-2 px-4 py-2.5 bg-muted/60 text-xs font-semibold text-muted-foreground border-b uppercase tracking-wide print:bg-gray-100">
				<div>{t("colMaterial")}</div>
				<div className="text-center">{t("colUnit")}</div>
				<div className="text-end">{t("colTotal")}</div>
				<div>{t("colUsedIn")}</div>
			</div>

			{/* Rows */}
			{aggregated.map((mat, idx) => (
				<div
					key={`${mat.name}|${mat.unit}`}
					className={`grid grid-cols-[1fr_70px_100px_1fr] gap-2 px-4 py-2.5 border-b last:border-b-0 text-sm hover:bg-muted/30 transition-colors duration-200 ${idx % 2 === 1 ? "bg-muted/15" : ""}`}
				>
					<div className="font-medium">{mat.name}</div>
					<div className="text-center text-sm text-muted-foreground">
						{mat.unit}
					</div>
					<div className="text-end tabular-nums font-semibold" dir="ltr">
						{formatNumber(mat.totalQuantity, 1)}
					</div>
					<div className="text-sm text-muted-foreground truncate">
						{mat.usedInItems.join("، ")}
					</div>
				</div>
			))}

			{/* Summary */}
			<div className="px-4 py-2.5 bg-muted/40 text-sm text-muted-foreground border-t font-medium">
				{t("totalMaterials", { count: aggregated.length })}
			</div>
		</div>
	);
}

// ── CSV Export ──

function exportToCSV(materials: AggregatedMaterial[], filename: string, header: string[]) {
	const rows = materials.map((m) => [
		m.name,
		m.nameEn,
		m.unit,
		String(m.totalQuantity),
		m.usedInItems.join(" / "),
	]);

	// Add BOM marker for Excel UTF-8 support
	const bom = "\uFEFF";
	const csv =
		bom +
		[header, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n");

	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `${filename}.csv`;
	link.click();
	URL.revokeObjectURL(url);
}

function escapeCSV(value: string): string {
	if (value.includes(",") || value.includes('"') || value.includes("\n")) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}
