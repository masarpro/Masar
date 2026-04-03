"use client";

import { useState } from "react";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/select";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ElevatedWaterTankInput } from "../../../../../types/other-structural";
import type { ElementFormProps } from "./ElementFormWrapper";

export function WaterTankElevatedForm({ data, onChange }: ElementFormProps<ElevatedWaterTankInput>) {
	const t = useTranslations("pricing.studies.structural.otherStructural");
	const [showAdvanced, setShowAdvanced] = useState(false);

	const set = (field: keyof ElevatedWaterTankInput, value: any) => {
		onChange({ ...data, [field]: value });
	};

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<div>
					<Label>{t("fields.shape")}</Label>
					<Select value={data.shape} onValueChange={(v: any) => set("shape", v)}>
						<SelectTrigger><SelectValue /></SelectTrigger>
						<SelectContent>
							<SelectItem value="RECTANGULAR">{t("shapes.RECTANGULAR")}</SelectItem>
							<SelectItem value="CYLINDRICAL">{t("shapes.CYLINDRICAL")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				{data.shape === "RECTANGULAR" ? (
					<>
						<div>
							<Label>{t("fields.length")} (م)</Label>
							<Input type="number" min={0} step={0.1} value={data.length || ""} onChange={(e: any) => set("length", parseFloat(e.target.value) || 0)} />
						</div>
						<div>
							<Label>{t("fields.width")} (م)</Label>
							<Input type="number" min={0} step={0.1} value={data.width || ""} onChange={(e: any) => set("width", parseFloat(e.target.value) || 0)} />
						</div>
					</>
				) : (
					<div>
						<Label>{t("fields.diameter")} (م)</Label>
						<Input type="number" min={0} step={0.1} value={data.diameter || ""} onChange={(e: any) => set("diameter", parseFloat(e.target.value) || 0)} />
					</div>
				)}
				<div>
					<Label>{t("fields.depth")} (م)</Label>
					<Input type="number" min={0} step={0.1} value={data.depth || ""} onChange={(e: any) => set("depth", parseFloat(e.target.value) || 0)} />
				</div>
				<div>
					<Label>{t("fields.quantity")}</Label>
					<Input type="number" min={1} step={1} value={data.quantity || 1} onChange={(e: any) => set("quantity", parseInt(e.target.value) || 1)} />
				</div>
			</div>

			<button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-primary flex items-center gap-1 hover:underline">
				{showAdvanced ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
				{t("fields.advancedSettings")}
			</button>
			{showAdvanced && (
				<div className="grid grid-cols-3 gap-3">
					<div>
						<Label>{t("fields.wallThickness")} (سم)</Label>
						<Input type="number" value={data.wallThickness} onChange={(e: any) => set("wallThickness", parseFloat(e.target.value) || 20)} />
					</div>
					<div>
						<Label>{t("fields.baseThickness")} (سم)</Label>
						<Input type="number" value={data.baseThickness} onChange={(e: any) => set("baseThickness", parseFloat(e.target.value) || 25)} />
					</div>
					<div>
						<Label>{t("fields.slabThickness")} (سم)</Label>
						<Input type="number" value={data.slabThickness} onChange={(e: any) => set("slabThickness", parseFloat(e.target.value) || 15)} />
					</div>
				</div>
			)}
		</div>
	);
}
