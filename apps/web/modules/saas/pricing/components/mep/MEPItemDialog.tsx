"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	MEP_CATEGORIES,
	MEP_CATEGORY_ORDER,
} from "../../lib/mep-categories";
import type { MEPCategoryId, MEPMergedItem } from "../../types/mep";

interface MEPItemDialogProps {
	item: MEPMergedItem | null;
	studyId: string;
	organizationId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function MEPItemDialog({
	item,
	studyId,
	organizationId,
	open,
	onOpenChange,
}: MEPItemDialogProps) {
	const queryClient = useQueryClient();

	// ─── Form state ───
	const [name, setName] = useState("");
	const [category, setCategory] = useState<MEPCategoryId>("ELECTRICAL");
	const [subCategory, setSubCategory] = useState("general");
	const [quantity, setQuantity] = useState("");
	const [unit, setUnit] = useState("");
	const [materialPrice, setMaterialPrice] = useState("");
	const [laborPrice, setLaborPrice] = useState("");
	const [wastagePercent, setWastagePercent] = useState("");
	const [qualityLevel, setQualityLevel] = useState<string>("standard");

	// Populate form when item changes
	useEffect(() => {
		if (item) {
			setName(item.name);
			setCategory(item.category as MEPCategoryId);
			setSubCategory(item.subCategory);
			setQuantity(String(item.quantity));
			setUnit(item.unit);
			setMaterialPrice(String(item.materialPrice));
			setLaborPrice(String(item.laborPrice));
			setWastagePercent(String(item.wastagePercent));
			setQualityLevel(item.qualityLevel ?? "standard");
		}
	}, [item]);

	const updateMutation = useMutation(
		orpc.pricing.studies.mepItem.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "getById"]],
				});
				toast.success("تم تحديث البند بنجاح");
				onOpenChange(false);
			},
			onError: () => {
				toast.error("حدث خطأ أثناء تحديث البند");
			},
		}),
	);

	const handleSave = useCallback(() => {
		if (!item?.id) return;

		const qty = parseFloat(quantity);
		const matPrice = parseFloat(materialPrice);
		const labPrice = parseFloat(laborPrice);
		const wastage = parseFloat(wastagePercent);

		if (Number.isNaN(qty) || qty < 0) {
			toast.error("الكمية غير صحيحة");
			return;
		}

		updateMutation.mutate({
			id: item.id,
			costStudyId: studyId,
			organizationId,
			name,
			category,
			subCategory,
			quantity: qty,
			unit,
			materialPrice: Number.isNaN(matPrice) ? 0 : matPrice,
			laborPrice: Number.isNaN(labPrice) ? 0 : labPrice,
			wastagePercent: Number.isNaN(wastage) ? 10 : wastage,
			qualityLevel,
		});
	}, [
		item,
		studyId,
		organizationId,
		name,
		category,
		subCategory,
		quantity,
		unit,
		materialPrice,
		laborPrice,
		wastagePercent,
		qualityLevel,
		updateMutation,
	]);

	const catConfig = MEP_CATEGORIES[category];
	const subCategories = catConfig?.subCategories ?? {};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg" dir="rtl">
				<DialogHeader>
					<DialogTitle>تعديل بند MEP</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{/* Name */}
					<div className="space-y-1.5">
						<Label>اسم البند</Label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="text-sm"
						/>
					</div>

					{/* Category + SubCategory */}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label>الفئة</Label>
							<Select
								value={category}
								onValueChange={(v) => {
									setCategory(v as MEPCategoryId);
									setSubCategory("general");
								}}
							>
								<SelectTrigger className="text-sm">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{MEP_CATEGORY_ORDER.map((catId) => (
										<SelectItem key={catId} value={catId}>
											{MEP_CATEGORIES[catId].nameAr}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label>الفئة الفرعية</Label>
							<Select
								value={subCategory}
								onValueChange={setSubCategory}
							>
								<SelectTrigger className="text-sm">
									<SelectValue />
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
						</div>
					</div>

					{/* Quantity + Unit */}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label>الكمية</Label>
							<Input
								type="number"
								value={quantity}
								onChange={(e) => setQuantity(e.target.value)}
								dir="ltr"
								className="text-sm"
							/>
						</div>
						<div className="space-y-1.5">
							<Label>الوحدة</Label>
							<Input
								value={unit}
								onChange={(e) => setUnit(e.target.value)}
								className="text-sm"
							/>
						</div>
					</div>

					{/* Prices */}
					<div className="grid grid-cols-3 gap-3">
						<div className="space-y-1.5">
							<Label>سعر المواد</Label>
							<Input
								type="number"
								value={materialPrice}
								onChange={(e) =>
									setMaterialPrice(e.target.value)
								}
								dir="ltr"
								className="text-sm"
							/>
						</div>
						<div className="space-y-1.5">
							<Label>سعر المصنعية</Label>
							<Input
								type="number"
								value={laborPrice}
								onChange={(e) =>
									setLaborPrice(e.target.value)
								}
								dir="ltr"
								className="text-sm"
							/>
						</div>
						<div className="space-y-1.5">
							<Label>الهدر %</Label>
							<Input
								type="number"
								value={wastagePercent}
								onChange={(e) =>
									setWastagePercent(e.target.value)
								}
								dir="ltr"
								className="text-sm"
							/>
						</div>
					</div>

					{/* Quality Level */}
					<div className="space-y-1.5">
						<Label>مستوى الجودة</Label>
						<Select
							value={qualityLevel}
							onValueChange={setQualityLevel}
						>
							<SelectTrigger className="text-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="economy">
									اقتصادي
								</SelectItem>
								<SelectItem value="standard">
									متوسط
								</SelectItem>
								<SelectItem value="premium">
									ممتاز
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Source formula (read-only if auto) */}
					{item?.dataSource === "auto" && item.sourceFormula && (
						<div className="space-y-1.5">
							<Label className="text-muted-foreground">
								المعادلة (للقراءة فقط)
							</Label>
							<p className="text-xs text-muted-foreground bg-muted rounded-md p-2">
								{item.sourceFormula}
							</p>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						إلغاء
					</Button>
					<Button
						onClick={handleSave}
						disabled={
							updateMutation.isPending || !name || !quantity
						}
					>
						{updateMutation.isPending ? "جاري الحفظ..." : "حفظ"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
