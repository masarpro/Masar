"use client";

import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Button } from "@ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/select";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ConcreteDecorInput, ConcreteDecorItem, DecorItemType, DecorMaterial, DecorUnit } from "../../../../../types/other-structural";
import type { ElementFormProps } from "./ElementFormWrapper";

function newDecorItem(): ConcreteDecorItem {
	return {
		id: crypto.randomUUID(),
		type: 'CORNICE',
		material: 'GRC',
		unit: 'LINEAR_METER',
		length: 0,
		quantity: 1,
	};
}

export function ConcreteDecorForm({ data, onChange }: ElementFormProps<ConcreteDecorInput>) {
	const t = useTranslations("pricing.studies.structural.otherStructural");

	const updateItem = (idx: number, field: keyof ConcreteDecorItem, value: any) => {
		const items = [...data.items];
		items[idx] = { ...items[idx], [field]: value };
		onChange({ ...data, items });
	};

	const addItem = () => {
		onChange({ ...data, items: [...data.items, newDecorItem()] });
	};

	const removeItem = (idx: number) => {
		onChange({ ...data, items: data.items.filter((_, i) => i !== idx) });
	};

	return (
		<div className="space-y-4">
			{data.items.map((item, idx) => (
				<div key={item.id} className="border rounded-lg p-3 space-y-3">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">#{idx + 1}</span>
						<Button variant="ghost" size="sm" onClick={() => removeItem(idx)}>
							<Trash2 className="h-4 w-4 text-destructive" />
						</Button>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
						<div>
							<Label>{t("fields.decorType")}</Label>
							<Select value={item.type} onValueChange={(v) => updateItem(idx, "type", v as DecorItemType)}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									{(['CORNICE', 'COLUMN_DECORATIVE', 'CAPITAL', 'WINDOW_FRAME', 'FRONTON', 'CORBEL', 'PANEL', 'BALUSTRADE', 'BALUSTER', 'MASHRABIYA', 'CLADDING', 'BELT', 'OTHER_DECOR'] as DecorItemType[]).map((dt) => (
										<SelectItem key={dt} value={dt}>{t(`decorTypes.${dt}`)}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>{t("fields.decorMaterial")}</Label>
							<Select value={item.material} onValueChange={(v) => updateItem(idx, "material", v as DecorMaterial)}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="GRC">{t("decorMaterials.GRC")}</SelectItem>
									<SelectItem value="GRP">{t("decorMaterials.GRP")}</SelectItem>
									<SelectItem value="RC">{t("decorMaterials.RC")}</SelectItem>
									<SelectItem value="STONE">{t("decorMaterials.STONE")}</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>{t("fields.decorUnit")}</Label>
							<Select value={item.unit} onValueChange={(v) => updateItem(idx, "unit", v as DecorUnit)}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="LINEAR_METER">{t("decorUnits.LINEAR_METER")}</SelectItem>
									<SelectItem value="SQM">{t("decorUnits.SQM")}</SelectItem>
									<SelectItem value="PIECE">{t("decorUnits.PIECE")}</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>{t("fields.quantity")}</Label>
							<Input type="number" min={1} step={1} value={item.quantity || 1} onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)} />
						</div>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
						{item.unit === 'LINEAR_METER' && (
							<div>
								<Label>{t("fields.length")} (م.ط)</Label>
								<Input type="number" min={0} step={0.5} value={item.length || ""} onChange={(e) => updateItem(idx, "length", parseFloat(e.target.value) || 0)} />
							</div>
						)}
						{item.unit === 'SQM' && (
							<div>
								<Label>{t("fields.area")} (م²)</Label>
								<Input type="number" min={0} step={0.5} value={item.area || ""} onChange={(e) => updateItem(idx, "area", parseFloat(e.target.value) || 0)} />
							</div>
						)}
						{(item.unit === 'PIECE' || item.unit === 'LINEAR_METER') && (
							<>
								<div>
									<Label>{t("fields.height")} (سم)</Label>
									<Input type="number" value={item.height ?? ""} onChange={(e) => updateItem(idx, "height", parseFloat(e.target.value) || 0)} />
								</div>
								{item.unit === 'PIECE' && (
									<div>
										<Label>{t("fields.width")} (سم)</Label>
										<Input type="number" value={item.width ?? ""} onChange={(e) => updateItem(idx, "width", parseFloat(e.target.value) || 0)} />
									</div>
								)}
							</>
						)}
						<div className="col-span-2">
							<Label>{t("fields.description")}</Label>
							<Input value={item.description ?? ""} onChange={(e) => updateItem(idx, "description", e.target.value)} />
						</div>
					</div>
				</div>
			))}

			<Button variant="outline" size="sm" onClick={addItem} className="gap-1">
				<Plus className="h-4 w-4" />
				{t("fields.addDecorItem")}
			</Button>
		</div>
	);
}
