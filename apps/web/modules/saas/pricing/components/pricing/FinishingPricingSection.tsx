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
import { formatCurrency, formatNumber, getUnitLabel } from "../../lib/utils";
import {
	FINISHING_CATEGORIES,
	FINISHING_GROUPS,
} from "../../lib/finishing-categories";

interface FinishingItemData {
	id: string;
	category: string;
	subCategory?: string | null;
	name: string;
	floorName?: string | null;
	area: number;
	quantity: number;
	length: number;
	unit: string;
	materialPrice: number;
	laborPrice: number;
	wastagePercent: number;
	materialCost: number;
	laborCost: number;
	totalCost: number;
}

interface FinishingPricingSectionProps {
	studyId: string;
	organizationId: string;
	items: FinishingItemData[];
}

export function FinishingPricingSection({
	studyId,
	organizationId,
	items,
}: FinishingPricingSectionProps) {
	const grouped = useMemo(() => {
		// Map category ID to group ID
		const catToGroup = new Map<string, string>();
		const catToName = new Map<string, string>();
		for (const cat of FINISHING_CATEGORIES) {
			catToGroup.set(cat.id, cat.groupId);
			catToName.set(cat.id, cat.nameAr);
		}

		// Group items by work group
		const groupMap = new Map<
			string,
			{ items: FinishingItemData[]; total: number }
		>();

		for (const item of items) {
			const groupId = catToGroup.get(item.category) || "OTHER";
			const existing = groupMap.get(groupId) || {
				items: [],
				total: 0,
			};
			existing.items.push(item);
			existing.total += item.totalCost;
			groupMap.set(groupId, existing);
		}

		// Sort by group sortOrder
		const sortedGroups = Object.values(FINISHING_GROUPS).sort(
			(a, b) => a.sortOrder - b.sortOrder,
		);

		return sortedGroups
			.filter((g) => groupMap.has(g.id))
			.map((g) => ({
				groupId: g.id,
				label: g.nameAr,
				items: groupMap.get(g.id)!.items,
				total: groupMap.get(g.id)!.total,
			}));
	}, [items]);

	if (items.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground text-sm">
				لا توجد بنود تشطيبات
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{grouped.map((group) => (
				<FinishingGroupSection
					key={group.groupId}
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

function FinishingGroupSection({
	label,
	items,
	total,
	studyId,
	organizationId,
}: {
	label: string;
	items: FinishingItemData[];
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
					<div className="grid grid-cols-[1fr_70px_50px_85px_85px_50px_100px] sm:grid-cols-[1fr_80px_55px_95px_95px_55px_110px] items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground font-medium">
						<span>البند</span>
						<span>الكمية</span>
						<span>الوحدة</span>
						<span>سعر المواد</span>
						<span>سعر العمالة</span>
						<span>هدر%</span>
						<span>الإجمالي</span>
					</div>
					{items.map((item) => (
						<FinishingPricingRow
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

function FinishingPricingRow({
	item,
	studyId,
	organizationId,
}: {
	item: FinishingItemData;
	studyId: string;
	organizationId: string;
}) {
	const queryClient = useQueryClient();
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [matPrice, setMatPrice] = useState(String(item.materialPrice));
	const [labPrice, setLabPrice] = useState(String(item.laborPrice));
	const [wastage, setWastage] = useState(String(item.wastagePercent));

	useEffect(() => {
		setMatPrice(String(item.materialPrice));
	}, [item.materialPrice]);
	useEffect(() => {
		setLabPrice(String(item.laborPrice));
	}, [item.laborPrice]);
	useEffect(() => {
		setWastage(String(item.wastagePercent));
	}, [item.wastagePercent]);

	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	const updateMutation = useMutation(
		orpc.pricing.studies.finishingItem.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies"]],
				});
			},
		}),
	);

	const debouncedSave = useCallback(
		(mp: string, lp: string, wp: string) => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				const mpVal = parseFloat(mp);
				const lpVal = parseFloat(lp);
				const wpVal = parseFloat(wp);
				(updateMutation as any).mutate({
					id: item.id,
					costStudyId: studyId,
					organizationId,
					materialPrice: Number.isNaN(mpVal) ? 0 : mpVal,
					laborPrice: Number.isNaN(lpVal) ? 0 : lpVal,
					wastagePercent: Number.isNaN(wpVal) ? 0 : wpVal,
				});
			}, 500);
		},
		[updateMutation, item.id, studyId, organizationId],
	);

	const displayQty = item.area || item.quantity || item.length || 0;

	return (
		<div className="grid grid-cols-[1fr_70px_50px_85px_85px_50px_100px] sm:grid-cols-[1fr_80px_55px_95px_95px_55px_110px] items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-card text-sm hover:bg-accent/30 transition-colors">
			{/* Name + floor */}
			<div className="min-w-0">
				<span className="truncate block text-sm">{item.name}</span>
				{item.floorName && (
					<span className="text-xs text-muted-foreground truncate block">
						{item.floorName}
					</span>
				)}
			</div>

			{/* Quantity */}
			<span className="text-left tabular-nums text-xs text-muted-foreground" dir="ltr">
				{formatNumber(displayQty, 1)}
			</span>

			{/* Unit */}
			<span className="text-xs text-muted-foreground">
				{getUnitLabel(item.unit)}
			</span>

			{/* Material Price */}
			<Input
				type="number"
				value={matPrice}
				onChange={(e: any) => {
					setMatPrice(e.target.value);
					debouncedSave(e.target.value, labPrice, wastage);
				}}
				className="h-7 text-xs tabular-nums px-1.5"
				dir="ltr"
				min={0}
			/>

			{/* Labor Price */}
			<Input
				type="number"
				value={labPrice}
				onChange={(e: any) => {
					setLabPrice(e.target.value);
					debouncedSave(matPrice, e.target.value, wastage);
				}}
				className="h-7 text-xs tabular-nums px-1.5"
				dir="ltr"
				min={0}
			/>

			{/* Wastage */}
			<Input
				type="number"
				value={wastage}
				onChange={(e: any) => {
					setWastage(e.target.value);
					debouncedSave(matPrice, labPrice, e.target.value);
				}}
				className="h-7 text-xs tabular-nums px-1.5"
				dir="ltr"
				min={0}
				max={100}
			/>

			{/* Total */}
			<span className="text-left font-semibold tabular-nums text-sm" dir="ltr">
				{formatCurrency(item.totalCost)}
			</span>
		</div>
	);
}
