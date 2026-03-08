"use client";

import { memo } from "react";
import {
	Zap,
	Droplets,
	Wind,
	Flame,
	Wifi,
	Settings,
	ToggleRight,
} from "lucide-react";
import { formatCurrency, formatNumber } from "../../lib/utils";
import type { MEPMergedItem } from "../../types/mep";

interface MEPSummaryBarProps {
	items: MEPMergedItem[];
}

export const MEPSummaryBar = memo(function MEPSummaryBar({
	items,
}: MEPSummaryBarProps) {
	const totalItems = items.length;
	const enabledItems = items.filter((i) => i.isEnabled);
	const disabledItems = totalItems - enabledItems.length;
	const totalCost = enabledItems.reduce((s, i) => s + i.totalCost, 0);
	const autoItems = items.filter((i) => i.dataSource === "auto").length;
	const manualItems = items.filter((i) => i.dataSource === "manual").length;

	return (
		<div className="rounded-xl border bg-card shadow-sm p-4 flex flex-wrap items-center gap-x-6 gap-y-3">
			<Stat
				icon={<Zap className="h-4 w-4" />}
				label="إجمالي تكلفة MEP"
				value={formatCurrency(totalCost)}
			/>
			<div className="w-px h-8 bg-border hidden sm:block" />
			<Stat
				icon={<Settings className="h-4 w-4" />}
				label="عدد البنود"
				value={`${formatNumber(totalItems, 0)}`}
			/>
			<div className="w-px h-8 bg-border hidden sm:block" />
			<Stat
				icon={<ToggleRight className="h-4 w-4" />}
				label="مفعل / معطل"
				value={`${enabledItems.length} / ${disabledItems}`}
			/>
			{autoItems > 0 && (
				<>
					<div className="w-px h-8 bg-border hidden sm:block" />
					<Stat
						icon={<Wind className="h-4 w-4" />}
						label="تلقائي"
						value={`${autoItems}`}
					/>
				</>
			)}
			{manualItems > 0 && (
				<>
					<div className="w-px h-8 bg-border hidden sm:block" />
					<Stat
						icon={<Droplets className="h-4 w-4" />}
						label="يدوي"
						value={`${manualItems}`}
					/>
				</>
			)}
		</div>
	);
});

function Stat({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
}) {
	return (
		<div className="flex items-center gap-2">
			<span className="text-muted-foreground">{icon}</span>
			<span className="text-sm text-muted-foreground">{label}:</span>
			<span className="text-lg font-bold tabular-nums" dir="ltr">
				{value}
			</span>
		</div>
	);
}
