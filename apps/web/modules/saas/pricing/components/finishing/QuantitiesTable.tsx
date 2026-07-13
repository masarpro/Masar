"use client";

import { Badge } from "@ui/components/badge";
import { Checkbox } from "@ui/components/checkbox";
import {
	ChevronDown,
	Link2,
	Pencil,
	Sparkles,
	HelpCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useCallback, useMemo, memo } from "react";
import type { MergedQuantityItem } from "../../lib/merge-quantities";
import { groupMergedItems } from "../../lib/merge-quantities";
import { formatNumber, getUnitLabel } from "../../lib/utils";
import { QuantityRowExpanded } from "./QuantityRowExpanded";

/** Map group color names to Tailwind color classes */
const GROUP_COLOR_CLASSES: Record<string, { bg: string; border: string; badge: string }> = {
	blue: { bg: "bg-chart-4/15 dark:bg-chart-4/20", border: "border-chart-4", badge: "bg-chart-4/15 text-chart-4 dark:bg-chart-4/20 dark:text-chart-4" },
	green: { bg: "bg-success/15", border: "border-success", badge: "bg-success/15 text-success" },
	purple: { bg: "bg-chart-4/15", border: "border-chart-4", badge: "bg-chart-4/15 text-chart-4" },
	orange: { bg: "bg-chart-1/15", border: "border-chart-1", badge: "bg-chart-1/15 text-chart-1" },
	pink: { bg: "bg-chart-2/15", border: "border-chart-2", badge: "bg-chart-2/15 text-chart-2" },
	teal: { bg: "bg-chart-3/15", border: "border-chart-3", badge: "bg-chart-3/15 text-chart-3" },
	red: { bg: "bg-destructive/15", border: "border-destructive", badge: "bg-destructive/15 text-destructive" },
	yellow: { bg: "bg-chart-1/15", border: "border-chart-1", badge: "bg-chart-1/15 text-chart-1" },
	gray: { bg: "bg-muted/40", border: "border-muted-foreground/50", badge: "bg-muted text-muted-foreground" },
};

const DEFAULT_GROUP_COLOR = GROUP_COLOR_CLASSES.gray;

type ViewMode = "byCategory" | "byFloor" | "byProject";

interface QuantitiesTableProps {
	items: MergedQuantityItem[];
	viewMode?: ViewMode;
	onToggleEnabled: (key: string, enabled: boolean) => void;
	onManualOverride: (key: string, newQuantity: number) => void;
	onResetToAuto: (key: string) => void;
}

/** Group items by floor */
function groupByFloor(items: MergedQuantityItem[]) {
	const groups = new Map<string, {
		groupKey: string;
		groupName: string;
		groupIcon: string;
		groupColor: string;
		items: MergedQuantityItem[];
	}>();

	for (const item of items) {
		const floorKey = item.floorId ?? item.scope ?? "general";
		const floorName = item.floorName ?? (item.scope === "whole_building" ? "المبنى كامل" : item.scope === "external" ? "الخارجي" : item.scope === "roof" ? "السطح" : "عام");

		if (!groups.has(floorKey)) {
			groups.set(floorKey, {
				groupKey: floorKey,
				groupName: floorName,
				groupIcon: "Layers",
				groupColor: "blue",
				items: [],
			});
		}
		groups.get(floorKey)!.items.push(item);
	}

	return Array.from(groups.values());
}

/** Group items by category and aggregate across floors (project-level view) */
function groupByProject(items: MergedQuantityItem[]) {
	const aggregated = new Map<string, {
		categoryKey: string;
		name: string;
		unit: string;
		groupKey: string;
		groupName: string;
		groupColor: string;
		totalQuantity: number;
		enabledCount: number;
		totalCount: number;
	}>();

	for (const item of items) {
		const key = `${item.categoryKey}_${item.unit}`;
		if (!aggregated.has(key)) {
			aggregated.set(key, {
				categoryKey: item.categoryKey,
				name: item.name,
				unit: item.unit,
				groupKey: item.groupKey,
				groupName: item.groupName,
				groupColor: item.groupColor,
				totalQuantity: 0,
				enabledCount: 0,
				totalCount: 0,
			});
		}
		const agg = aggregated.get(key)!;
		if (item.isEnabled) {
			agg.totalQuantity += item.quantity;
			agg.enabledCount++;
		}
		agg.totalCount++;
	}

	// Group by category group
	const groups = new Map<string, {
		groupKey: string;
		groupName: string;
		groupIcon: string;
		groupColor: string;
		items: typeof aggregatedItems;
	}>();

	const aggregatedItems = Array.from(aggregated.values());

	for (const item of aggregatedItems) {
		if (!groups.has(item.groupKey)) {
			groups.set(item.groupKey, {
				groupKey: item.groupKey,
				groupName: item.groupName,
				groupIcon: "Package",
				groupColor: item.groupColor,
				items: [],
			});
		}
		groups.get(item.groupKey)!.items.push(item);
	}

	return Array.from(groups.values());
}

export function QuantitiesTable({
	items,
	viewMode = "byCategory",
	onToggleEnabled,
	onManualOverride,
	onResetToAuto,
}: QuantitiesTableProps) {
	const t = useTranslations("pricing.studies.finishing.dashboard");
	const [expandedKey, setExpandedKey] = useState<string | null>(null);
	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
		new Set(),
	);

	const grouped = useMemo(() => {
		if (viewMode === "byFloor") return groupByFloor(items);
		return groupMergedItems(items);
	}, [items, viewMode]);

	const projectGroups = useMemo(() => {
		if (viewMode !== "byProject") return null;
		return groupByProject(items);
	}, [items, viewMode]);

	const toggleGroup = useCallback((groupKey: string) => {
		setCollapsedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(groupKey)) {
				next.delete(groupKey);
			} else {
				next.add(groupKey);
			}
			return next;
		});
	}, []);

	const toggleRow = useCallback((key: string) => {
		setExpandedKey((prev) => (prev === key ? null : key));
	}, []);

	if (items.length === 0) {
		return (
			<div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
				{t("noItems")}
			</div>
		);
	}

	// Project (aggregated) view
	if (viewMode === "byProject" && projectGroups) {
		return (
			<div className="rounded-lg border overflow-hidden bg-card">
				<div className="hidden sm:grid grid-cols-[1fr_120px_60px] gap-1 px-4 py-2.5 bg-muted/60 text-xs font-semibold text-muted-foreground border-b uppercase tracking-wide">
					<div>{t("colItem")}</div>
					<div className="text-center">{t("colQuantity")}</div>
					<div className="text-center">{t("colUnit")}</div>
				</div>
				{projectGroups.map((group) => {
					const isCollapsed = collapsedGroups.has(group.groupKey);
					const colors = GROUP_COLOR_CLASSES[group.groupColor] ?? DEFAULT_GROUP_COLOR;
					return (
						<div key={group.groupKey}>
							<button
								type="button"
								className={`w-full flex items-center gap-2.5 px-4 py-2.5 border-b text-base font-semibold transition-all duration-200 hover:brightness-95 border-s-4 ${colors.bg} ${colors.border}`}
								onClick={() => toggleGroup(group.groupKey)}
							>
								<ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
								<span>{group.groupName}</span>
								<Badge className={`text-xs h-5 px-2 rounded-full font-medium border-0 ${colors.badge}`}>
									{group.items.length}
								</Badge>
							</button>
							{!isCollapsed && group.items.map((agg, idx) => (
								<div
									key={agg.categoryKey}
									className={`grid grid-cols-[1fr_120px_60px] gap-1 px-4 py-2.5 border-b items-center text-sm ${idx % 2 === 1 ? "bg-muted/20" : ""}`}
								>
									<div className="flex items-center gap-2 min-w-0">
										<span className="truncate font-medium">{agg.name}</span>
										<span className="text-xs text-muted-foreground">({agg.enabledCount}/{agg.totalCount})</span>
									</div>
									<div className="text-center font-semibold tabular-nums" dir="ltr">
										{formatNumber(agg.totalQuantity, 1)}
									</div>
									<div className="text-center text-xs text-muted-foreground">
										{getUnitLabel(agg.unit)}
									</div>
								</div>
							))}
						</div>
					);
				})}
			</div>
		);
	}

	return (
		<div className="rounded-lg border overflow-hidden bg-card">
			{/* Header */}
			<div className="hidden sm:grid grid-cols-[40px_1fr_80px_100px_60px_90px] gap-1 px-4 py-2.5 bg-muted/60 text-xs font-semibold text-muted-foreground border-b uppercase tracking-wide">
				<div />
				<div>{t("colItem")}</div>
				<div className="text-center">{t("colFloor")}</div>
				<div className="text-center">{t("colQuantity")}</div>
				<div className="text-center">{t("colUnit")}</div>
				<div className="text-center">{t("colSource")}</div>
			</div>

			{grouped.map((group) => {
				const isCollapsed = collapsedGroups.has(group.groupKey);
				const enabledCount = group.items.filter(
					(i) => i.isEnabled,
				).length;
				const colors = GROUP_COLOR_CLASSES[group.groupColor] ?? DEFAULT_GROUP_COLOR;

				return (
					<div key={group.groupKey}>
						{/* Group header */}
						<button
							type="button"
							className={`w-full flex items-center gap-2.5 px-4 py-2.5 border-b text-base font-semibold transition-all duration-200 hover:brightness-95 border-s-4 ${colors.bg} ${colors.border}`}
							onClick={() => toggleGroup(group.groupKey)}
						>
							<ChevronDown
								className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
							/>
							<span>{group.groupName}</span>
							<Badge
								className={`text-xs h-5 px-2 rounded-full font-medium border-0 ${colors.badge}`}
							>
								{enabledCount}/{group.items.length}
							</Badge>
						</button>

						{/* Group items */}
						{!isCollapsed &&
							group.items.map((item, idx) => {
											return (
									<div key={item.key}>
										<div
											className={`grid grid-cols-[40px_1fr_80px_100px_60px_90px] gap-1 px-4 py-2.5 border-b items-center text-sm cursor-pointer transition-colors duration-200 ${
												!item.isEnabled
													? "opacity-50"
													: ""
											} ${
												expandedKey === item.key
													? "bg-primary/5"
													: idx % 2 === 1
														? "bg-muted/20"
														: ""
											} hover:bg-muted/40`}
											onClick={() =>
												toggleRow(item.key)
											}
										>
											{/* Checkbox */}
											<div
												className="flex justify-center"
												onClick={(
													e: React.MouseEvent,
												) => e.stopPropagation()}
											>
												<Checkbox
													checked={item.isEnabled}
													onCheckedChange={(
														checked:
															| boolean
															| "indeterminate",
													) =>
														onToggleEnabled(
															item.key,
															checked === true,
														)
													}
												/>
											</div>

											{/* Name */}
											<div className="flex items-center gap-2 min-w-0">
												<span className="truncate font-medium">
													{item.name}
												</span>
												{item.isStale && (
													<HelpCircle className="h-3.5 w-3.5 text-chart-1 shrink-0" />
												)}
											</div>

											{/* Floor */}
											<div className="text-center text-xs text-muted-foreground">
												{item.floorName ??
													t(SCOPE_LABEL_KEYS[item.scope] ?? "scopePerFloor" as Parameters<typeof t>[0])}
											</div>

											{/* Quantity */}
											<div className="text-center font-semibold tabular-nums" dir="ltr">
												{formatNumber(
													item.quantity,
													1,
												)}
											</div>

											{/* Unit */}
											<div className="text-center text-xs text-muted-foreground">
												{getUnitLabel(item.unit)}
											</div>

											{/* Source */}
											<div className="flex justify-center">
												<SourceBadge
													source={item.dataSource}
												/>
											</div>
										</div>

										{/* Expanded row */}
										{expandedKey === item.key && (
											<QuantityRowExpanded
												item={item}
												allItems={items}
												onManualOverride={
													onManualOverride
												}
												onResetToAuto={onResetToAuto}
											/>
										)}
									</div>
								);
							})}
					</div>
				);
			})}
		</div>
	);
}

const SOURCE_BADGE_STYLES: Record<string, string> = {
	auto_building: "bg-success/15 text-success",
	auto_linked: "bg-chart-4/15 text-chart-4",
	auto_derived: "bg-chart-4/15 text-chart-4",
	manual: "bg-muted text-muted-foreground",
	estimated: "bg-chart-1/15 text-chart-1",
};

const SourceBadge = memo(function SourceBadge({ source }: { source: string }) {
	const t = useTranslations("pricing.studies.finishing.dashboard");
	const config: Record<
		string,
		{ labelKey: string; icon: React.ReactNode }
	> = {
		auto_building: {
			labelKey: "sourceAutoBuilding",
			icon: <Link2 className="h-3 w-3" />,
		},
		auto_linked: {
			labelKey: "sourceAutoLinked",
			icon: <Link2 className="h-3 w-3" />,
		},
		auto_derived: {
			labelKey: "sourceAutoDerived",
			icon: <Sparkles className="h-3 w-3" />,
		},
		manual: {
			labelKey: "sourceManual",
			icon: <Pencil className="h-3 w-3" />,
		},
		estimated: {
			labelKey: "sourceEstimated",
			icon: <HelpCircle className="h-3 w-3" />,
		},
	};
	const c = config[source] ?? config.manual;
	const colorClass = SOURCE_BADGE_STYLES[source] ?? SOURCE_BADGE_STYLES.manual;

	return (
		<Badge
			variant="secondary"
			className={`text-xs h-6 gap-1 px-2 rounded-full border-0 font-medium ${colorClass}`}
		>
			{c.icon}
			{t(c.labelKey as Parameters<typeof t>[0])}
		</Badge>
	);
});

const SCOPE_LABEL_KEYS: Record<string, string> = {
	whole_building: "scopeWholeBuilding",
	external: "scopeExternal",
	roof: "scopeRoof",
	per_floor: "scopePerFloor",
};
