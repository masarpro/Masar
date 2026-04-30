"use client";

import { Card } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { useState } from "react";
import { useItemUpdate } from "../hooks/useItemUpdate";
import { MaterialPicker, type CommonMaterial } from "../inputs/MaterialPicker";
import type { ItemCatalogEntry, QuantityItem } from "../types";

interface Props {
	item: QuantityItem;
	catalogEntry?: ItemCatalogEntry | null;
}

export function SpecificationsSection({ item, catalogEntry }: Props) {
	const { debouncedSave, saveImmediate } = useItemUpdate(item);

	const [name, setName] = useState(item.specMaterialName ?? "");
	const [brand, setBrand] = useState(item.specMaterialBrand ?? "");
	const [grade, setGrade] = useState(item.specMaterialGrade ?? "");
	const [color, setColor] = useState(item.specColor ?? "");
	const [notes, setNotes] = useState(item.specNotes ?? "");

	const materials = (catalogEntry?.commonMaterials ?? null) as
		| CommonMaterial[]
		| null;

	const onMaterialPick = (m: CommonMaterial) => {
		setName(m.nameAr);
		setBrand(m.brand ?? "");
		setGrade(m.grade ?? "");
		const override: Record<string, unknown> = {
			specMaterialName: m.nameAr,
			specMaterialBrand: m.brand ?? null,
			specMaterialGrade: m.grade ?? null,
			specSource: m.source ?? null,
		};
		if (m.suggestedPrice != null) {
			override.materialUnitPrice = m.suggestedPrice;
		}
		saveImmediate(override);
	};

	return (
		<Card className="border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900 dark:bg-amber-950/20">
			<div className="space-y-4">
				<h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300">
					📝 المواصفات
				</h4>

				{materials && materials.length > 0 && (
					<MaterialPicker
						materials={materials}
						value={{ name, brand }}
						onSelect={onMaterialPick}
					/>
				)}

				<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
					<div className="space-y-1.5">
						<Label
							htmlFor={`${item.id}-spec-name`}
							className="text-xs text-muted-foreground"
						>
							اسم المادة
						</Label>
						<Input
							id={`${item.id}-spec-name`}
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								debouncedSave({ specMaterialName: e.target.value });
							}}
						/>
					</div>

					<div className="space-y-1.5">
						<Label
							htmlFor={`${item.id}-spec-brand`}
							className="text-xs text-muted-foreground"
						>
							الماركة
						</Label>
						<Input
							id={`${item.id}-spec-brand`}
							value={brand}
							onChange={(e) => {
								setBrand(e.target.value);
								debouncedSave({ specMaterialBrand: e.target.value });
							}}
						/>
					</div>

					<div className="space-y-1.5">
						<Label
							htmlFor={`${item.id}-spec-grade`}
							className="text-xs text-muted-foreground"
						>
							الجودة
						</Label>
						<Input
							id={`${item.id}-spec-grade`}
							value={grade}
							onChange={(e) => {
								setGrade(e.target.value);
								debouncedSave({ specMaterialGrade: e.target.value });
							}}
							placeholder="فاخر / عادي / اقتصادي"
						/>
					</div>

					<div className="space-y-1.5">
						<Label
							htmlFor={`${item.id}-spec-color`}
							className="text-xs text-muted-foreground"
						>
							اللون
						</Label>
						<Input
							id={`${item.id}-spec-color`}
							value={color}
							onChange={(e) => {
								setColor(e.target.value);
								debouncedSave({ specColor: e.target.value });
							}}
						/>
					</div>
				</div>

				<div className="space-y-1.5">
					<Label
						htmlFor={`${item.id}-spec-notes`}
						className="text-xs text-muted-foreground"
					>
						ملاحظات
					</Label>
					<Textarea
						id={`${item.id}-spec-notes`}
						value={notes}
						onChange={(e) => {
							setNotes(e.target.value);
							debouncedSave({ specNotes: e.target.value });
						}}
						rows={2}
					/>
				</div>
			</div>
		</Card>
	);
}
