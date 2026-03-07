"use client";

import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/popover";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
	FINISHING_CATEGORIES,
	type FinishingCategoryConfig,
} from "../../lib/finishing-categories";
import type { SmartFloorConfig } from "../../lib/smart-building-types";

interface ManualItemAdderProps {
	floors: SmartFloorConfig[];
	onAdd: (item: {
		category: string;
		name: string;
		floorId?: string;
		floorName?: string;
		unit: string;
		quantity: number;
		scope: string;
	}) => void;
}

export function ManualItemAdder({ floors, onAdd }: ManualItemAdderProps) {
	const t = useTranslations("pricing.studies.finishing.dashboard");
	const [open, setOpen] = useState(false);
	const [selectedCategory, setSelectedCategory] =
		useState<FinishingCategoryConfig | null>(null);
	const [selectedFloorId, setSelectedFloorId] = useState<string>("");
	const [quantity, setQuantity] = useState("");

	const habitableFloors = floors.filter((f) => f.floorType !== "ROOF");
	const isPerFloor = selectedCategory?.scope === "PER_FLOOR";

	const handleAdd = () => {
		if (!selectedCategory) return;
		const qty = parseFloat(quantity);
		if (Number.isNaN(qty) || qty <= 0) return;

		const floor = isPerFloor
			? floors.find((f) => f.id === selectedFloorId)
			: undefined;

		onAdd({
			category: selectedCategory.id,
			name: selectedCategory.nameAr,
			floorId: floor?.id,
			floorName: floor?.name,
			unit: selectedCategory.unit,
			quantity: qty,
			scope: selectedCategory.scope === "PER_FLOOR"
				? "per_floor"
				: selectedCategory.scope === "EXTERNAL"
					? "external"
					: "whole_building",
		});

		// Reset
		setSelectedCategory(null);
		setSelectedFloorId("");
		setQuantity("");
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm" className="text-xs">
					<Plus className="h-3.5 w-3.5 me-1" />
					{t("addManualItem")}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-80 space-y-3"
				align="end"
			>
				<h4 className="text-sm font-semibold">{t("addManualItem")}</h4>

				{/* Category select */}
				<Select
					value={selectedCategory?.id ?? ""}
					onValueChange={(v: string) => {
						const cat = FINISHING_CATEGORIES.find(
							(c) => c.id === v,
						);
						setSelectedCategory(cat ?? null);
					}}
				>
					<SelectTrigger className="text-xs">
						<SelectValue placeholder={t("selectCategory")} />
					</SelectTrigger>
					<SelectContent>
						{FINISHING_CATEGORIES.map((cat) => (
							<SelectItem
								key={cat.id}
								value={cat.id}
								className="text-xs"
							>
								{cat.nameAr}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Floor select (if per_floor) */}
				{isPerFloor && habitableFloors.length > 0 && (
					<Select
						value={selectedFloorId}
						onValueChange={setSelectedFloorId}
					>
						<SelectTrigger className="text-xs">
							<SelectValue placeholder={t("selectFloor")} />
						</SelectTrigger>
						<SelectContent>
							{habitableFloors.map((f) => (
								<SelectItem
									key={f.id}
									value={f.id}
									className="text-xs"
								>
									{f.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}

				{/* Quantity input */}
				{selectedCategory && (
					<div className="flex items-center gap-2">
						<Input
							type="number"
							value={quantity}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)}
							placeholder={t("quantity")}
							className="text-sm flex-1"
							onKeyDown={(e: React.KeyboardEvent) => {
								if (e.key === "Enter") handleAdd();
							}}
						/>
						<span className="text-xs text-muted-foreground whitespace-nowrap">
							{getUnitLabel(selectedCategory.unit)}
						</span>
					</div>
				)}

				<Button
					size="sm"
					className="w-full text-xs"
					onClick={handleAdd}
					disabled={
						!selectedCategory ||
						!quantity ||
						(isPerFloor && !selectedFloorId)
					}
				>
					{t("add")}
				</Button>
			</PopoverContent>
		</Popover>
	);
}

function getUnitLabel(unit: string): string {
	const labels: Record<string, string> = {
		m2: "م²",
		m: "م.ط",
		unit: "عدد",
		set: "طقم",
		lump_sum: "مقطوعية",
	};
	return labels[unit] ?? unit;
}
