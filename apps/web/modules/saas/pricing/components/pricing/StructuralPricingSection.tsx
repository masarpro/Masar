"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { Input } from "@ui/components/input";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/collapsible";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency, formatNumber } from "../../lib/utils";

interface StructuralItemData {
	id: string;
	category: string;
	subCategory?: string | null;
	name: string;
	quantity: number;
	unit: string;
	concreteVolume: number;
	steelWeight: number;
	materialCost: number;
	laborCost: number;
	totalCost: number;
}

interface StructuralPricingSectionProps {
	studyId: string;
	organizationId: string;
	items: StructuralItemData[];
}

const CATEGORY_NAMES: Record<string, string> = {
	plainConcrete: "خرسانة عادية",
	foundations: "الأساسات",
	columns: "الأعمدة",
	beams: "الكمرات",
	slabs: "البلاطات",
	blocks: "البلوك",
	stairs: "الدرج",
};

const CATEGORY_ORDER = [
	"plainConcrete",
	"foundations",
	"columns",
	"beams",
	"slabs",
	"blocks",
	"stairs",
];

export function StructuralPricingSection({
	studyId,
	organizationId,
	items,
}: StructuralPricingSectionProps) {
	const grouped = useMemo(() => {
		const map = new Map<string, StructuralItemData[]>();
		for (const item of items) {
			const list = map.get(item.category) || [];
			list.push(item);
			map.set(item.category, list);
		}
		return CATEGORY_ORDER
			.filter((cat) => map.has(cat))
			.map((cat) => ({
				category: cat,
				label: CATEGORY_NAMES[cat] || cat,
				items: map.get(cat)!,
				total: map.get(cat)!.reduce((s, i) => s + i.totalCost, 0),
			}));
	}, [items]);

	if (items.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground text-sm">
				لا توجد بنود إنشائية
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{grouped.map((group) => (
				<StructuralCategoryGroup
					key={group.category}
					label={group.label}
					items={group.items}
					total={group.total}
					studyId={studyId}
					organizationId={organizationId}
				/>
			))}
		</div>
	);
}

function StructuralCategoryGroup({
	label,
	items,
	total,
	studyId,
	organizationId,
}: {
	label: string;
	items: StructuralItemData[];
	total: number;
	studyId: string;
	organizationId: string;
}) {
	const [open, setOpen] = useState(true);

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-muted/50 px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
				<div className="flex items-center gap-2">
					<ChevronDown
						className={`h-4 w-4 transition-transform ${open ? "" : "-rotate-90"}`}
					/>
					<span>{label}</span>
					<span className="text-xs text-muted-foreground">
						({items.length} بند)
					</span>
				</div>
				<span className="font-bold tabular-nums" dir="ltr">
					{formatCurrency(total)}
				</span>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="mt-1.5 space-y-1">
					{/* Header */}
					<div className="grid grid-cols-[1fr_70px_70px_100px_100px_110px] sm:grid-cols-[1fr_80px_80px_100px_100px_110px] items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground font-medium">
						<span>البند</span>
						<span dir="ltr">خرسانة م³</span>
						<span dir="ltr">حديد كجم</span>
						<span>تكلفة المواد</span>
						<span>تكلفة العمالة</span>
						<span>الإجمالي</span>
					</div>
					{items.map((item) => (
						<StructuralPricingRow
							key={item.id}
							item={item}
							studyId={studyId}
							organizationId={organizationId}
						/>
					))}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

function StructuralPricingRow({
	item,
	studyId,
	organizationId,
}: {
	item: StructuralItemData;
	studyId: string;
	organizationId: string;
}) {
	const queryClient = useQueryClient();
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [matCost, setMatCost] = useState(String(item.materialCost));
	const [labCost, setLabCost] = useState(String(item.laborCost));

	useEffect(() => {
		setMatCost(String(item.materialCost));
	}, [item.materialCost]);

	useEffect(() => {
		setLabCost(String(item.laborCost));
	}, [item.laborCost]);

	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	const updateMutation = useMutation(
		orpc.pricing.studies.structuralItem.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies"]],
				});
			},
		}),
	);

	const debouncedSave = useCallback(
		(mc: string, lc: string) => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				const mcVal = parseFloat(mc);
				const lcVal = parseFloat(lc);
				const materialCost = Number.isNaN(mcVal) ? 0 : mcVal;
				const laborCost = Number.isNaN(lcVal) ? 0 : lcVal;
				(updateMutation as any).mutate({
					id: item.id,
					costStudyId: studyId,
					organizationId,
					materialCost,
					laborCost,
					totalCost: materialCost + laborCost,
				});
			}, 500);
		},
		[updateMutation, item.id, studyId, organizationId],
	);

	return (
		<div className="grid grid-cols-[1fr_70px_70px_100px_100px_110px] sm:grid-cols-[1fr_80px_80px_100px_100px_110px] items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-card text-sm hover:bg-accent/30 transition-colors">
			{/* Name */}
			<div className="min-w-0">
				<span className="truncate block text-sm">{item.name}</span>
				<span className="text-xs text-muted-foreground">
					{formatNumber(item.quantity, 0)} {item.unit}
				</span>
			</div>

			{/* Concrete Volume */}
			<span className="text-left tabular-nums text-xs text-muted-foreground" dir="ltr">
				{item.concreteVolume > 0 ? formatNumber(item.concreteVolume, 2) : "-"}
			</span>

			{/* Steel Weight */}
			<span className="text-left tabular-nums text-xs text-muted-foreground" dir="ltr">
				{item.steelWeight > 0 ? formatNumber(item.steelWeight, 0) : "-"}
			</span>

			{/* Material Cost (editable) */}
			<Input
				type="number"
				value={matCost}
				onChange={(e: any) => {
					setMatCost(e.target.value);
					debouncedSave(e.target.value, labCost);
				}}
				className="h-7 text-xs tabular-nums px-1.5"
				dir="ltr"
				min={0}
			/>

			{/* Labor Cost (editable) */}
			<Input
				type="number"
				value={labCost}
				onChange={(e: any) => {
					setLabCost(e.target.value);
					debouncedSave(matCost, e.target.value);
				}}
				className="h-7 text-xs tabular-nums px-1.5"
				dir="ltr"
				min={0}
			/>

			{/* Total */}
			<span className="text-left font-semibold tabular-nums text-sm" dir="ltr">
				{formatCurrency(item.totalCost)}
			</span>
		</div>
	);
}
