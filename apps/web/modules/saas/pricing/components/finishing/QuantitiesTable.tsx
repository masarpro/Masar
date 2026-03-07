"use client";

import { Badge } from "@ui/components/badge";
import { Checkbox } from "@ui/components/checkbox";
import {
	ChevronDown,
	ChevronLeft,
	Link2,
	Pencil,
	Sparkles,
	HelpCircle,
	Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useCallback, useMemo, memo } from "react";
import type { MergedQuantityItem } from "../../lib/merge-quantities";
import { groupMergedItems } from "../../lib/merge-quantities";
import type { ItemSpecification } from "../../lib/specs/spec-types";
import { formatNumber, getUnitLabel } from "../../lib/utils";
import { QuantityRowExpanded } from "./QuantityRowExpanded";

interface QuantitiesTableProps {
	items: MergedQuantityItem[];
	onToggleEnabled: (key: string, enabled: boolean) => void;
	onManualOverride: (key: string, newQuantity: number) => void;
	onResetToAuto: (key: string) => void;
	onSaveSpec: (key: string, spec: ItemSpecification) => void;
}

export function QuantitiesTable({
	items,
	onToggleEnabled,
	onManualOverride,
	onResetToAuto,
	onSaveSpec,
}: QuantitiesTableProps) {
	const t = useTranslations("pricing.studies.finishing.dashboard");
	const [expandedKey, setExpandedKey] = useState<string | null>(null);
	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
		new Set(),
	);

	const grouped = useMemo(() => groupMergedItems(items), [items]);

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
			<div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
				{t("noItems")}
			</div>
		);
	}

	return (
		<div className="rounded-lg border overflow-hidden">
			{/* Header */}
			<div className="hidden sm:grid grid-cols-[40px_1fr_80px_90px_60px_70px_90px_80px] gap-1 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
				<div />
				<div>{t("colItem")}</div>
				<div className="text-center">{t("colFloor")}</div>
				<div className="text-center">{t("colQuantity")}</div>
				<div className="text-center">{t("colUnit")}</div>
				<div className="text-center">{t("colWastage")}</div>
				<div className="text-center">{t("colEffective")}</div>
				<div className="text-center">{t("colSource")}</div>
			</div>

			{grouped.map((group) => {
				const isCollapsed = collapsedGroups.has(group.groupKey);
				const enabledCount = group.items.filter(
					(i) => i.isEnabled,
				).length;

				return (
					<div key={group.groupKey}>
						{/* Group header */}
						<button
							type="button"
							className="w-full flex items-center gap-2 px-3 py-2 bg-muted/30 border-b text-sm font-semibold hover:bg-muted/50 transition-colors"
							onClick={() => toggleGroup(group.groupKey)}
						>
							{isCollapsed ? (
								<ChevronLeft className="h-4 w-4 text-muted-foreground" />
							) : (
								<ChevronDown className="h-4 w-4 text-muted-foreground" />
							)}
							<span>{group.groupName}</span>
							<Badge
								variant="secondary"
								className="text-[10px] h-4 px-1.5"
							>
								{enabledCount}/{group.items.length}
							</Badge>
						</button>

						{/* Group items */}
						{!isCollapsed &&
							group.items.map((item) => {
								const hasSpec = !!item.specData;
								return (
									<div key={item.key}>
										<div
											className={`grid grid-cols-[40px_1fr_80px_90px_60px_70px_90px_80px] gap-1 px-3 py-2 border-b items-center text-sm cursor-pointer hover:bg-muted/20 transition-colors ${
												!item.isEnabled
													? "opacity-50"
													: ""
											} ${
												expandedKey === item.key
													? "bg-muted/10"
													: ""
											}`}
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

											{/* Name + spec icon */}
											<div className="flex items-center gap-1.5 min-w-0">
												<span className="truncate">
													{item.name}
												</span>
												{hasSpec && (
													<Settings className="h-3 w-3 text-green-500 shrink-0" />
												)}
												{item.isStale && (
													<HelpCircle className="h-3 w-3 text-amber-500 shrink-0" />
												)}
											</div>

											{/* Floor */}
											<div className="text-center text-xs text-muted-foreground">
												{item.floorName ??
													t(SCOPE_LABEL_KEYS[item.scope] ?? "scopePerFloor" as Parameters<typeof t>[0])}
											</div>

											{/* Quantity */}
											<div className="text-center font-medium tabular-nums">
												{formatNumber(
													item.quantity,
													1,
												)}
											</div>

											{/* Unit */}
											<div className="text-center text-xs text-muted-foreground">
												{getUnitLabel(item.unit)}
											</div>

											{/* Wastage */}
											<div className="text-center text-xs text-muted-foreground">
												{item.wastagePercent > 0
													? `${item.wastagePercent}%`
													: "-"}
											</div>

											{/* Effective */}
											<div className="text-center font-medium tabular-nums">
												{formatNumber(
													item.effectiveQuantity,
													1,
												)}
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
												onSaveSpec={onSaveSpec}
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

const SourceBadge = memo(function SourceBadge({ source }: { source: string }) {
	const t = useTranslations("pricing.studies.finishing.dashboard");
	const config: Record<
		string,
		{ labelKey: string; icon: React.ReactNode; variant: "secondary" | "outline" }
	> = {
		auto_building: {
			labelKey: "sourceAutoBuilding",
			icon: <Link2 className="h-2.5 w-2.5" />,
			variant: "secondary",
		},
		auto_linked: {
			labelKey: "sourceAutoLinked",
			icon: <Link2 className="h-2.5 w-2.5" />,
			variant: "secondary",
		},
		auto_derived: {
			labelKey: "sourceAutoDerived",
			icon: <Sparkles className="h-2.5 w-2.5" />,
			variant: "secondary",
		},
		manual: {
			labelKey: "sourceManual",
			icon: <Pencil className="h-2.5 w-2.5" />,
			variant: "outline",
		},
		estimated: {
			labelKey: "sourceEstimated",
			icon: <HelpCircle className="h-2.5 w-2.5" />,
			variant: "outline",
		},
	};
	const c = config[source] ?? config.manual;

	return (
		<Badge
			variant={c.variant}
			className="text-[10px] h-5 gap-0.5 px-1.5"
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
