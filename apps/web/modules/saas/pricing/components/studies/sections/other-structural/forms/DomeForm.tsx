"use client";

import { useState } from "react";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/select";
import { Checkbox } from "@ui/components/checkbox";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DomeInput } from "../../../../../types/other-structural";
import type { ElementFormProps } from "./ElementFormWrapper";

export function DomeForm({ data, onChange }: ElementFormProps<DomeInput>) {
	const t = useTranslations("pricing.studies.structural.otherStructural");
	const [showAdvanced, setShowAdvanced] = useState(false);

	const set = (field: keyof DomeInput, value: any) => {
		onChange({ ...data, [field]: value });
	};

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<div>
					<Label>{t("fields.domeType")}</Label>
					<Select value={data.domeType} onValueChange={(v) => set("domeType", v)}>
						<SelectTrigger><SelectValue /></SelectTrigger>
						<SelectContent>
							<SelectItem value="HALF_SPHERE">{t("domeTypes.HALF_SPHERE")}</SelectItem>
							<SelectItem value="POINTED">{t("domeTypes.POINTED")}</SelectItem>
							<SelectItem value="RIBBED">{t("domeTypes.RIBBED")}</SelectItem>
							<SelectItem value="GRC_PRECAST">{t("domeTypes.GRC_PRECAST")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label>{t("fields.diameter")} (م)</Label>
					<Input type="number" min={0} step={0.5} value={data.diameter || ""} onChange={(e) => set("diameter", parseFloat(e.target.value) || 0)} />
				</div>
				<div>
					<Label>{t("fields.riseHeight")} (م)</Label>
					<Input type="number" min={0} step={0.5} value={data.riseHeight || ""} onChange={(e) => set("riseHeight", parseFloat(e.target.value) || 0)} />
				</div>
				<div>
					<Label>{t("fields.quantity")}</Label>
					<Input type="number" min={1} step={1} value={data.quantity || 1} onChange={(e) => set("quantity", parseInt(e.target.value) || 1)} />
				</div>
			</div>

			<div className="flex flex-wrap gap-4">
				<div className="flex items-center gap-2">
					<Checkbox id="hasRingBeam" checked={data.hasRingBeam} onCheckedChange={(v) => set("hasRingBeam", !!v)} />
					<Label htmlFor="hasRingBeam">{t("fields.hasRingBeam")}</Label>
				</div>
				<div className="flex items-center gap-2">
					<Checkbox id="hasDrum" checked={data.hasDrum} onCheckedChange={(v) => set("hasDrum", !!v)} />
					<Label htmlFor="hasDrum">{t("fields.hasDrum")}</Label>
				</div>
				<div className="flex items-center gap-2">
					<Checkbox id="hasSupportColumns" checked={data.hasSupportColumns} onCheckedChange={(v) => set("hasSupportColumns", !!v)} />
					<Label htmlFor="hasSupportColumns">{t("fields.hasSupportColumns")}</Label>
				</div>
			</div>

			{data.hasDrum && (
				<div className="grid grid-cols-2 gap-3">
					<div>
						<Label>{t("fields.drumHeight")} (م)</Label>
						<Input type="number" min={0} step={0.5} value={data.drumHeight ?? ""} onChange={(e) => set("drumHeight", parseFloat(e.target.value) || 0)} />
					</div>
					<div>
						<Label>{t("fields.drumThickness")} (سم)</Label>
						<Input type="number" value={data.drumThickness ?? 20} onChange={(e) => set("drumThickness", parseFloat(e.target.value) || 20)} />
					</div>
				</div>
			)}

			{data.hasSupportColumns && (
				<div className="grid grid-cols-3 gap-3">
					<div>
						<Label>{t("fields.supportColumnCount")}</Label>
						<Input type="number" min={1} value={data.supportColumnCount ?? 4} onChange={(e) => set("supportColumnCount", parseInt(e.target.value) || 4)} />
					</div>
					<div>
						<Label>{t("fields.supportColumnHeight")} (م)</Label>
						<Input type="number" min={0} step={0.5} value={data.supportColumnHeight ?? ""} onChange={(e) => set("supportColumnHeight", parseFloat(e.target.value) || 0)} />
					</div>
					<div>
						<Label>{t("fields.supportColumnSize")} (سم)</Label>
						<Input type="number" value={data.supportColumnSize ?? 40} onChange={(e) => set("supportColumnSize", parseFloat(e.target.value) || 40)} />
					</div>
				</div>
			)}

			<button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-primary flex items-center gap-1 hover:underline">
				{showAdvanced ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
				{t("fields.advancedSettings")}
			</button>
			{showAdvanced && (
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<div>
						<Label>{t("fields.shellThicknessTop")} (سم)</Label>
						<Input type="number" value={data.shellThicknessTop} onChange={(e) => set("shellThicknessTop", parseFloat(e.target.value) || 10)} />
					</div>
					<div>
						<Label>{t("fields.shellThicknessBottom")} (سم)</Label>
						<Input type="number" value={data.shellThicknessBottom} onChange={(e) => set("shellThicknessBottom", parseFloat(e.target.value) || 15)} />
					</div>
					{data.hasRingBeam && (
						<>
							<div>
								<Label>{t("fields.ringBeamWidth")} (سم)</Label>
								<Input type="number" value={data.ringBeamWidth} onChange={(e) => set("ringBeamWidth", parseFloat(e.target.value) || 30)} />
							</div>
							<div>
								<Label>{t("fields.ringBeamDepth")} (سم)</Label>
								<Input type="number" value={data.ringBeamDepth} onChange={(e) => set("ringBeamDepth", parseFloat(e.target.value) || 60)} />
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
}
