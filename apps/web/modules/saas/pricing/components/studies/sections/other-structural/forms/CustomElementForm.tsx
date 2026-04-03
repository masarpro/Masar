"use client";

import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { useTranslations } from "next-intl";
import type { CustomElementInput } from "../../../../../types/other-structural";
import type { ElementFormProps } from "./ElementFormWrapper";

export function CustomElementForm({ data, onChange }: ElementFormProps<CustomElementInput>) {
	const t = useTranslations("pricing.studies.structural.otherStructural");

	const set = (field: keyof CustomElementInput, value: any) => {
		onChange({ ...data, [field]: value });
	};

	return (
		<div className="space-y-4">
			<div>
				<Label>{t("fields.description")}</Label>
				<Textarea value={data.description ?? ""} onChange={(e: any) => set("description", e.target.value)} rows={2} />
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<div>
					<Label>{t("results.concreteRC")} (م³)</Label>
					<Input type="number" min={0} step={0.1} value={data.concreteVolumeRC || ""} onChange={(e: any) => set("concreteVolumeRC", parseFloat(e.target.value) || 0)} />
				</div>
				<div>
					<Label>{t("results.concretePlain")} (م³)</Label>
					<Input type="number" min={0} step={0.1} value={data.concreteVolumePlain || ""} onChange={(e: any) => set("concreteVolumePlain", parseFloat(e.target.value) || 0)} />
				</div>
				<div>
					<Label>{t("results.steel")} (كجم)</Label>
					<Input type="number" min={0} step={1} value={data.steelWeight || ""} onChange={(e: any) => set("steelWeight", parseFloat(e.target.value) || 0)} />
				</div>
				<div>
					<Label>{t("results.formwork")} (م²)</Label>
					<Input type="number" min={0} step={0.1} value={data.formworkArea || ""} onChange={(e: any) => set("formworkArea", parseFloat(e.target.value) || 0)} />
				</div>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<div>
					<Label>{t("results.waterproofing")} (م²)</Label>
					<Input type="number" min={0} step={0.1} value={data.waterproofingArea || ""} onChange={(e: any) => set("waterproofingArea", parseFloat(e.target.value) || 0)} />
				</div>
				<div>
					<Label>{t("results.excavation")} (م³)</Label>
					<Input type="number" min={0} step={0.1} value={data.excavationVolume || ""} onChange={(e: any) => set("excavationVolume", parseFloat(e.target.value) || 0)} />
				</div>
				<div>
					<Label>{t("results.blocks")}</Label>
					<Input type="number" min={0} step={1} value={data.blockCount || ""} onChange={(e: any) => set("blockCount", parseInt(e.target.value) || 0)} />
				</div>
				<div>
					<Label>{t("fields.quantity")}</Label>
					<Input type="number" min={1} step={1} value={data.quantity || 1} onChange={(e: any) => set("quantity", parseInt(e.target.value) || 1)} />
				</div>
			</div>
		</div>
	);
}
