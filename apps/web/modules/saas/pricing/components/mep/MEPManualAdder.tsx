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
import { useState } from "react";
import {
	MEP_CATEGORIES,
	MEP_CATEGORY_ORDER,
} from "../../lib/mep-categories";
import type { MEPCategoryId } from "../../types/mep";
import { useTranslations } from "next-intl";

interface MEPManualAdderProps {
	onAdd: (item: {
		category: string;
		subCategory: string;
		name: string;
		quantity: number;
		unit: string;
		materialPrice: number;
		laborPrice: number;
	}) => void;
}

export function MEPManualAdder({ onAdd }: MEPManualAdderProps) {
	const [open, setOpen] = useState(false);
	const [category, setCategory] = useState<MEPCategoryId | "">("");
	const [subCategory, setSubCategory] = useState("");
	const [name, setName] = useState("");
	const [quantity, setQuantity] = useState("");
	const t = useTranslations("pricing.studies.mep");

	const catConfig = category ? MEP_CATEGORIES[category] : null;
	const subCategories = catConfig?.subCategories ?? {};
	const selectedSub = subCategory ? subCategories[subCategory] : null;

	const handleAdd = () => {
		if (!category || !subCategory || !name) return;
		const qty = parseFloat(quantity);
		if (Number.isNaN(qty) || qty <= 0) return;

		onAdd({
			category,
			subCategory,
			name,
			quantity: qty,
			unit: selectedSub?.defaultUnit ?? "عدد",
			materialPrice: 0,
			laborPrice: 0,
		});

		// Reset
		setCategory("");
		setSubCategory("");
		setName("");
		setQuantity("");
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="h-9 text-sm rounded-lg"
				>
					<Plus className="h-4 w-4 me-1.5" />
					{t("manualAdder.addButton")}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80 space-y-3 p-4" align="end">
				<h4 className="text-sm font-semibold">{t("manualAdder.title")}</h4>

				{/* Category select */}
				<Select
					value={category}
					onValueChange={(v) => {
						setCategory(v as MEPCategoryId);
						setSubCategory("");
						setName("");
					}}
				>
					<SelectTrigger className="text-sm h-9 rounded-lg">
						<SelectValue placeholder={t("manualAdder.selectCategory")} />
					</SelectTrigger>
					<SelectContent>
						{MEP_CATEGORY_ORDER.map((catId) => (
							<SelectItem key={catId} value={catId}>
								{MEP_CATEGORIES[catId].nameAr}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* SubCategory select */}
				{category && (
					<Select
						value={subCategory}
						onValueChange={(v) => {
							setSubCategory(v);
							const sub = subCategories[v];
							if (sub) setName(sub.nameAr);
						}}
					>
						<SelectTrigger className="text-sm h-9 rounded-lg">
							<SelectValue placeholder={t("manualAdder.selectSubCategory")} />
						</SelectTrigger>
						<SelectContent>
							{Object.entries(subCategories).map(
								([key, sub]) => (
									<SelectItem key={key} value={key}>
										{sub.nameAr}
									</SelectItem>
								),
							)}
						</SelectContent>
					</Select>
				)}

				{/* Name */}
				{subCategory && (
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder={t("manualAdder.itemName")}
						className="text-sm h-9 rounded-lg"
					/>
				)}

				{/* Quantity */}
				{subCategory && (
					<div className="flex items-center gap-2">
						<Input
							type="number"
							value={quantity}
							onChange={(e) => setQuantity(e.target.value)}
							placeholder={t("manualAdder.quantity")}
							className="text-sm flex-1 h-9 rounded-lg"
							dir="ltr"
						/>
						<span className="text-sm text-muted-foreground whitespace-nowrap">
							{selectedSub?.defaultUnit ?? "عدد"}
						</span>
					</div>
				)}

				<Button
					size="sm"
					className="w-full text-sm h-9 rounded-lg"
					onClick={handleAdd}
					disabled={!category || !subCategory || !name || !quantity}
				>
					{t("manualAdder.add")}
				</Button>
			</PopoverContent>
		</Popover>
	);
}
