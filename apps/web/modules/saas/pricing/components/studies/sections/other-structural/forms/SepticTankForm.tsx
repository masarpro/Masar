"use client";

import { useState } from "react";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/select";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SepticTankInput } from "../../../../../types/other-structural";
import type { ElementFormProps } from "./ElementFormWrapper";

export function SepticTankForm({ data, onChange }: ElementFormProps<SepticTankInput>) {
	const t = useTranslations("pricing.studies.structural.otherStructural");
	const [showAdvanced, setShowAdvanced] = useState(false);

	const set = (field: keyof SepticTankInput, value: any) => {
		onChange({ ...data, [field]: value });
	};

	return (
		<div className="space-y-4">
			{/* نوع البيارة */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<div>
					<Label>{t("fields.tankType")}</Label>
					<Select value={data.tankType} onValueChange={(v) => set("tankType", v)}>
						<SelectTrigger><SelectValue /></SelectTrigger>
						<SelectContent>
							<SelectItem value="SEALED">{t("tankTypes.SEALED")}</SelectItem>
							<SelectItem value="OPEN">{t("tankTypes.OPEN")}</SelectItem>
							<SelectItem value="TWO_CHAMBER">{t("tankTypes.TWO_CHAMBER")}</SelectItem>
							<SelectItem value="PRECAST">{t("tankTypes.PRECAST")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label>{t("fields.wallType")}</Label>
					<Select value={data.wallType} onValueChange={(v) => set("wallType", v)}>
						<SelectTrigger><SelectValue /></SelectTrigger>
						<SelectContent>
							<SelectItem value="RC">{t("wallTypes.RC")}</SelectItem>
							<SelectItem value="BLOCK_20">{t("wallTypes.BLOCK_20")}</SelectItem>
							<SelectItem value="BLOCK_15">{t("wallTypes.BLOCK_15")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* الأبعاد الأساسية */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<div>
					<Label>{t("fields.length")} (م)</Label>
					<Input type="number" min={0} step={0.1} value={data.length || ""} onChange={(e) => set("length", parseFloat(e.target.value) || 0)} />
				</div>
				<div>
					<Label>{t("fields.width")} (م)</Label>
					<Input type="number" min={0} step={0.1} value={data.width || ""} onChange={(e) => set("width", parseFloat(e.target.value) || 0)} />
				</div>
				<div>
					<Label>{t("fields.depth")} (م)</Label>
					<Input type="number" min={0} step={0.1} value={data.depth || ""} onChange={(e) => set("depth", parseFloat(e.target.value) || 0)} />
				</div>
				<div>
					<Label>{t("fields.quantity")}</Label>
					<Input type="number" min={1} step={1} value={data.quantity || 1} onChange={(e) => set("quantity", parseInt(e.target.value) || 1)} />
				</div>
			</div>

			{/* إعدادات متقدمة */}
			<button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-primary flex items-center gap-1 hover:underline">
				{showAdvanced ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
				{t("fields.advancedSettings")}
			</button>
			{showAdvanced && (
				<div className="grid grid-cols-3 gap-3">
					<div>
						<Label>{t("fields.wallThickness")} (سم)</Label>
						<Input type="number" min={10} step={5} value={data.wallThickness} onChange={(e) => set("wallThickness", parseFloat(e.target.value) || 20)} />
					</div>
					<div>
						<Label>{t("fields.baseThickness")} (سم)</Label>
						<Input type="number" min={15} step={5} value={data.baseThickness} onChange={(e) => set("baseThickness", parseFloat(e.target.value) || 25)} />
					</div>
					<div>
						<Label>{t("fields.slabThickness")} (سم)</Label>
						<Input type="number" min={10} step={5} value={data.slabThickness} onChange={(e) => set("slabThickness", parseFloat(e.target.value) || 15)} />
					</div>
				</div>
			)}
		</div>
	);
}
