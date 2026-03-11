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
import { useTranslations } from "next-intl";

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
	const t = useTranslations("pricing.studies.mep");

	// ─── Form state ───
	const [name, setName] = useState("");
	const [category, setCategory] = useState<MEPCategoryId>("ELECTRICAL");
	const [subCategory, setSubCategory] = useState("general");
	const [quantity, setQuantity] = useState("");
	const [unit, setUnit] = useState("");
	const [qualityLevel, setQualityLevel] = useState<string>("standard");

	// Populate form when item changes
	useEffect(() => {
		if (item) {
			setName(item.name);
			setCategory(item.category as MEPCategoryId);
			setSubCategory(item.subCategory);
			setQuantity(String(item.quantity));
			setUnit(item.unit);
			setQualityLevel(item.qualityLevel ?? "standard");
		}
	}, [item]);

	const updateMutation = useMutation(
		orpc.pricing.studies.mepItem.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies"]],
				});
				toast.success(t("messages.itemUpdated"));
				onOpenChange(false);
			},
			onError: () => {
				toast.error(t("messages.updateError"));
			},
		}),
	);

	const handleSave = useCallback(() => {
		if (!item?.id) return;

		const qty = parseFloat(quantity);

		if (Number.isNaN(qty) || qty < 0) {
			toast.error(t("messages.invalidQuantity"));
			return;
		}

		(updateMutation as any).mutate({
			id: item.id,
			costStudyId: studyId,
			organizationId,
			name,
			category,
			subCategory,
			quantity: qty,
			unit,
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
		qualityLevel,
		updateMutation,
	]);

	const catConfig = MEP_CATEGORIES[category];
	const subCategories = catConfig?.subCategories ?? {};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg" dir="rtl">
				<DialogHeader>
					<DialogTitle>{t("itemDialog.editTitle")}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{/* Name */}
					<div className="space-y-1.5">
						<Label>{t("itemDialog.itemName")}</Label>
						<Input
							value={name}
							onChange={(e: any) => setName(e.target.value)}
							className="text-sm"
						/>
					</div>

					{/* Category + SubCategory */}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label>{t("itemDialog.category")}</Label>
							<Select
								value={category}
								onValueChange={(v: any) => {
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
							<Label>{t("itemDialog.subCategory")}</Label>
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
							<Label>{t("itemDialog.quantity")}</Label>
							<Input
								type="number"
								value={quantity}
								onChange={(e: any) => setQuantity(e.target.value)}
								dir="ltr"
								className="text-sm"
							/>
						</div>
						<div className="space-y-1.5">
							<Label>{t("itemDialog.unit")}</Label>
							<Input
								value={unit}
								onChange={(e: any) => setUnit(e.target.value)}
								className="text-sm"
							/>
						</div>
					</div>

					{/* Quality Level */}
					<div className="space-y-1.5">
						<Label>{t("itemDialog.qualityLevel")}</Label>
						<Select
							value={qualityLevel}
							onValueChange={setQualityLevel}
						>
							<SelectTrigger className="text-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="economy">
									{t("quality.economy")}
								</SelectItem>
								<SelectItem value="standard">
									{t("quality.standard")}
								</SelectItem>
								<SelectItem value="premium">
									{t("quality.premium")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Source formula (read-only if auto) */}
					{item?.dataSource === "auto" && item.sourceFormula && (
						<div className="space-y-1.5">
							<Label className="text-muted-foreground">
								{t("itemDialog.formulaReadOnly")}
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
						{t("itemDialog.cancel")}
					</Button>
					<Button
						onClick={handleSave}
						disabled={
							updateMutation.isPending || !name || !quantity
						}
					>
						{updateMutation.isPending ? t("itemDialog.saving") : t("itemDialog.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
