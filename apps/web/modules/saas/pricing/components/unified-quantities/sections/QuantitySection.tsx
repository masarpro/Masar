"use client";

import { Card } from "@ui/components/card";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { useEffect, useState } from "react";
import { useItemUpdate } from "../hooks/useItemUpdate";
import { DimensionInput } from "../inputs/DimensionInput";
import { WastageSlider } from "../inputs/WastageSlider";
import type { CalculationMethod, QuantityItem } from "../types";

interface Props {
	item: QuantityItem;
}

interface FieldDef {
	key: "primaryValue" | "secondaryValue" | "tertiaryValue";
	label: string;
	unit: string;
}

const FIELD_LAYOUTS: Record<CalculationMethod, FieldDef[]> = {
	direct_area: [{ key: "primaryValue", label: "المساحة", unit: "م²" }],
	length_x_height: [
		{ key: "primaryValue", label: "الطول", unit: "م" },
		{ key: "secondaryValue", label: "الارتفاع", unit: "م" },
	],
	length_only: [{ key: "primaryValue", label: "الطول", unit: "م" }],
	per_unit: [{ key: "primaryValue", label: "العدد", unit: "" }],
	per_room: [
		{ key: "primaryValue", label: "العدد لكل غرفة", unit: "" },
		{ key: "secondaryValue", label: "عدد الغرف", unit: "غرفة" },
	],
	polygon: [],
	manual: [{ key: "primaryValue", label: "الكمية اليدوية", unit: "" }],
	lump_sum: [],
};

const fmt = (n: unknown, dp = 2) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: dp,
		maximumFractionDigits: dp,
	}).format(Number(n ?? 0));

export function QuantitySection({ item }: Props) {
	const { saveImmediate, isLoading } = useItemUpdate(item);
	const fields = FIELD_LAYOUTS[item.calculationMethod as CalculationMethod] ?? [];

	const [wastage, setWastage] = useState(Number(item.wastagePercent ?? 0));

	useEffect(() => {
		setWastage(Number(item.wastagePercent ?? 0));
	}, [item.wastagePercent]);

	const showOpenings =
		item.calculationMethod === "direct_area" ||
		item.calculationMethod === "length_x_height" ||
		item.calculationMethod === "polygon";

	return (
		<Card className="border-sky-200 bg-sky-50/40 p-4 dark:border-sky-900 dark:bg-sky-950/20">
			<div className="space-y-4">
				<h4 className="text-sm font-semibold text-sky-700 dark:text-sky-300">
					📏 الكمية
				</h4>

				{fields.length > 0 && (
					<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
						{fields.map((f) => (
							<DimensionInput
								key={f.key}
								id={`${item.id}-${f.key}`}
								label={f.label}
								unit={f.unit}
								value={Number(item[f.key] ?? 0)}
								onCommit={(value) =>
									saveImmediate({ [f.key]: value })
								}
								disabled={isLoading}
							/>
						))}
					</div>
				)}

				{item.calculationMethod === "lump_sum" && (
					<p className="text-xs text-muted-foreground">
						مقطوعية — الكمية ثابتة 1، التسعير بالإجمالي.
					</p>
				)}

				{item.calculationMethod === "polygon" && (
					<p className="text-xs text-muted-foreground">
						محرر الأشكال غير المنتظمة قادم في تحديث لاحق. أدخل المساحة يدوياً
						بدلاً من ذلك.
					</p>
				)}

				<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
					<WastageSlider
						value={wastage}
						onChange={(v) => {
							setWastage(v);
							saveImmediate({ wastagePercent: v });
						}}
					/>

					{showOpenings && (
						<div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
							<Label
								htmlFor={`${item.id}-deduct`}
								className="text-xs"
							>
								خصم الفتحات (أبواب/شبابيك)
							</Label>
							<Switch
								id={`${item.id}-deduct`}
								checked={item.deductOpenings}
								onCheckedChange={(v) =>
									saveImmediate({ deductOpenings: v })
								}
							/>
						</div>
					)}
				</div>

				<div className="rounded-lg border bg-background p-3">
					<div className="grid grid-cols-3 gap-3 text-center text-sm">
						<div>
							<p className="text-xs text-muted-foreground">قبل الهدر</p>
							<p className="font-medium tabular-nums">
								{fmt(item.computedQuantity)} {item.unit}
							</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">الفتحات</p>
							<p className="font-medium tabular-nums">
								{fmt(item.openingsArea)}
							</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">الفعّالة</p>
							<p className="font-bold tabular-nums text-sky-700 dark:text-sky-300">
								{fmt(item.effectiveQuantity)} {item.unit}
							</p>
						</div>
					</div>
				</div>
			</div>
		</Card>
	);
}
