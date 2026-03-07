"use client";

import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { Lightbulb, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DerivedQuantity } from "../../lib/smart-building-types";
import { formatNumber, getUnitLabel } from "../../lib/utils";

interface KnowledgeNotificationProps {
	notification: string;
	derivedItems: DerivedQuantity[];
	onAccept: () => void;
	onDismiss: () => void;
}

export function KnowledgeNotification({
	notification,
	derivedItems,
	onAccept,
	onDismiss,
}: KnowledgeNotificationProps) {
	const t = useTranslations("pricing.studies.finishing.knowledge");

	return (
		<Card className="border-primary/30 bg-primary/5 p-4 space-y-3 animate-in slide-in-from-top-2 fade-in duration-300">
			{/* Header */}
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-center gap-2 text-sm font-semibold">
					<Lightbulb className="h-4 w-4 text-primary shrink-0" />
					<span>{t("title")}</span>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 shrink-0"
					onClick={onDismiss}
				>
					<X className="h-3.5 w-3.5" />
				</Button>
			</div>

			{/* Description */}
			<p className="text-sm text-muted-foreground leading-relaxed">
				{notification}
			</p>

			{/* Items list */}
			{derivedItems.length > 0 && (
				<ul className="space-y-1 text-sm">
					{derivedItems.slice(0, 6).map((item) => (
						<li
							key={item.categoryKey}
							className="flex items-center gap-2 text-muted-foreground"
						>
							<span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
							<span>
								{getItemLabel(item.categoryKey, item.floorName)}
							</span>
							<span className="font-medium text-foreground ms-auto tabular-nums">
								{formatNumber(item.quantity, 1)}{" "}
								{getUnitLabel(item.unit)}
							</span>
						</li>
					))}
					{derivedItems.length > 6 && (
						<li className="text-xs text-muted-foreground">
							{t("andMore", {
								count: derivedItems.length - 6,
							})}
						</li>
					)}
				</ul>
			)}

			{/* Actions */}
			<div className="flex items-center gap-2 pt-1">
				<Button size="sm" className="text-xs" onClick={onAccept}>
					<Sparkles className="h-3 w-3 me-1" />
					{t("accept")}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="text-xs text-muted-foreground"
					onClick={onDismiss}
				>
					{t("dismiss")}
				</Button>
			</div>
		</Card>
	);
}

function getItemLabel(
	categoryKey: string,
	floorName?: string,
): string {
	const names: Record<string, string> = {
		waterproofing_foundations: "عزل مائي أساسات",
		waterproofing_roof: "عزل مائي سطح",
		thermal_walls: "عزل حراري جدران",
		thermal_roof: "عزل حراري سطح",
		external_plaster: "لياسة خارجية",
		facade_paint: "دهان واجهات",
		boundary_paint: "دهان سور",
		interior_doors: "أبواب داخلية",
		exterior_doors: "أبواب خارجية",
		windows: "نوافذ",
		bathroom_fixtures: "تجهيز حمامات",
		vanities: "مغاسل ورخاميات",
		kitchen_cabinets: "خزائن مطبخ",
		stone_facade: "واجهات حجرية",
		yard_paving: "أرضيات حوش",
		roof_finishing: "تشطيبات سطح",
	};

	let name: string;
	if (categoryKey.startsWith("internal_plaster_")) name = "لياسة داخلية";
	else if (categoryKey.startsWith("interior_paint_")) name = "دهان داخلي";
	else if (categoryKey.startsWith("flooring_")) name = "أرضيات";
	else if (categoryKey.startsWith("wall_tiles_bathroom_"))
		name = "بلاط جدران حمامات";
	else if (categoryKey.startsWith("wall_tiles_kitchen_"))
		name = "سبلاش باك مطبخ";
	else if (categoryKey.startsWith("false_ceiling_"))
		name = "أسقف مستعارة";
	else if (categoryKey.startsWith("waterproofing_bathrooms_"))
		name = "عزل حمامات";
	else name = names[categoryKey] ?? categoryKey;

	if (floorName) {
		return `${name} — ${floorName}`;
	}
	return name;
}

