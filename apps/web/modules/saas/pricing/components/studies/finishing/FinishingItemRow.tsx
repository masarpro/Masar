"use client";

import { Button } from "@ui/components/button";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "../../../lib/utils";

interface FinishingItemRowProps {
	item: {
		id: string;
		name: string;
		subCategory?: string | null;
		area?: number | null;
		quantity?: number | null;
		length?: number | null;
		unit: string;
		qualityLevel?: string | null;
		totalCost: number;
		floorName?: string | null;
	};
	onEdit: () => void;
	onDelete: () => void;
}

export function FinishingItemRow({ item, onEdit, onDelete }: FinishingItemRowProps) {
	const t = useTranslations("pricing.studies.finishing");

	const displayQty = item.area || item.quantity || item.length || 0;
	const unitLabel = t(`units.${item.unit}` as "units.m2");

	return (
		<div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
			<div className="flex-1 min-w-0">
				<div className="font-medium truncate">{item.name}</div>
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					{displayQty > 0 && (
						<span>
							{displayQty.toFixed(1)} {unitLabel}
						</span>
					)}
					{item.qualityLevel && (
						<span>
							• {t(`quality.${item.qualityLevel}` as "quality.STANDARD")}
						</span>
					)}
				</div>
			</div>
			<div className="flex items-center gap-2 shrink-0">
				<span className="font-medium text-sm">
					{formatCurrency(item.totalCost)}
				</span>
				<Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
					<Pencil className="h-3.5 w-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 text-destructive"
					onClick={onDelete}
				>
					<Trash2 className="h-3.5 w-3.5" />
				</Button>
			</div>
		</div>
	);
}
