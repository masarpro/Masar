"use client";

import { useState } from "react";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/select";
import { Checkbox } from "@ui/components/checkbox";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ElevatorPitInput } from "../../../../../types/other-structural";
import type { ElementFormProps } from "./ElementFormWrapper";
import { numOrUndef } from "./numeric-input";

export function ElevatorPitForm({ data, onChange }: ElementFormProps<ElevatorPitInput>) {
	const t = useTranslations("pricing.studies.structural.otherStructural");
	const [showAdvanced, setShowAdvanced] = useState(false);

	const set = (field: keyof ElevatorPitInput, value: any) => {
		onChange({ ...data, [field]: value });
	};

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<div>
					<Label>{t("fields.elevatorType")}</Label>
					<Select value={data.elevatorType} onValueChange={(v: any) => set("elevatorType", v)}>
						<SelectTrigger><SelectValue /></SelectTrigger>
						<SelectContent>
							<SelectItem value="ELECTRIC_MRL">{t("elevatorTypes.ELECTRIC_MRL")}</SelectItem>
							<SelectItem value="ELECTRIC_WITH_ROOM">{t("elevatorTypes.ELECTRIC_WITH_ROOM")}</SelectItem>
							<SelectItem value="HYDRAULIC">{t("elevatorTypes.HYDRAULIC")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label>{t("fields.numberOfStops")}</Label>
					<Input type="number" min={1} max={100} step={1} value={data.numberOfStops ?? ""} onChange={(e: any) => set("numberOfStops", numOrUndef(e.target.value))} />
				</div>
				<div>
					<Label>{t("fields.floorHeight")} (م)</Label>
					<Input type="number" min={0.1} max={20} step={0.1} value={data.floorHeight ?? ""} onChange={(e: any) => set("floorHeight", numOrUndef(e.target.value))} />
				</div>
				<div>
					<Label>{t("fields.quantity")}</Label>
					<Input type="number" min={1} step={1} value={data.quantity || 1} onChange={(e: any) => set("quantity", parseInt(e.target.value) || 1)} />
				</div>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<div>
					<Label>{t("fields.pitWidth")} (م)</Label>
					<Input type="number" min={0.1} max={20} step={0.1} value={data.pitWidth ?? ""} onChange={(e: any) => set("pitWidth", numOrUndef(e.target.value))} />
				</div>
				<div>
					<Label>{t("fields.pitLength")} (م)</Label>
					<Input type="number" min={0.1} max={20} step={0.1} value={data.pitLength ?? ""} onChange={(e: any) => set("pitLength", numOrUndef(e.target.value))} />
				</div>
				<div>
					<Label>{t("fields.pitHoleDepth")} (م)</Label>
					<Input type="number" min={0.1} max={10} step={0.1} value={data.pitHoleDepth ?? ""} onChange={(e: any) => set("pitHoleDepth", numOrUndef(e.target.value))} />
				</div>
			</div>

			<div className="flex items-center gap-2">
				<Checkbox id="hasMachineRoom" checked={data.hasMachineRoom} onCheckedChange={(v: any) => set("hasMachineRoom", !!v)} />
				<Label htmlFor="hasMachineRoom">{t("fields.hasMachineRoom")}</Label>
			</div>

			{data.hasMachineRoom && (
				<div className="grid grid-cols-2 gap-3">
					<div>
						<Label>{t("fields.machineRoomHeight")} (م)</Label>
						<Input type="number" min={0.1} max={10} step={0.1} value={data.machineRoomHeight ?? ""} onChange={(e: any) => set("machineRoomHeight", numOrUndef(e.target.value))} />
					</div>
				</div>
			)}

			<button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-primary flex items-center gap-1 hover:underline">
				{showAdvanced ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
				{t("fields.advancedSettings")}
			</button>
			{showAdvanced && (
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
					<div>
						<Label>{t("fields.wallThickness")} (سم)</Label>
						<Input type="number" min={5} max={200} step={5} value={data.wallThickness ?? ""} onChange={(e: any) => set("wallThickness", numOrUndef(e.target.value))} />
					</div>
					<div>
						<Label>{t("fields.pitSlabThickness")} (سم)</Label>
						<Input type="number" min={5} max={200} step={5} value={data.pitSlabThickness ?? ""} onChange={(e: any) => set("pitSlabThickness", numOrUndef(e.target.value))} />
					</div>
					<div>
						<Label>{t("fields.overTravel")} (م)</Label>
						<Input type="number" min={0} max={20} step={0.1} value={data.overTravel ?? ""} onChange={(e: any) => set("overTravel", numOrUndef(e.target.value))} />
					</div>
				</div>
			)}
		</div>
	);
}
