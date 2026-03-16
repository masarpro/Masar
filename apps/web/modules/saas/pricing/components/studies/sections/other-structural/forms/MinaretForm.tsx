"use client";

import { useState } from "react";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/select";
import { Checkbox } from "@ui/components/checkbox";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { MINARET_STYLE_FACTORS } from "../../../../../constants/other-structural";
import type { MinaretInput, MinaretStyle } from "../../../../../types/other-structural";
import type { ElementFormProps } from "./ElementFormWrapper";

export function MinaretForm({ data, onChange }: ElementFormProps<MinaretInput>) {
	const t = useTranslations("pricing.studies.structural.otherStructural");
	const [showAdvanced, setShowAdvanced] = useState(false);

	const set = (field: keyof MinaretInput, value: any) => {
		onChange({ ...data, [field]: value });
	};

	const handleStyleChange = (style: MinaretStyle) => {
		const factor = MINARET_STYLE_FACTORS[style];
		onChange({
			...data,
			style,
			shape: factor.shapeDefault,
			wallThickness: factor.wallThicknessDefault,
			outerDiameter: factor.diameterDefault,
			sideLength: factor.diameterDefault,
		});
	};

	const styles = Object.entries(MINARET_STYLE_FACTORS) as [MinaretStyle, typeof MINARET_STYLE_FACTORS[MinaretStyle]][];

	return (
		<div className="space-y-4">
			{/* اختيار الطراز */}
			<div>
				<Label>{t("fields.minaretStyle")}</Label>
				<div className="flex flex-wrap gap-2 mt-1">
					{styles.map(([key, val]) => (
						<button
							key={key}
							type="button"
							onClick={() => handleStyleChange(key)}
							className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
								data.style === key
									? "bg-primary text-primary-foreground border-primary"
									: "bg-muted hover:bg-muted/80 border-border"
							}`}
						>
							{val.description_ar}
						</button>
					))}
				</div>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<div>
					<Label>{t("fields.minaretShape")}</Label>
					<Select value={data.shape} onValueChange={(v) => set("shape", v)}>
						<SelectTrigger><SelectValue /></SelectTrigger>
						<SelectContent>
							<SelectItem value="CYLINDRICAL">{t("minaretShapes.CYLINDRICAL")}</SelectItem>
							<SelectItem value="SQUARE">{t("minaretShapes.SQUARE")}</SelectItem>
							<SelectItem value="OCTAGONAL">{t("minaretShapes.OCTAGONAL")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label>{t("fields.totalHeight")} (م)</Label>
					<Input type="number" min={0} step={1} value={data.totalHeight || ""} onChange={(e) => set("totalHeight", parseFloat(e.target.value) || 0)} />
				</div>
				<div>
					<Label>{data.shape === "SQUARE" ? t("fields.sideLength") : t("fields.outerDiameter")} (م)</Label>
					<Input
						type="number" min={0} step={0.1}
						value={data.shape === "SQUARE" ? (data.sideLength || data.outerDiameter || "") : (data.outerDiameter || "")}
						onChange={(e) => {
							const v = parseFloat(e.target.value) || 0;
							if (data.shape === "SQUARE") set("sideLength", v);
							else set("outerDiameter", v);
						}}
					/>
				</div>
				<div>
					<Label>{t("fields.quantity")}</Label>
					<Input type="number" min={1} step={1} value={data.quantity || 1} onChange={(e) => set("quantity", parseInt(e.target.value) || 1)} />
				</div>
			</div>

			<div className="flex flex-wrap gap-4">
				<div className="flex items-center gap-2">
					<Checkbox id="hasBalcony" checked={data.hasBalcony} onCheckedChange={(v) => set("hasBalcony", !!v)} />
					<Label htmlFor="hasBalcony">{t("fields.hasBalcony")}</Label>
				</div>
				{data.hasBalcony && (
					<div className="flex items-center gap-2">
						<Label>{t("fields.balconyCount")}</Label>
						<Input type="number" min={1} step={1} className="w-16" value={data.balconyCount} onChange={(e) => set("balconyCount", parseInt(e.target.value) || 1)} />
					</div>
				)}
			</div>

			<div>
				<Label>{t("fields.topType")}</Label>
				<Select value={data.topType} onValueChange={(v) => set("topType", v)}>
					<SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
					<SelectContent>
						<SelectItem value="CONE">{t("topTypes.CONE")}</SelectItem>
						<SelectItem value="DOME_SMALL">{t("topTypes.DOME_SMALL")}</SelectItem>
						<SelectItem value="GRC">{t("topTypes.GRC")}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-primary flex items-center gap-1 hover:underline">
				{showAdvanced ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
				{t("fields.advancedSettings")}
			</button>
			{showAdvanced && (
				<div className="grid grid-cols-3 gap-3">
					<div>
						<Label>{t("fields.wallThickness")} (سم)</Label>
						<Input type="number" value={data.wallThickness} onChange={(e) => set("wallThickness", parseFloat(e.target.value) || 25)} />
					</div>
					{data.hasBalcony && (
						<div>
							<Label>{t("fields.balconyProjection")} (سم)</Label>
							<Input type="number" value={data.balconyProjection} onChange={(e) => set("balconyProjection", parseFloat(e.target.value) || 80)} />
						</div>
					)}
				</div>
			)}
		</div>
	);
}
