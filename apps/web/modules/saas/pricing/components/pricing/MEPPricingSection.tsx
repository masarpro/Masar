"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { Checkbox } from "@ui/components/checkbox";
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
import {
	MEP_CATEGORIES,
	MEP_CATEGORY_ORDER,
} from "../../lib/mep-categories";
import type { MEPCategoryId } from "../../types/mep";

interface MEPItemData {
	id: string;
	category: string;
	subCategory: string;
	name: string;
	quantity: number;
	unit: string;
	materialPrice: number;
	laborPrice: number;
	wastagePercent: number;
	materialCost: number;
	laborCost: number;
	totalCost: number;
	isEnabled: boolean;
	dataSource: string;
}

interface MEPPricingSectionProps {
	studyId: string;
	organizationId: string;
	items: MEPItemData[];
}

export function MEPPricingSection({
	studyId,
	organizationId,
	items,
}: MEPPricingSectionProps) {
	const grouped = useMemo(() => {
		const map = new Map<string, MEPItemData[]>();
		for (const item of items) {
			const list = map.get(item.category) || [];
			list.push(item);
			map.set(item.category, list);
		}
		return MEP_CATEGORY_ORDER
			.filter((catId) => map.has(catId))
			.map((catId) => {
				const catItems = map.get(catId)!;
				const enabledTotal = catItems
					.filter((i) => i.isEnabled)
					.reduce((s, i) => s + i.totalCost, 0);
				return {
					categoryId: catId,
					label: MEP_CATEGORIES[catId].nameAr,
					items: catItems,
					total: enabledTotal,
				};
			});
	}, [items]);

	if (items.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground text-sm">
				لا توجد بنود كهروميكانيكية
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{grouped.map((group) => (
				<MEPCategoryGroup
					key={group.categoryId}
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

function MEPCategoryGroup({
	label,
	items,
	total,
	studyId,
	organizationId,
}: {
	label: string;
	items: MEPItemData[];
	total: number;
	studyId: string;
	organizationId: string;
}) {
	const [open, setOpen] = useState(true);
	const enabledCount = items.filter((i) => i.isEnabled).length;

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-muted/50 px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
				<div className="flex items-center gap-2">
					<ChevronDown
						className={`h-4 w-4 transition-transform ${open ? "" : "-rotate-90"}`}
					/>
					<span>{label}</span>
					<span className="text-xs text-muted-foreground">
						({enabledCount}/{items.length} بند)
					</span>
				</div>
				<span className="font-bold tabular-nums" dir="ltr">
					{formatCurrency(total)}
				</span>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="mt-1.5 space-y-1">
					{/* Header */}
					<div className="grid grid-cols-[28px_1fr_65px_50px_85px_85px_50px_100px] sm:grid-cols-[28px_1fr_75px_55px_95px_95px_55px_110px] items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground font-medium">
						<span />
						<span>البند</span>
						<span>الكمية</span>
						<span>الوحدة</span>
						<span>سعر المواد</span>
						<span>سعر العمالة</span>
						<span>هدر%</span>
						<span>الإجمالي</span>
					</div>
					{items.map((item) => (
						<MEPPricingRow
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

function MEPPricingRow({
	item,
	studyId,
	organizationId,
}: {
	item: MEPItemData;
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
		orpc.pricing.studies.mepItem.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies"]],
				});
			},
		}),
	);

	const toggleMutation = useMutation(
		orpc.pricing.studies.mepItem.toggleEnabled.mutationOptions({
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
					wastagePercent: Number.isNaN(wpVal) ? 10 : wpVal,
				});
			}, 500);
		},
		[updateMutation, item.id, studyId, organizationId],
	);

	const handleToggle = (checked: boolean) => {
		(toggleMutation as any).mutate({
			id: item.id,
			costStudyId: studyId,
			organizationId,
			isEnabled: checked,
		});
	};

	const isDisabled = !item.isEnabled;

	return (
		<div
			className={`grid grid-cols-[28px_1fr_65px_50px_85px_85px_50px_100px] sm:grid-cols-[28px_1fr_75px_55px_95px_95px_55px_110px] items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
				isDisabled
					? "bg-muted/40 opacity-60"
					: "bg-card hover:bg-accent/30"
			}`}
		>
			{/* Checkbox */}
			<Checkbox
				checked={item.isEnabled}
				onCheckedChange={(checked: any) => handleToggle(checked === true)}
				className="h-4 w-4"
			/>

			{/* Name */}
			<span className="truncate text-sm">{item.name}</span>

			{/* Quantity */}
			<span className="text-left tabular-nums text-xs text-muted-foreground" dir="ltr">
				{formatNumber(item.quantity, 1)}
			</span>

			{/* Unit */}
			<span className="text-xs text-muted-foreground">{item.unit}</span>

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
				disabled={isDisabled}
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
				disabled={isDisabled}
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
				disabled={isDisabled}
			/>

			{/* Total */}
			<span className="text-left font-semibold tabular-nums text-sm" dir="ltr">
				{formatCurrency(item.isEnabled ? item.totalCost : 0)}
			</span>
		</div>
	);
}
