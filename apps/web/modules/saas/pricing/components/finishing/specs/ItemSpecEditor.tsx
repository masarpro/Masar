"use client";

import { Button } from "@ui/components/button";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Switch } from "@ui/components/switch";
import { Save, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { getSpecConfig } from "../../../lib/specs/catalog";
import { calculateSubItems } from "../../../lib/specs/spec-calculator";
import type {
	CategorySpecConfig,
	ItemSpecification,
	SpecOption,
	SpecSubItem,
	SpecTypeOption,
} from "../../../lib/specs/spec-types";
import { formatNumber, getUnitLabel } from "../../../lib/utils";

interface ItemSpecEditorProps {
	categoryKey: string;
	itemName: string;
	effectiveQuantity: number;
	unit: string;
	existingSpec: ItemSpecification | null;
	onSave: (spec: ItemSpecification) => void;
	onCancel: () => void;
}

export function ItemSpecEditor({
	categoryKey,
	itemName,
	effectiveQuantity,
	unit,
	existingSpec,
	onSave,
	onCancel,
}: ItemSpecEditorProps) {
	const t = useTranslations("pricing.studies.finishing.specs");
	const config = getSpecConfig(categoryKey);

	const [selectedTypeKey, setSelectedTypeKey] = useState<string>(
		existingSpec?.specTypeKey ?? config?.specTypes[0]?.key ?? "",
	);
	const [options, setOptions] = useState<Record<string, unknown>>(
		existingSpec?.options ?? getDefaultOptions(config, selectedTypeKey),
	);

	const selectedType = useMemo(
		() => config?.specTypes.find((s) => s.key === selectedTypeKey),
		[config, selectedTypeKey],
	);

	const allOptions = useMemo(() => {
		if (!config) return [];
		const common = config.commonOptions ?? [];
		const specific = selectedType?.specificOptions ?? [];
		return [...common, ...specific];
	}, [config, selectedType]);

	const subItems = useMemo(() => {
		if (!selectedTypeKey || effectiveQuantity <= 0) return [];
		return calculateSubItems(
			categoryKey,
			selectedTypeKey,
			options,
			effectiveQuantity,
			unit,
		);
	}, [categoryKey, selectedTypeKey, options, effectiveQuantity, unit]);

	const handleTypeChange = useCallback(
		(newTypeKey: string) => {
			setSelectedTypeKey(newTypeKey);
			setOptions(getDefaultOptions(config, newTypeKey));
		},
		[config],
	);

	const handleOptionChange = useCallback(
		(key: string, value: unknown) => {
			setOptions((prev) => ({ ...prev, [key]: value }));
		},
		[],
	);

	const handleSave = useCallback(() => {
		if (!selectedType) return;
		const spec: ItemSpecification = {
			categoryKey,
			specTypeKey: selectedTypeKey,
			specTypeLabel: selectedType.label,
			options,
			subItems,
			notes: undefined,
		};
		onSave(spec);
	}, [categoryKey, selectedTypeKey, selectedType, options, subItems, onSave]);

	if (!config) {
		return (
			<div className="p-4 text-sm text-muted-foreground">
				{t("noSpecConfig")}
			</div>
		);
	}

	return (
		<div className="border-t bg-muted/15 p-5 space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h4 className="text-sm font-semibold">
					{t("title")} — {itemName}
				</h4>
				<div className="flex items-center gap-2">
					<Button
						size="sm"
						className="h-8 text-sm"
						onClick={handleSave}
					>
						<Save className="h-3.5 w-3.5 me-1.5" />
						{t("save")}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 text-sm"
						onClick={onCancel}
					>
						<X className="h-3.5 w-3.5 me-1.5" />
						{t("cancel")}
					</Button>
				</div>
			</div>

			{/* Spec type selector */}
			<div className="space-y-1.5">
				<Label className="text-sm">{t("specType")}</Label>
				<Select
					value={selectedTypeKey}
					onValueChange={handleTypeChange}
				>
					<SelectTrigger className="h-9 text-sm rounded-lg">
						<SelectValue />
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

			{/* Options */}
			{allOptions.length > 0 && (
				<div className="rounded-lg border p-4 space-y-3 bg-card">
					<h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
						{t("options")}
					</h5>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{allOptions.map((opt) => (
							<OptionField
								key={opt.key}
								option={opt}
								value={options[opt.key] ?? opt.defaultValue}
								onChange={(val) =>
									handleOptionChange(opt.key, val)
								}
							/>
						))}
					</div>
				</div>
			)}

			{/* Sub-items table */}
			<SubItemsTable
				subItems={subItems}
				effectiveQuantity={effectiveQuantity}
				unit={unit}
				noQuantityMessage={t("enterQuantityFirst")}
			/>
		</div>
	);
}

function OptionField({
	option,
	value,
	onChange,
}: {
	option: SpecOption;
	value: unknown;
	onChange: (value: unknown) => void;
}) {
	if (option.type === "boolean") {
		return (
			<div className="flex items-center justify-between gap-2">
				<Label className="text-sm">{option.label}</Label>
				<Switch
					checked={value === true}
					onCheckedChange={(checked) => onChange(checked)}
				/>
			</div>
		);
	}

	if (option.type === "select" && option.options) {
		return (
			<div className="space-y-1.5">
				<Label className="text-sm">{option.label}</Label>
				<Select
					value={String(value ?? "")}
					onValueChange={(val) => onChange(val)}
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

function SubItemsTable({
	subItems,
	effectiveQuantity,
	unit,
	noQuantityMessage,
}: {
	subItems: SpecSubItem[];
	effectiveQuantity: number;
	unit: string;
	noQuantityMessage: string;
}) {
	const t = useTranslations("pricing.studies.finishing.specs");

	if (effectiveQuantity <= 0) {
		return (
			<div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
				{noQuantityMessage}
			</div>
		);
	}

	if (subItems.length === 0) {
		return (
			<div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
				{t("noSubItems")}
			</div>
		);
	}

	const unitLabel = getUnitLabel(unit);

	return (
		<div className="rounded-lg border overflow-hidden bg-card">
			<div className="bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground">
				{t("subItemsTitle", {
					quantity: formatNumber(effectiveQuantity, 0),
					unit: unitLabel,
				})}
			</div>
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b bg-muted/20">
						<th className="text-start px-4 py-2 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
							{t("colMaterial")}
						</th>
						<th className="text-center px-2 py-2 font-semibold text-xs uppercase tracking-wide text-muted-foreground w-16">
							{t("colUnit")}
						</th>
						<th className="text-center px-2 py-2 font-semibold text-xs uppercase tracking-wide text-muted-foreground w-20">
							{t("colRate")}
						</th>
						<th className="text-center px-2 py-2 font-semibold text-xs uppercase tracking-wide text-muted-foreground w-24">
							{t("colTotal")}
						</th>
						<th className="text-center px-2 py-2 font-semibold text-xs uppercase tracking-wide text-muted-foreground w-24">
							{t("colSellingUnit")}
						</th>
						<th className="text-center px-2 py-2 font-semibold text-xs uppercase tracking-wide text-muted-foreground w-20">
							{t("colSellingQty")}
						</th>
					</tr>
				</thead>
				<tbody>
					{subItems.map((sub, idx) => (
						<tr
							key={sub.id}
							className={`border-b last:border-b-0 hover:bg-muted/20 transition-colors ${idx % 2 === 1 ? "bg-muted/10" : ""}`}
						>
							<td className="px-4 py-2">
								<span>{sub.name}</span>
								{sub.isOptional && (
									<span className="text-muted-foreground ms-1 text-xs">
										({t("optional")})
									</span>
								)}
							</td>
							<td className="text-center px-2 py-2 text-muted-foreground">
								{sub.unit}
							</td>
							<td className="text-center px-2 py-2 tabular-nums" dir="ltr">
								{formatNumber(sub.ratePerUnit, 2)}
							</td>
							<td className="text-center px-2 py-2 font-semibold tabular-nums" dir="ltr">
								{formatNumber(sub.quantity, 1)}
							</td>
							<td className="text-center px-2 py-2 text-xs text-muted-foreground">
								{sub.sellingUnit ?? "—"}
							</td>
							<td className="text-center px-2 py-2 font-semibold tabular-nums text-primary" dir="ltr">
								{sub.sellingQuantity != null
									? formatNumber(sub.sellingQuantity, 0)
									: "—"}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function getDefaultOptions(
	config: CategorySpecConfig | undefined,
	typeKey: string,
): Record<string, unknown> {
	if (!config) return {};
	const specType = config.specTypes.find((s) => s.key === typeKey);
	const defaults: Record<string, unknown> = {};
	for (const opt of config.commonOptions) {
		defaults[opt.key] = opt.defaultValue;
	}
	if (specType?.defaultOptions) {
		Object.assign(defaults, specType.defaultOptions);
	}
	return defaults;
}
