"use client";

import { Card } from "@ui/components/card";
import { cn } from "@ui/lib";
import { useTranslations } from "next-intl";
import { ELEMENT_CATALOG } from "../../../../constants/other-structural";
import type { OtherStructuralElementType } from "../../../../types/other-structural";

const COLOR_MAP: Record<string, string> = {
	amber: "border-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50",
	blue: "border-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50",
	sky: "border-sky-300 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/30 dark:hover:bg-sky-950/50",
	slate: "border-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/30 dark:hover:bg-slate-800/50",
	orange: "border-orange-300 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 dark:hover:bg-orange-950/50",
	stone: "border-stone-300 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800/30 dark:hover:bg-stone-800/50",
	zinc: "border-zinc-300 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/50",
	emerald: "border-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50",
	teal: "border-teal-300 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950/50",
	purple: "border-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-950/50",
	gray: "border-gray-300 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/30 dark:hover:bg-gray-800/50",
};

interface ElementTypePickerProps {
	onSelect: (type: OtherStructuralElementType) => void;
}

export function ElementTypePicker({ onSelect }: ElementTypePickerProps) {
	const t = useTranslations("pricing.studies.structural.otherStructural");

	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
			{ELEMENT_CATALOG.map((item) => (
				<Card
					key={item.type}
					className={cn(
						"cursor-pointer border-2 p-4 transition-all duration-150 text-center",
						COLOR_MAP[item.color] ?? COLOR_MAP.gray,
					)}
					onClick={() => onSelect(item.type)}
				>
					<div className="text-3xl mb-2">{item.icon}</div>
					<div className="text-sm font-medium leading-tight">
						{t(`elementTypes.${item.type}`, { defaultValue: item.name_ar })}
					</div>
				</Card>
			))}
		</div>
	);
}
