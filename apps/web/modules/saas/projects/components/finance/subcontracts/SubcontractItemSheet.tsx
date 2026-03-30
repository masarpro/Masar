"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Checkbox } from "@ui/components/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetFooter,
} from "@ui/components/sheet";
import { Loader2 } from "lucide-react";

interface SubcontractItemFormData {
	id?: string;
	itemCode?: string | null;
	description: string;
	descriptionEn?: string | null;
	unit: string;
	contractQty: number;
	unitPrice: number;
	category?: string | null;
	isLumpSum: boolean;
	sortOrder?: number;
}

interface SubcontractItemSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: SubcontractItemFormData) => void;
	editItem?: SubcontractItemFormData | null;
	isLoading?: boolean;
}

const UNITS = ["m3", "m2", "m", "ton", "piece", "ls", "day"] as const;
const CATEGORIES = [
	"earthworks",
	"concrete",
	"masonry",
	"finishing",
	"electrical",
	"plumbing",
	"hvac",
	"other",
] as const;

export function SubcontractItemSheet({
	open,
	onOpenChange,
	onSubmit,
	editItem,
	isLoading,
}: SubcontractItemSheetProps) {
	const t = useTranslations("subcontractItems");

	const [itemCode, setItemCode] = useState("");
	const [description, setDescription] = useState("");
	const [descriptionEn, setDescriptionEn] = useState("");
	const [unit, setUnit] = useState("m3");
	const [contractQty, setContractQty] = useState("");
	const [unitPrice, setUnitPrice] = useState("");
	const [category, setCategory] = useState("");
	const [isLumpSum, setIsLumpSum] = useState(false);

	useEffect(() => {
		if (editItem) {
			setItemCode(editItem.itemCode ?? "");
			setDescription(editItem.description);
			setDescriptionEn(editItem.descriptionEn ?? "");
			setUnit(editItem.unit);
			setContractQty(String(editItem.contractQty));
			setUnitPrice(String(editItem.unitPrice));
			setCategory(editItem.category ?? "");
			setIsLumpSum(editItem.isLumpSum);
		} else {
			resetForm();
		}
	}, [editItem, open]);

	function resetForm() {
		setItemCode("");
		setDescription("");
		setDescriptionEn("");
		setUnit("m3");
		setContractQty("");
		setUnitPrice("");
		setCategory("");
		setIsLumpSum(false);
	}

	const totalAmount = (Number(contractQty) || 0) * (Number(unitPrice) || 0);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!description.trim()) return;

		onSubmit({
			id: editItem?.id,
			itemCode: itemCode || null,
			description: description.trim(),
			descriptionEn: descriptionEn || null,
			unit,
			contractQty: isLumpSum ? 1 : Number(contractQty) || 0,
			unitPrice: Number(unitPrice) || 0,
			category: category || null,
			isLumpSum,
			sortOrder: editItem?.sortOrder,
		});
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="w-full sm:max-w-lg overflow-y-auto"
			>
				<SheetHeader>
					<SheetTitle>
						{editItem ? t("editItem") : t("addItem")}
					</SheetTitle>
				</SheetHeader>

				<form onSubmit={handleSubmit} className="space-y-4 py-4">
					{/* كود البند */}
					<div className="space-y-2">
						<Label htmlFor="itemCode">{t("itemCode")}</Label>
						<Input
							id="itemCode"
							value={itemCode}
							onChange={(e) => setItemCode(e.target.value)}
							placeholder="2-1-1"
							dir="ltr"
						/>
					</div>

					{/* الوصف بالعربية */}
					<div className="space-y-2">
						<Label htmlFor="description">
							{t("description")} <span className="text-red-500">*</span>
						</Label>
						<Input
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							required
						/>
					</div>

					{/* الوصف بالإنجليزية */}
					<div className="space-y-2">
						<Label htmlFor="descriptionEn">
							{t("descriptionEn")}
						</Label>
						<Input
							id="descriptionEn"
							value={descriptionEn}
							onChange={(e) => setDescriptionEn(e.target.value)}
							dir="ltr"
						/>
					</div>

					{/* وحدة القياس */}
					<div className="space-y-2">
						<Label>{t("unit")} <span className="text-red-500">*</span></Label>
						<Select value={unit} onValueChange={setUnit}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{UNITS.map((u) => (
									<SelectItem key={u} value={u}>
										{t(`units.${u}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* بند مقطوع */}
					<div className="flex items-center gap-2">
						<Checkbox
							id="isLumpSum"
							checked={isLumpSum}
							onCheckedChange={(checked) =>
								setIsLumpSum(checked === true)
							}
						/>
						<Label htmlFor="isLumpSum" className="cursor-pointer">
							{t("isLumpSum")}
						</Label>
					</div>

					{/* الكمية */}
					{!isLumpSum && (
						<div className="space-y-2">
							<Label htmlFor="contractQty">
								{t("contractQty")} <span className="text-red-500">*</span>
							</Label>
							<Input
								id="contractQty"
								type="number"
								step="0.001"
								min="0"
								value={contractQty}
								onChange={(e) => setContractQty(e.target.value)}
								dir="ltr"
								required={!isLumpSum}
							/>
						</div>
					)}

					{/* سعر الوحدة */}
					<div className="space-y-2">
						<Label htmlFor="unitPrice">
							{t("unitPrice")} <span className="text-red-500">*</span>
						</Label>
						<Input
							id="unitPrice"
							type="number"
							step="0.01"
							min="0"
							value={unitPrice}
							onChange={(e) => setUnitPrice(e.target.value)}
							dir="ltr"
							required
						/>
					</div>

					{/* الإجمالي المحسوب */}
					<div className="rounded-lg bg-muted/50 p-3">
						<div className="flex items-center justify-between">
							<span className="text-sm text-muted-foreground">
								{t("totalAmount")}
							</span>
							<span className="text-lg font-bold">
								{new Intl.NumberFormat("en-US", {
									style: "currency",
									currency: "SAR",
									minimumFractionDigits: 2,
								}).format(totalAmount)}
							</span>
						</div>
					</div>

					{/* التصنيف */}
					<div className="space-y-2">
						<Label>{t("category")}</Label>
						<Select value={category} onValueChange={setCategory}>
							<SelectTrigger>
								<SelectValue placeholder={t("selectCategory")} />
							</SelectTrigger>
							<SelectContent>
								{CATEGORIES.map((c) => (
									<SelectItem key={c} value={c}>
										{t(`categories.${c}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<SheetFooter className="pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							{t("cancel")}
						</Button>
						<Button type="submit" disabled={isLoading || !description.trim()}>
							{isLoading && (
								<Loader2 className="h-4 w-4 animate-spin me-2" />
							)}
							{editItem ? t("save") : t("addItem")}
						</Button>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	);
}
