"use client";

import { memo } from "react";
import {
	Building2,
	PaintBucket,
	Wrench,
	Users,
	Calculator,
	Banknote,
} from "lucide-react";
import { formatCurrency } from "../../lib/utils";

interface PricingSummaryBarProps {
	structuralCost: number;
	finishingCost: number;
	mepCost: number;
	laborCost: number;
	directCost: number;
	grandTotal: number;
}

export const PricingSummaryBar = memo(function PricingSummaryBar({
	structuralCost,
	finishingCost,
	mepCost,
	laborCost,
	directCost,
	grandTotal,
}: PricingSummaryBarProps) {
	return (
		<div className="rounded-xl border bg-card shadow-sm p-4">
			<div className="flex flex-wrap items-center gap-x-5 gap-y-3">
				<Stat
					icon={<Building2 className="h-4 w-4" />}
					label="إنشائي"
					value={formatCurrency(structuralCost)}
				/>
				<div className="w-px h-8 bg-border hidden sm:block" />
				<Stat
					icon={<PaintBucket className="h-4 w-4" />}
					label="تشطيبات"
					value={formatCurrency(finishingCost)}
				/>
				<div className="w-px h-8 bg-border hidden sm:block" />
				<Stat
					icon={<Wrench className="h-4 w-4" />}
					label="كهروميكانيكي"
					value={formatCurrency(mepCost)}
				/>
				<div className="w-px h-8 bg-border hidden sm:block" />
				<Stat
					icon={<Users className="h-4 w-4" />}
					label="عمالة"
					value={formatCurrency(laborCost)}
				/>
				<div className="w-px h-8 bg-border hidden sm:block" />
				<Stat
					icon={<Calculator className="h-4 w-4" />}
					label="التكلفة المباشرة"
					value={formatCurrency(directCost)}
					highlight
				/>
				<div className="w-px h-8 bg-border hidden sm:block" />
				<Stat
					icon={<Banknote className="h-4 w-4" />}
					label="الإجمالي النهائي"
					value={formatCurrency(grandTotal)}
					highlight
					large
				/>
			</div>
		</div>
	);
});

function Stat({
	icon,
	label,
	value,
	highlight,
	large,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	highlight?: boolean;
	large?: boolean;
}) {
	return (
		<div className="flex items-center gap-2">
			<span className={highlight ? "text-primary" : "text-muted-foreground"}>{icon}</span>
			<span className="text-xs text-muted-foreground">{label}:</span>
			<span
				className={`tabular-nums font-bold ${large ? "text-lg" : "text-sm"} ${highlight ? "text-primary" : ""}`}
				dir="ltr"
			>
				{value}
			</span>
		</div>
	);
}
