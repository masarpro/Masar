"use client";

import { Card } from "@ui/components/card";
import { cn } from "@ui/lib";
import { useTranslations } from "next-intl";
import { ELEMENT_CATALOG } from "../../../../constants/other-structural";
import type { OtherStructuralElementType } from "../../../../types/other-structural";

const COLOR_MAP: Record<string, string> = {
	amber: "border-chart-1 bg-chart-1/15 hover:bg-chart-1/15 dark:bg-chart-1/20 dark:hover:bg-chart-1/20",
	blue: "border-chart-4 bg-chart-4/15 hover:bg-chart-4/15 dark:bg-chart-4/20 dark:hover:bg-chart-4/20",
	sky: "border-chart-4 bg-chart-4/15 hover:bg-chart-4/15 dark:bg-chart-4/20 dark:hover:bg-chart-4/20",
	slate: "border-border bg-muted hover:bg-muted dark:bg-muted/50 dark:hover:bg-muted/70",
	orange: "border-chart-1 bg-chart-1/15 hover:bg-chart-1/15 dark:bg-chart-1/20 dark:hover:bg-chart-1/20",
	stone: "border-border bg-muted hover:bg-muted dark:bg-muted/50 dark:hover:bg-muted/70",
	zinc: "border-border bg-muted hover:bg-muted dark:bg-muted/50 dark:hover:bg-muted/70",
	emerald: "border-success bg-success/15 hover:bg-success/15 dark:bg-success/20 dark:hover:bg-success/20",
	teal: "border-chart-3 bg-chart-3/15 hover:bg-chart-3/15 dark:bg-chart-3/20 dark:hover:bg-chart-3/20",
	purple: "border-chart-4 bg-chart-4/15 hover:bg-chart-4/15 dark:bg-chart-4/20 dark:hover:bg-chart-4/20",
	gray: "border-border bg-muted hover:bg-muted dark:bg-muted/50 dark:hover:bg-muted/70",
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
