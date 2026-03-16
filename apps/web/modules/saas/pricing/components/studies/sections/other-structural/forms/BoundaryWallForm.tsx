"use client";

import { useState } from "react";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/select";
import { Checkbox } from "@ui/components/checkbox";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BoundaryWallInput } from "../../../../../types/other-structural";
import type { ElementFormProps } from "./ElementFormWrapper";

export function BoundaryWallForm({ data, onChange }: ElementFormProps<BoundaryWallInput>) {
	const t = useTranslations("pricing.studies.structural.otherStructural");
	const [showAdvanced, setShowAdvanced] = useState(false);

	const set = (field: keyof BoundaryWallInput, value: any) => {
		onChange({ ...data, [field]: value });
	};

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<div>
					<Label>{t("fields.boundaryWallType")}</Label>
					<Select value={data.wallType} onValueChange={(v) => set("wallType", v)}>
						<SelectTrigger><SelectValue /></SelectTrigger>
						<SelectContent>
							<SelectItem value="BLOCK_WALL">{t("boundaryWallTypes.BLOCK_WALL")}</SelectItem>
							<SelectItem value="RC_WALL">{t("boundaryWallTypes.RC_WALL")}</SelectItem>
							<SelectItem value="PRECAST">{t("boundaryWallTypes.PRECAST")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label>{t("fields.length")} (م)</Label>
					<Input type="number" min={0} step={1} value={data.length || ""} onChange={(e) => set("length", parseFloat(e.target.value) || 0)} />
				</div>
				<div>
					<Label>{t("fields.height")} (م)</Label>
					<Input type="number" min={0} step={0.1} value={data.height || ""} onChange={(e) => set("height", parseFloat(e.target.value) || 0)} />
				</div>
				<div>
					<Label>{t("fields.quantity")}</Label>
					<Input type="number" min={1} step={1} value={data.quantity || 1} onChange={(e) => set("quantity", parseInt(e.target.value) || 1)} />
				</div>
			</div>

			<div className="flex flex-wrap gap-4">
				<div className="flex items-center gap-2">
					<Checkbox id="hasRCColumns" checked={data.hasRCColumns} onCheckedChange={(v) => set("hasRCColumns", !!v)} />
					<Label htmlFor="hasRCColumns">{t("fields.hasRCColumns")}</Label>
				</div>
				<div className="flex items-center gap-2">
					<Checkbox id="hasFoundation" checked={data.hasFoundation} onCheckedChange={(v) => set("hasFoundation", !!v)} />
					<Label htmlFor="hasFoundation">{t("fields.hasFoundation")}</Label>
				</div>
			</div>

			<button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-primary flex items-center gap-1 hover:underline">
				{showAdvanced ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
				{t("fields.advancedSettings")}
			</button>
			{showAdvanced && (
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<div>
						<Label>{t("fields.thickness")} (سم)</Label>
						<Input type="number" value={data.thickness} onChange={(e) => set("thickness", parseFloat(e.target.value) || 20)} />
					</div>
					{data.hasRCColumns && (
						<div>
							<Label>{t("fields.columnSpacing")} (م)</Label>
							<Input type="number" step={0.5} value={data.columnSpacing} onChange={(e) => set("columnSpacing", parseFloat(e.target.value) || 3.5)} />
						</div>
					)}
					{data.hasFoundation && (
						<>
							<div>
								<Label>{t("fields.foundationWidth")} (سم)</Label>
								<Input type="number" value={data.foundationWidth} onChange={(e) => set("foundationWidth", parseFloat(e.target.value) || 50)} />
							</div>
							<div>
								<Label>{t("fields.foundationDepth")} (سم)</Label>
								<Input type="number" value={data.foundationDepth} onChange={(e) => set("foundationDepth", parseFloat(e.target.value) || 50)} />
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
}
