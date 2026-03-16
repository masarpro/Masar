"use client";

import { useState } from "react";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/select";
import { Checkbox } from "@ui/components/checkbox";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RampInput } from "../../../../../types/other-structural";
import type { ElementFormProps } from "./ElementFormWrapper";

export function RampForm({ data, onChange }: ElementFormProps<RampInput>) {
	const t = useTranslations("pricing.studies.structural.otherStructural");
	const [showAdvanced, setShowAdvanced] = useState(false);

	const set = (field: keyof RampInput, value: any) => {
		onChange({ ...data, [field]: value });
	};

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<div>
					<Label>{t("fields.rampType")}</Label>
					<Select value={data.rampType} onValueChange={(v) => set("rampType", v)}>
						<SelectTrigger><SelectValue /></SelectTrigger>
						<SelectContent>
							<SelectItem value="CAR_RAMP">{t("rampTypes.CAR_RAMP")}</SelectItem>
							<SelectItem value="PEDESTRIAN_RAMP">{t("rampTypes.PEDESTRIAN_RAMP")}</SelectItem>
							<SelectItem value="LOADING_RAMP">{t("rampTypes.LOADING_RAMP")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label>{t("fields.length")} (م)</Label>
					<Input type="number" min={0} step={0.5} value={data.length || ""} onChange={(e) => set("length", parseFloat(e.target.value) || 0)} />
				</div>
				<div>
					<Label>{t("fields.width")} (م)</Label>
					<Input type="number" min={0} step={0.1} value={data.width || ""} onChange={(e) => set("width", parseFloat(e.target.value) || 0)} />
				</div>
				<div>
					<Label>{t("fields.quantity")}</Label>
					<Input type="number" min={1} step={1} value={data.quantity || 1} onChange={(e) => set("quantity", parseInt(e.target.value) || 1)} />
				</div>
			</div>

			<div className="flex items-center gap-2">
				<Checkbox id="hasWalls" checked={data.hasWalls} onCheckedChange={(v) => set("hasWalls", !!v)} />
				<Label htmlFor="hasWalls">{t("fields.hasWalls")}</Label>
			</div>

			<button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-primary flex items-center gap-1 hover:underline">
				{showAdvanced ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
				{t("fields.advancedSettings")}
			</button>
			{showAdvanced && (
				<div className="grid grid-cols-3 gap-3">
					<div>
						<Label>{t("fields.slabThickness")} (سم)</Label>
						<Input type="number" value={data.thickness} onChange={(e) => set("thickness", parseFloat(e.target.value) || 20)} />
					</div>
					{data.hasWalls && (
						<>
							<div>
								<Label>{t("fields.wallHeight")} (سم)</Label>
								<Input type="number" value={data.wallHeight} onChange={(e) => set("wallHeight", parseFloat(e.target.value) || 100)} />
							</div>
							<div>
								<Label>{t("fields.wallThickness")} (سم)</Label>
								<Input type="number" value={data.wallThickness} onChange={(e) => set("wallThickness", parseFloat(e.target.value) || 20)} />
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
}
