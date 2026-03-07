"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	CheckCircle2,
	ChevronDown,
	Circle,
	Save,
	Settings,
	X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { getSpecConfig } from "../../../lib/specs/catalog";
import { buildItemSpec } from "../../../lib/specs/spec-calculator";
import { SYSTEM_TEMPLATES } from "../../../lib/specs/system-templates";
import type {
	ItemSpecification,
	SavedCategorySpec,
	SpecificationTemplate,
} from "../../../lib/specs/spec-types";
import type { MergedQuantityItem } from "../../../lib/merge-quantities";
import { groupMergedItems } from "../../../lib/merge-quantities";
import { mapToCatalogCategory } from "../../../lib/utils";

interface SpecBulkEditorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	items: MergedQuantityItem[];
	customTemplates: SpecificationTemplate[];
	onSaveAll: (specs: Map<string, ItemSpecification>) => void;
	onSaveTemplate: (name: string, specs: SavedCategorySpec[]) => void;
}

interface BulkSpecEntry {
	itemKey: string;
	categoryKey: string;
	specTypeKey: string;
	options: Record<string, unknown>;
	brand?: string;
}

export function SpecBulkEditor({
	open,
	onOpenChange,
	items,
	customTemplates,
	onSaveAll,
	onSaveTemplate,
}: SpecBulkEditorProps) {
	const t = useTranslations("pricing.studies.finishing.specs");
	const tBulk = useTranslations("pricing.studies.finishing.bulk");

	const enabledItems = useMemo(
		() => items.filter((i) => i.isEnabled),
		[items],
	);
	const grouped = useMemo(
		() => groupMergedItems(enabledItems),
		[enabledItems],
	);

	// Spec state per item key
	const [specs, setSpecs] = useState<Map<string, BulkSpecEntry>>(() =>
		initFromItems(enabledItems),
	);
	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
		new Set(),
	);
	const [expandedRow, setExpandedRow] = useState<string | null>(null);
	const [selectedTemplate, setSelectedTemplate] = useState<string>("");
	const [showSaveTemplate, setShowSaveTemplate] = useState(false);
	const [templateName, setTemplateName] = useState("");

	// All available templates: system + custom
	const allTemplates = useMemo(() => {
		const system = SYSTEM_TEMPLATES.map((t, i) => ({
			id: `system_${i}`,
			name: t.name,
			isSystem: true,
			isDefault: t.isDefault,
			specs: t.specs,
		}));
		const custom = customTemplates.map((t) => ({
			id: t.id,
			name: t.name,
			isSystem: false,
			isDefault: t.isDefault,
			specs: t.specs,
		}));
		return [...system, ...custom];
	}, [customTemplates]);

	const specCount = useMemo(() => {
		let count = 0;
		for (const entry of specs.values()) {
			if (entry.specTypeKey) count++;
		}
		return count;
	}, [specs]);

	const toggleGroup = useCallback((groupKey: string) => {
		setCollapsedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(groupKey)) next.delete(groupKey);
			else next.add(groupKey);
			return next;
		});
	}, []);

	const handleApplyTemplate = useCallback(() => {
		const template = allTemplates.find((t) => t.id === selectedTemplate);
		if (!template) return;

		setSpecs((prev) => {
			const next = new Map(prev);
			for (const item of enabledItems) {
				const existing = next.get(item.key);
				if (!existing) continue;

				// Find matching template spec by category key
				const dbCategory = mapToCatalogCategory(item.categoryKey);
				const templateSpec = template.specs.find(
					(s) => s.categoryKey === dbCategory,
				);
				if (templateSpec) {
					next.set(item.key, {
						...existing,
						specTypeKey: templateSpec.specTypeKey,
						options: { ...templateSpec.options },
						brand: templateSpec.brand,
					});
				}
			}
			return next;
		});
	}, [selectedTemplate, allTemplates, enabledItems]);

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
		},
		[],
	);

	const handleSetAllInGroup = useCallback(
		(groupKey: string) => {
			const group = grouped.find((g) => g.groupKey === groupKey);
			if (!group) return;

			// Use the first item's spec to fill all items in the group
			const firstItem = group.items[0];
			if (!firstItem) return;
			const firstSpec = specs.get(firstItem.key);
			if (!firstSpec?.specTypeKey) return;

			setSpecs((prev) => {
				const next = new Map(prev);
				for (const item of group.items) {
					const existing = next.get(item.key);
					if (!existing) continue;

					// Only apply if same catalog category
					const itemCat = mapToCatalogCategory(item.categoryKey);
					const firstCat = mapToCatalogCategory(
						firstSpec.categoryKey,
					);
					if (itemCat === firstCat) {
						next.set(item.key, {
							...existing,
							specTypeKey: firstSpec.specTypeKey,
							options: { ...firstSpec.options },
							brand: firstSpec.brand,
						});
					}
				}
				return next;
			});
		},
		[grouped, specs],
	);

	const handleSaveAll = useCallback(() => {
		const result = new Map<string, ItemSpecification>();

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
			result.set(item.key, spec);
		}

		onSaveAll(result);
		onOpenChange(false);
	}, [enabledItems, specs, onSaveAll, onOpenChange]);

	const handleSaveAsTemplate = useCallback(() => {
		if (!templateName.trim()) return;

		const templateSpecs: SavedCategorySpec[] = [];
		const seenCategories = new Set<string>();

		for (const entry of specs.values()) {
			if (!entry.specTypeKey) continue;
			const catKey = mapToCatalogCategory(entry.categoryKey);
			if (seenCategories.has(catKey)) continue;
			seenCategories.add(catKey);

			templateSpecs.push({
				categoryKey: catKey,
				specTypeKey: entry.specTypeKey,
				options: entry.options,
				brand: entry.brand,
			});
		}

		onSaveTemplate(templateName.trim(), templateSpecs);
		setShowSaveTemplate(false);
		setTemplateName("");
	}, [templateName, specs, onSaveTemplate]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-5xl max-h-[85vh] flex flex-col p-0">
				<DialogHeader className="px-6 pt-6 pb-0">
					<DialogTitle className="flex items-center gap-2 text-lg">
						<Settings className="h-5 w-5" />
						{tBulk("title")}
					</DialogTitle>
				</DialogHeader>

				{/* Template selector */}
				<div className="px-6 py-3 border-b bg-muted/10 flex flex-wrap items-center gap-2.5">
					<span className="text-sm text-muted-foreground">
						{tBulk("applyTemplate")}:
					</span>
					<Select
						value={selectedTemplate}
						onValueChange={setSelectedTemplate}
					>
						<SelectTrigger className="h-9 w-52 text-sm rounded-lg">
							<SelectValue
								placeholder={tBulk("selectTemplate")}
							/>
						</SelectTrigger>
						<SelectContent>
							{allTemplates.map((tmpl) => (
								<SelectItem key={tmpl.id} value={tmpl.id}>
									{tmpl.name}
									{tmpl.isDefault ? ` (${tBulk("default")})` : ""}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						variant="outline"
						size="sm"
						className="h-9 text-sm rounded-lg"
						onClick={handleApplyTemplate}
						disabled={!selectedTemplate}
					>
						{tBulk("apply")}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="h-9 text-sm"
						onClick={() => setShowSaveTemplate(true)}
					>
						{tBulk("saveAsTemplate")}
					</Button>

					{showSaveTemplate && (
						<div className="flex items-center gap-2 w-full mt-2">
							<input
								type="text"
								value={templateName}
								onChange={(e) =>
									setTemplateName(e.target.value)
								}
								placeholder={tBulk("templateNamePlaceholder")}
								className="flex-1 h-9 text-sm rounded-lg border px-3 bg-background"
							/>
							<Button
								size="sm"
								className="h-9 text-sm rounded-lg"
								onClick={handleSaveAsTemplate}
								disabled={!templateName.trim()}
							>
								<Save className="h-3.5 w-3.5 me-1.5" />
								{t("save")}
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="h-9 text-sm"
								onClick={() => setShowSaveTemplate(false)}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>

				{/* Items list */}
				<div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
					{grouped.map((group) => {
						const isCollapsed = collapsedGroups.has(
							group.groupKey,
						);
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
									onClick={() =>
										toggleGroup(group.groupKey)
									}
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
										className="h-7 text-xs ms-auto"
										onClick={(e) => {
											e.stopPropagation();
											handleSetAllInGroup(
												group.groupKey,
											);
										}}
									>
										{tBulk("setAll")}
									</Button>
								</button>

								{/* Items */}
								{!isCollapsed && (
									<div>
										{/* Header row */}
										<div className="hidden sm:grid grid-cols-[1fr_180px_130px_50px] gap-2 px-4 py-2 bg-muted/20 text-xs font-semibold text-muted-foreground border-b uppercase tracking-wide">
											<div>
												{t("colMaterial")}
											</div>
											<div className="text-center">
												{t("specType")}
											</div>
											<div className="text-center">
												{tBulk("brand")}
											</div>
											<div className="text-center">
												{tBulk("status")}
											</div>
										</div>

										{group.items.map((item) => {
											const entry = specs.get(
												item.key,
											);
											const catKey =
												mapToCatalogCategory(
													item.categoryKey,
												);
											const config =
												getSpecConfig(catKey);
											const hasSpec =
												!!entry?.specTypeKey;
											const isExpanded =
												expandedRow === item.key;

											return (
												<BulkRow
													key={item.key}
													item={item}
													entry={entry}
													config={config}
													catKey={catKey}
													hasSpec={hasSpec}
													isExpanded={isExpanded}
													onToggleExpand={() =>
														setExpandedRow(
															isExpanded
																? null
																: item.key,
														)
													}
													onTypeChange={(
														typeKey,
													) =>
														handleTypeChange(
															item.key,
															typeKey,
														)
													}
													onOptionChange={(
														optKey,
														val,
													) =>
														handleOptionChange(
															item.key,
															optKey,
															val,
														)
													}
												/>
											);
										})}
									</div>
								)}
							</div>
						);
					})}
				</div>

				{/* Footer - sticky save */}
				<div className="sticky bottom-0 px-6 py-4 border-t flex items-center justify-between bg-background/95 backdrop-blur-sm">
					<span className="text-sm text-muted-foreground">
						{tBulk("specifiedCount", {
							count: specCount,
							total: enabledItems.length,
						})}
					</span>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							className="h-9 text-sm"
							onClick={() => onOpenChange(false)}
						>
							{t("cancel")}
						</Button>
						<Button size="sm" className="h-9 text-sm" onClick={handleSaveAll}>
							<Save className="h-4 w-4 me-1.5" />
							{tBulk("saveAll")}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ── BulkRow ──

function BulkRow({
	item,
	entry,
	config,
	catKey,
	hasSpec,
	isExpanded,
	onToggleExpand,
	onTypeChange,
	onOptionChange,
}: {
	item: MergedQuantityItem;
	entry: BulkSpecEntry | undefined;
	config: ReturnType<typeof getSpecConfig>;
	catKey: string;
	hasSpec: boolean;
	isExpanded: boolean;
	onToggleExpand: () => void;
	onTypeChange: (typeKey: string) => void;
	onOptionChange: (optKey: string, val: unknown) => void;
}) {
	const t = useTranslations("pricing.studies.finishing.specs");

	if (!config) {
		return (
			<div className="grid grid-cols-[1fr_180px_130px_50px] gap-2 px-4 py-2.5 border-b items-center text-sm opacity-50">
				<span className="truncate">{item.name}</span>
				<span className="text-center text-sm text-muted-foreground">
					{t("noSpecConfig")}
				</span>
				<span />
				<span className="flex justify-center">
					<Circle className="h-4 w-4 text-muted-foreground/30" />
				</span>
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
				className="grid grid-cols-[1fr_180px_130px_50px] gap-2 px-4 py-2.5 items-center text-sm cursor-pointer hover:bg-muted/20 transition-colors duration-200"
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
				<div
					onClick={(e: React.MouseEvent) => e.stopPropagation()}
				>
					<Select
						value={entry?.specTypeKey ?? ""}
						onValueChange={onTypeChange}
					>
						<SelectTrigger className="h-8 text-sm rounded-lg">
							<SelectValue
								placeholder={t("specType")}
							/>
						</SelectTrigger>
						<SelectContent>
							{config.specTypes.map((st) => (
								<SelectItem
									key={st.key}
									value={st.key}
								>
									{st.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Brand */}
				<div className="text-center text-sm text-muted-foreground truncate">
					{entry?.brand ?? "-"}
				</div>

				{/* Status */}
				<div className="flex justify-center">
					{hasSpec ? (
						<CheckCircle2 className="h-4 w-4 text-emerald-500" />
					) : (
						<Circle className="h-4 w-4 text-muted-foreground/30" />
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
									entry.options[opt.key] ??
									opt.defaultValue
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
	option: { key: string; label: string; type: string; options?: { value: string; label: string }[]; defaultValue: unknown };
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
): Map<string, BulkSpecEntry> {
	const map = new Map<string, BulkSpecEntry>();
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
