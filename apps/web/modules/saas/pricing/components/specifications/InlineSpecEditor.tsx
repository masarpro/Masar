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
import {
	AlertTriangle,
	CheckCircle2,
	ChevronDown,
	Circle,
	Copy,
	Save,
	Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { getSpecConfig } from "../../lib/specs/catalog";
import { buildItemSpec } from "../../lib/specs/spec-calculator";
import type {
	ItemSpecification,
	SpecOption,
} from "../../lib/specs/spec-types";
import type { MergedQuantityItem } from "../../lib/merge-quantities";
import { groupMergedItems } from "../../lib/merge-quantities";
import { mapToCatalogCategory } from "../../lib/utils";

interface InlineSpecEditorProps {
	items: MergedQuantityItem[];
	onSaveSpec: (key: string, spec: ItemSpecification) => void;
	isSaving?: boolean;
}

interface SpecEntry {
	itemKey: string;
	categoryKey: string;
	specTypeKey: string;
	options: Record<string, unknown>;
	brand?: string;
}

export function InlineSpecEditor({
	items,
	onSaveSpec,
	isSaving,
}: InlineSpecEditorProps) {
	const t = useTranslations("pricing.studies.finishing.specs");

	const enabledItems = useMemo(
		() => items.filter((i) => i.isEnabled),
		[items],
	);
	const grouped = useMemo(
		() => groupMergedItems(enabledItems),
		[enabledItems],
	);

	const [specs, setSpecs] = useState<Map<string, SpecEntry>>(() =>
		initFromItems(enabledItems),
	);
	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
		new Set(),
	);
	const [expandedRow, setExpandedRow] = useState<string | null>(null);
	const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());

	const specCount = useMemo(() => {
		let count = 0;
		for (const entry of specs.values()) {
			if (entry.specTypeKey) count++;
		}
		return count;
	}, [specs]);

	// Detect floor/room overrides: items where specTypeKey differs from the majority in same category group
	const floorOverrides = useMemo(() => {
		const overrides: Array<{
			itemKey: string;
			itemName: string;
			floorName: string;
			categoryName: string;
			currentSpec: string;
			defaultSpec: string;
		}> = [];

		for (const group of grouped) {
			// Find majority spec per category within this group
			const catSpecCounts = new Map<string, Map<string, number>>();
			for (const item of group.items) {
				const entry = specs.get(item.key);
				if (!entry?.specTypeKey) continue;
				const catKey = mapToCatalogCategory(item.categoryKey);
				if (!catSpecCounts.has(catKey)) catSpecCounts.set(catKey, new Map());
				const counts = catSpecCounts.get(catKey)!;
				counts.set(entry.specTypeKey, (counts.get(entry.specTypeKey) ?? 0) + 1);
			}

			// Find majority specTypeKey per category
			const majoritySpec = new Map<string, string>();
			for (const [catKey, counts] of catSpecCounts) {
				let maxCount = 0;
				let majorKey = "";
				for (const [specKey, count] of counts) {
					if (count > maxCount) { maxCount = count; majorKey = specKey; }
				}
				if (majorKey) majoritySpec.set(catKey, majorKey);
			}

			// Find items that differ
			for (const item of group.items) {
				const entry = specs.get(item.key);
				if (!entry?.specTypeKey || !item.floorName) continue;
				const catKey = mapToCatalogCategory(item.categoryKey);
				const majorKey = majoritySpec.get(catKey);
				if (majorKey && entry.specTypeKey !== majorKey) {
					const config = getSpecConfig(catKey);
					const currentLabel = config?.specTypes.find((s) => s.key === entry.specTypeKey)?.label ?? entry.specTypeKey;
					const defaultLabel = config?.specTypes.find((s) => s.key === majorKey)?.label ?? majorKey;
					overrides.push({
						itemKey: item.key,
						itemName: item.name,
						floorName: item.floorName,
						categoryName: group.groupName,
						currentSpec: currentLabel,
						defaultSpec: defaultLabel,
					});
				}
			}
		}

		return overrides;
	}, [grouped, specs]);

	const toggleGroup = useCallback((groupKey: string) => {
		setCollapsedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(groupKey)) next.delete(groupKey);
			else next.add(groupKey);
			return next;
		});
	}, []);

	const handleTypeChange = useCallback(
		(itemKey: string, specTypeKey: string) => {
			setSpecs((prev) => {
				const next = new Map(prev);
				const entry = next.get(itemKey);
				if (!entry) return prev;

				const config = getSpecConfig(
					mapToCatalogCategory(entry.categoryKey),
				);
				const specType = config?.specTypes.find(
					(s) => s.key === specTypeKey,
				);
				const defaults: Record<string, unknown> = {};
				if (config) {
					for (const opt of config.commonOptions) {
						defaults[opt.key] = opt.defaultValue;
					}
				}
				if (specType?.defaultOptions) {
					Object.assign(defaults, specType.defaultOptions);
				}

				next.set(itemKey, {
					...entry,
					specTypeKey,
					options: defaults,
				});
				return next;
			});
			setDirtyKeys((prev) => new Set(prev).add(itemKey));
		},
		[],
	);

	const handleOptionChange = useCallback(
		(itemKey: string, optionKey: string, value: unknown) => {
			setSpecs((prev) => {
				const next = new Map(prev);
				const entry = next.get(itemKey);
				if (!entry) return prev;
				next.set(itemKey, {
					...entry,
					options: { ...entry.options, [optionKey]: value },
				});
				return next;
			});
			setDirtyKeys((prev) => new Set(prev).add(itemKey));
		},
		[],
	);

	const handleSetAllInGroup = useCallback(
		(groupKey: string) => {
			const group = grouped.find((g) => g.groupKey === groupKey);
			if (!group) return;

			const firstItem = group.items[0];
			if (!firstItem) return;
			const firstSpec = specs.get(firstItem.key);
			if (!firstSpec?.specTypeKey) return;

			setSpecs((prev) => {
				const next = new Map(prev);
				const newDirty = new Set(dirtyKeys);
				for (const item of group.items) {
					const existing = next.get(item.key);
					if (!existing) continue;
					const itemCat = mapToCatalogCategory(item.categoryKey);
					const firstCat = mapToCatalogCategory(firstSpec.categoryKey);
					if (itemCat === firstCat) {
						next.set(item.key, {
							...existing,
							specTypeKey: firstSpec.specTypeKey,
							options: { ...firstSpec.options },
							brand: firstSpec.brand,
						});
						newDirty.add(item.key);
					}
				}
				setDirtyKeys(newDirty);
				return next;
			});
		},
		[grouped, specs, dirtyKeys],
	);

	const handleSaveItem = useCallback(
		(itemKey: string) => {
			const entry = specs.get(itemKey);
			const item = enabledItems.find((i) => i.key === itemKey);
			if (!entry?.specTypeKey || !item) return;

			const catKey = mapToCatalogCategory(entry.categoryKey);
			const spec = buildItemSpec(
				catKey,
				entry.specTypeKey,
				entry.options,
				item.effectiveQuantity,
				item.unit,
			);
			onSaveSpec(itemKey, spec);
			setDirtyKeys((prev) => {
				const next = new Set(prev);
				next.delete(itemKey);
				return next;
			});
		},
		[specs, enabledItems, onSaveSpec],
	);

	const handleSaveAll = useCallback(() => {
		let saved = 0;
		for (const item of enabledItems) {
			const entry = specs.get(item.key);
			if (!entry?.specTypeKey) continue;

			const catKey = mapToCatalogCategory(entry.categoryKey);
			const spec = buildItemSpec(
				catKey,
				entry.specTypeKey,
				entry.options,
				item.effectiveQuantity,
				item.unit,
			);
			onSaveSpec(item.key, spec);
			saved++;
		}
		setDirtyKeys(new Set());
		toast.success(`تم حفظ ${saved} مواصفة`);
	}, [enabledItems, specs, onSaveSpec]);

	if (enabledItems.length === 0) {
		return (
			<div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
				<p>{t("noItems")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Stats + Save All */}
			<div className="flex items-center justify-between">
				<span className="text-sm text-muted-foreground">
					{specCount} / {enabledItems.length} بند محدد المواصفات
				</span>
				{dirtyKeys.size > 0 && (
					<Button
						size="sm"
						className="gap-1.5"
						onClick={handleSaveAll}
						disabled={isSaving}
					>
						{isSaving ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<Save className="h-3.5 w-3.5" />
						)}
						حفظ الكل ({dirtyKeys.size})
					</Button>
				)}
			</div>

			{/* Grouped items */}
			{grouped.map((group) => {
				const isCollapsed = collapsedGroups.has(group.groupKey);
				const specifiedCount = group.items.filter((i) => {
					const entry = specs.get(i.key);
					return !!entry?.specTypeKey;
				}).length;

				return (
					<div
						key={group.groupKey}
						className="rounded-lg border overflow-hidden"
					>
						{/* Group header */}
						<button
							type="button"
							className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-muted/40 text-base font-semibold hover:bg-muted/60 transition-colors duration-200"
							onClick={() => toggleGroup(group.groupKey)}
						>
							<ChevronDown
								className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
							/>
							<span>{group.groupName}</span>
							<Badge
								variant="secondary"
								className="text-xs h-5 px-2 rounded-full"
							>
								{specifiedCount}/{group.items.length}
							</Badge>
							<Button
								variant="ghost"
								size="sm"
								className="h-7 text-xs ms-auto gap-1"
								onClick={(e) => {
									e.stopPropagation();
									handleSetAllInGroup(group.groupKey);
								}}
							>
								<Copy className="h-3 w-3" />
								تطبيق على الكل
							</Button>
						</button>

						{/* Items */}
						{!isCollapsed && (
							<div>
								{/* Header row */}
								<div className="hidden sm:grid grid-cols-[1fr_180px_50px_70px] gap-2 px-4 py-2 bg-muted/20 text-xs font-semibold text-muted-foreground border-b uppercase tracking-wide">
									<div>{t("colMaterial")}</div>
									<div className="text-center">
										{t("specType")}
									</div>
									<div className="text-center">الحالة</div>
									<div className="text-center">حفظ</div>
								</div>

								{group.items.map((item) => {
									const entry = specs.get(item.key);
									const catKey = mapToCatalogCategory(
										item.categoryKey,
									);
									const config = getSpecConfig(catKey);
									const hasSpec = !!entry?.specTypeKey;
									const isExpanded = expandedRow === item.key;
									const isDirty = dirtyKeys.has(item.key);

									return (
										<SpecRow
											key={item.key}
											item={item}
											entry={entry}
											config={config}
											hasSpec={hasSpec}
											isDirty={isDirty}
											isExpanded={isExpanded}
											onToggleExpand={() =>
												setExpandedRow(
													isExpanded ? null : item.key,
												)
											}
											onTypeChange={(typeKey) =>
												handleTypeChange(item.key, typeKey)
											}
											onOptionChange={(optKey, val) =>
												handleOptionChange(
													item.key,
													optKey,
													val,
												)
											}
											onSave={() =>
												handleSaveItem(item.key)
											}
										/>
									);
								})}
							</div>
						)}
					</div>
				);
			})}

			{/* Floor/Room Overrides Summary */}
			{floorOverrides.length > 0 && (
				<div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden">
					<div className="flex items-center gap-2 px-4 py-2.5 bg-amber-100/50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
						<AlertTriangle className="h-4 w-4 text-amber-600" />
						<span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
							تخصيصات خاصة
						</span>
						<Badge variant="secondary" className="text-xs h-5 px-2 rounded-full">
							{floorOverrides.length}
						</Badge>
					</div>
					<div className="px-4 py-2 text-xs text-amber-700 dark:text-amber-400">
						التخصيصات التالية تختلف عن الإعداد الافتراضي:
					</div>
					<div className="divide-y divide-amber-200/50 dark:divide-amber-800/50">
						{floorOverrides.map((ov) => (
							<div
								key={ov.itemKey}
								className="px-4 py-2 text-sm flex items-center gap-2 hover:bg-amber-100/30 dark:hover:bg-amber-900/10 cursor-pointer"
								onClick={() => setExpandedRow(ov.itemKey)}
							>
								<span className="font-medium">{ov.itemName}</span>
								<span className="text-xs text-muted-foreground">({ov.floorName})</span>
								<span className="text-xs text-muted-foreground mx-1">—</span>
								<Badge variant="outline" className="text-xs h-5 rounded-full border-amber-300 dark:border-amber-700">
									{ov.currentSpec}
								</Badge>
								<span className="text-xs text-muted-foreground">
									بدلاً من {ov.defaultSpec}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

// ── SpecRow ──

function SpecRow({
	item,
	entry,
	config,
	hasSpec,
	isDirty,
	isExpanded,
	onToggleExpand,
	onTypeChange,
	onOptionChange,
	onSave,
}: {
	item: MergedQuantityItem;
	entry: SpecEntry | undefined;
	config: ReturnType<typeof getSpecConfig>;
	hasSpec: boolean;
	isDirty: boolean;
	isExpanded: boolean;
	onToggleExpand: () => void;
	onTypeChange: (typeKey: string) => void;
	onOptionChange: (optKey: string, val: unknown) => void;
	onSave: () => void;
}) {
	const t = useTranslations("pricing.studies.finishing.specs");

	if (!config) {
		return (
			<div className="grid grid-cols-[1fr_180px_50px_70px] gap-2 px-4 py-2.5 border-b items-center text-sm opacity-50">
				<span className="truncate">{item.name}</span>
				<span className="text-center text-sm text-muted-foreground">
					{t("noSpecConfig")}
				</span>
				<span />
				<span />
			</div>
		);
	}

	const selectedType = config.specTypes.find(
		(s) => s.key === entry?.specTypeKey,
	);
	const allOptions = [
		...(config.commonOptions ?? []),
		...(selectedType?.specificOptions ?? []),
	];

	return (
		<div className="border-b last:border-b-0">
			<div
				className="grid grid-cols-[1fr_180px_50px_70px] gap-2 px-4 py-2.5 items-center text-sm cursor-pointer hover:bg-muted/20 transition-colors duration-200"
				onClick={onToggleExpand}
			>
				{/* Name */}
				<div className="flex items-center gap-2 min-w-0">
					<span className="truncate font-medium">{item.name}</span>
					{item.floorName && (
						<span className="text-xs text-muted-foreground shrink-0">
							({item.floorName})
						</span>
					)}
				</div>

				{/* Type selector */}
				<div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
					<Select
						value={entry?.specTypeKey ?? ""}
						onValueChange={onTypeChange}
					>
						<SelectTrigger className="h-8 text-sm rounded-lg">
							<SelectValue placeholder={t("specType")} />
						</SelectTrigger>
						<SelectContent>
							{config.specTypes.map((st) => (
								<SelectItem key={st.key} value={st.key}>
									{st.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Status */}
				<div className="flex justify-center">
					{hasSpec ? (
						<CheckCircle2 className="h-4 w-4 text-emerald-500" />
					) : (
						<Circle className="h-4 w-4 text-muted-foreground/30" />
					)}
				</div>

				{/* Save button */}
				<div
					className="flex justify-center"
					onClick={(e: React.MouseEvent) => e.stopPropagation()}
				>
					{isDirty && hasSpec && (
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-xs px-2"
							onClick={onSave}
						>
							<Save className="h-3 w-3" />
						</Button>
					)}
				</div>
			</div>

			{/* Expanded options */}
			{isExpanded && entry?.specTypeKey && allOptions.length > 0 && (
				<div className="px-5 py-3.5 bg-muted/15 border-t space-y-2.5">
					<div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
						{t("options")}
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
						{allOptions.map((opt) => (
							<InlineOption
								key={opt.key}
								option={opt}
								value={
									entry.options[opt.key] ?? opt.defaultValue
								}
								onChange={(val) =>
									onOptionChange(opt.key, val)
								}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

// ── InlineOption ──

function InlineOption({
	option,
	value,
	onChange,
}: {
	option: SpecOption;
	value: unknown;
	onChange: (val: unknown) => void;
}) {
	if (option.type === "boolean") {
		return (
			<label className="flex items-center gap-2 text-sm cursor-pointer">
				<input
					type="checkbox"
					checked={value === true}
					onChange={(e) => onChange(e.target.checked)}
					className="rounded border"
				/>
				{option.label}
			</label>
		);
	}

	if (option.type === "select" && option.options) {
		return (
			<div className="space-y-1">
				<span className="text-xs text-muted-foreground">
					{option.label}
				</span>
				<Select
					value={String(value ?? "")}
					onValueChange={onChange}
				>
					<SelectTrigger className="h-8 text-sm rounded-lg">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{option.options.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		);
	}

	return null;
}

// ── Helpers ──

function initFromItems(
	items: MergedQuantityItem[],
): Map<string, SpecEntry> {
	const map = new Map<string, SpecEntry>();
	for (const item of items) {
		const existing = item.specData as ItemSpecification | undefined;
		map.set(item.key, {
			itemKey: item.key,
			categoryKey: item.categoryKey,
			specTypeKey: existing?.specTypeKey ?? "",
			options: existing?.options ?? {},
			brand: (existing?.options?.brand as string) ?? undefined,
		});
	}
	return map;
}
