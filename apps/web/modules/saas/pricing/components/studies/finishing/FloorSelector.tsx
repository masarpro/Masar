"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { useTranslations } from "next-intl";
import type { FloorConfig } from "../../../lib/finishing-types";

interface FloorSelectorProps {
	floors: FloorConfig[];
	value: string;
	onChange: (floorId: string, floorName: string) => void;
	showAllFloors?: boolean;
}

export function FloorSelector({
	floors,
	value,
	onChange,
	showAllFloors = true,
}: FloorSelectorProps) {
	const t = useTranslations("pricing.studies.finishing");

	return (
		<Select
			value={value}
			onValueChange={(v) => {
				if (v === "__all__") {
					onChange("__all__", t("allFloors"));
				} else {
					const floor = floors.find((f) => f.id === v);
					onChange(v, floor?.name ?? "");
				}
			}}
		>
			<SelectTrigger>
				<SelectValue placeholder={t("selectFloor")} />
			</SelectTrigger>
			<SelectContent>
				{floors.map((floor) => (
					<SelectItem key={floor.id} value={floor.id}>
						{floor.name}
						{floor.isRepeated && floor.repeatCount > 1
							? ` (×${floor.repeatCount})`
							: ""}
					</SelectItem>
				))}
				{showAllFloors && floors.length > 0 && (
					<>
						<SelectSeparator />
						<SelectItem value="__all__">{t("allFloors")}</SelectItem>
					</>
				)}
			</SelectContent>
		</Select>
	);
}
