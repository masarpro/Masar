"use client";

import { useState } from "react";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/select";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RetainingWallInput } from "../../../../../types/other-structural";
import type { ElementFormProps } from "./ElementFormWrapper";
import { numOrUndef } from "./numeric-input";

export function RetainingWallForm({ data, onChange }: ElementFormProps<RetainingWallInput>) {
	const t = useTranslations("pricing.studies.structural.otherStructural");
	const [showAdvanced, setShowAdvanced] = useState(false);

	const set = (field: keyof RetainingWallInput, value: any) => {
		onChange({ ...data, [field]: value });
	};

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<div>
					<Label>{t("fields.retainingWallType")}</Label>
					<Select value={data.wallType} onValueChange={(v: any) => set("wallType", v)}>
						<SelectTrigger><SelectValue /></SelectTrigger>
						<SelectContent>
							<SelectItem value="CANTILEVER">{t("retainingWallTypes.CANTILEVER")}</SelectItem>
							<SelectItem value="GRAVITY">{t("retainingWallTypes.GRAVITY")}</SelectItem>
							<SelectItem value="COUNTERFORT">{t("retainingWallTypes.COUNTERFORT")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label>{t("fields.length")} (م)</Label>
					<Input type="number" min={0.1} max={200} step={0.5} value={data.length ?? ""} onChange={(e: any) => set("length", numOrUndef(e.target.value))} />
				</div>
				<div>
					<Label>{t("fields.height")} (م)</Label>
					<Input type="number" min={0.1} max={100} step={0.5} value={data.height ?? ""} onChange={(e: any) => set("height", numOrUndef(e.target.value))} />
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
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
					<div>
						<Label>{t("fields.stemThickness")} (سم)</Label>
						<Input type="number" min={5} max={200} step={5} value={data.stemThickness ?? ""} onChange={(e: any) => set("stemThickness", numOrUndef(e.target.value))} />
					</div>
					<div>
						<Label>{t("fields.baseWidth")} (م)</Label>
						<Input type="number" min={0} max={20} step={0.1} value={data.baseWidth ?? ""} onChange={(e: any) => set("baseWidth", numOrUndef(e.target.value))} />
					</div>
					<div>
						<Label>{t("fields.baseThickness")} (سم)</Label>
						<Input type="number" min={5} max={200} step={5} value={data.baseThickness ?? ""} onChange={(e: any) => set("baseThickness", numOrUndef(e.target.value))} />
					</div>
					<div>
						<Label>{t("fields.embedmentDepth")} (م)</Label>
						<Input type="number" min={0.1} max={10} step={0.1} value={data.embedmentDepth ?? ""} onChange={(e: any) => set("embedmentDepth", numOrUndef(e.target.value))} />
					</div>
				</div>
			)}
		</div>
	);
}
