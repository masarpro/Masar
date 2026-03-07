"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Calculator, Link2, Unlink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { FinishingCategoryConfig } from "../../../lib/finishing-categories";
import { calculateFinishingItemCost } from "../../../lib/finishing-categories";
import {
	getDerivationOptions,
	computeDerivedQuantity,
	getQuantityFromCategory,
	type LinkedSource,
	type DerivationOption,
} from "../../../lib/finishing-links";
import type { BuildingConfig, CalculatorResult } from "../../../lib/finishing-types";
import { formatCurrency } from "../../../lib/utils";
import {
	DirectAreaCalculator,
	LinearCalculator,
	LumpSumCalculator,
	PerUnitCalculator,
	RoomByRoomCalculator,
	WallDeductionCalculator,
} from "./calculators";
import { FloorSelector } from "./FloorSelector";

interface FinishingItemData {
	id?: string;
	category: string;
	subCategory?: string;
	name: string;
	description?: string;
	floorId?: string;
	floorName?: string;
	area?: number;
	length?: number;
	height?: number;
	width?: number;
	perimeter?: number;
	quantity?: number;
	unit: string;
	calculationMethod?: string;
	calculationData?: Record<string, unknown>;
	qualityLevel?: string;
	brand?: string;
	specifications?: string;
	wastagePercent: number;
	materialPrice: number;
	laborPrice: number;
	totalCost: number;
}

interface AllItemForLinking {
	id: string;
	category: string;
	floorId?: string | null;
	area?: number | null;
	quantity?: number | null;
	length?: number | null;
}

interface AddEditFinishingItemDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	studyId: string;
	category: FinishingCategoryConfig;
	buildingConfig?: BuildingConfig | null;
	editItem?: FinishingItemData;
	allItems?: AllItemForLinking[];
}

export function AddEditFinishingItemDialog({
	open,
	onOpenChange,
	organizationId,
	studyId,
	category,
	buildingConfig,
	editItem,
	allItems,
}: AddEditFinishingItemDialogProps) {
	const t = useTranslations("pricing.studies.finishing");
	const queryClient = useQueryClient();
	const isEdit = !!editItem?.id;

	const [form, setForm] = useState<FinishingItemData>({
		category: category.id,
		name: "",
		unit: category.unit,
		wastagePercent: category.defaultWastage,
		materialPrice: 0,
		laborPrice: 0,
		totalCost: 0,
	});

	const [calculatorOpen, setCalculatorOpen] = useState(false);

	// Linking
	const derivationOptions = getDerivationOptions(category.id);
	const hasLinking = derivationOptions.length > 0 && buildingConfig;
	const currentLink = form.calculationData?.linkedSource as LinkedSource | undefined;

	const handleApplyLink = (option: DerivationOption) => {
		let qty: number | null = null;

		if (option.sourceType === "building_config" && buildingConfig) {
			qty = computeDerivedQuantity(
				option.derivation,
				buildingConfig,
				form.floorId,
			);
		} else if (
			option.sourceType === "category" &&
			option.sourceCategoryId &&
			allItems
		) {
			qty = getQuantityFromCategory(
				option.sourceCategoryId,
				allItems,
				form.floorId ?? undefined,
			);
		}

		if (qty == null || qty <= 0) return;

		const linkedSource: LinkedSource = {
			type: option.sourceType,
			derivation: option.derivation,
			floorId: form.floorId,
			sourceCategoryId: option.sourceCategoryId,
			label: option.labelAr,
		};

		setForm((prev) => ({
			...prev,
			area: option.unit === "m2" ? qty : prev.area,
			length: option.unit === "m" ? qty : prev.length,
			quantity:
				option.unit === "piece" ? qty : prev.quantity,
			calculationData: {
				...prev.calculationData,
				linkedSource,
			},
		}));
	};

	const handleUnlink = () => {
		setForm((prev) => {
			const { linkedSource: _, ...rest } =
				(prev.calculationData ?? {}) as Record<string, unknown>;
			return {
				...prev,
				calculationData: Object.keys(rest).length > 0 ? rest : undefined,
			};
		});
	};

	// Reset form when dialog opens
	useEffect(() => {
		if (open) {
			if (editItem) {
				setForm({ ...editItem });
			} else {
				setForm({
					category: category.id,
					name: category.nameAr,
					unit: category.unit,
					wastagePercent: category.defaultWastage,
					materialPrice: 0,
					laborPrice: 0,
					totalCost: 0,
				});
			}
		}
	}, [open, editItem, category]);

	// Auto-calculate cost
	const computedCost = calculateFinishingItemCost({
		area: form.area,
		quantity: form.quantity,
		length: form.length,
		unit: form.unit,
		wastagePercent: form.wastagePercent,
		materialPrice: form.materialPrice,
		laborPrice: form.laborPrice,
		calculationData: form.calculationData as { repeatCount?: number } | null,
	});

	const createMutation = useMutation(
		orpc.pricing.studies.finishingItem.create.mutationOptions({
			onSuccess: () => {
				toast.success(t("itemSaved"));
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "getById"]],
				});
				onOpenChange(false);
			},
			onError: () => toast.error(t("itemSaveError")),
		}),
	);

	const createBatchMutation = useMutation(
		orpc.pricing.studies.finishingItem.createBatch.mutationOptions({
			onSuccess: () => {
				toast.success(t("itemSaved"));
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "getById"]],
				});
				onOpenChange(false);
			},
			onError: () => toast.error(t("itemSaveError")),
		}),
	);

	const updateMutation = useMutation(
		orpc.pricing.studies.finishingItem.update.mutationOptions({
			onSuccess: () => {
				toast.success(t("itemSaved"));
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "getById"]],
				});
				onOpenChange(false);
			},
			onError: () => toast.error(t("itemSaveError")),
		}),
	);

	const handleCalculatorResult = (result: CalculatorResult) => {
		setForm((prev) => ({
			...prev,
			area: result.area ?? prev.area,
			quantity: result.quantity ?? prev.quantity,
			length: result.length ?? prev.length,
			calculationData: result.calculationData as Record<string, unknown>,
		}));
	};

	const handleSave = () => {
		const itemData = {
			...form,
			totalCost: computedCost,
			materialCost: computedCost * (form.materialPrice / (form.materialPrice + form.laborPrice || 1)),
			laborCost: computedCost * (form.laborPrice / (form.materialPrice + form.laborPrice || 1)),
		};

		if (isEdit && editItem?.id) {
			updateMutation.mutate({
				organizationId,
				costStudyId: studyId,
				id: editItem.id,
				...itemData,
			});
		} else if (
			form.floorId === "__all__" &&
			buildingConfig?.floors
		) {
			// Batch create for all floors
			const items = buildingConfig.floors.map((floor) => ({
				...itemData,
				floorId: floor.id,
				floorName: floor.name,
				name: `${category.nameAr} - ${floor.name}`,
				area: form.area || floor.area,
			}));
			createBatchMutation.mutate({
				organizationId,
				costStudyId: studyId,
				items,
			});
		} else {
			createMutation.mutate({
				organizationId,
				costStudyId: studyId,
				...itemData,
			});
		}
	};

	const isPending =
		createMutation.isPending ||
		createBatchMutation.isPending ||
		updateMutation.isPending;

	const floors = buildingConfig?.floors ?? [];
	const showFloorSelector = category.scope === "PER_FLOOR" && floors.length > 0;
	const selectedFloor = floors.find((f) => f.id === form.floorId);

	// Determine which calculator to show
	const renderCalculator = () => {
		switch (category.calculationMethod) {
			case "ROOM_BY_ROOM":
				return (
					<RoomByRoomCalculator
						open={calculatorOpen}
						onOpenChange={setCalculatorOpen}
						onApply={handleCalculatorResult}
					/>
				);
			case "WALL_DEDUCTION":
				return (
					<WallDeductionCalculator
						open={calculatorOpen}
						onOpenChange={setCalculatorOpen}
						onApply={handleCalculatorResult}
						floorHeight={selectedFloor?.height ?? 3.2}
						floorArea={selectedFloor?.area ?? 0}
						wastagePercent={form.wastagePercent}
					/>
				);
			case "DIRECT_AREA":
				return (
					<DirectAreaCalculator
						open={calculatorOpen}
						onOpenChange={setCalculatorOpen}
						onApply={handleCalculatorResult}
					/>
				);
			case "PER_UNIT":
				return (
					<PerUnitCalculator
						open={calculatorOpen}
						onOpenChange={setCalculatorOpen}
						onApply={handleCalculatorResult}
						unitLabel={t(`units.${category.unit}` as "units.m2")}
					/>
				);
			case "LINEAR":
				return (
					<LinearCalculator
						open={calculatorOpen}
						onOpenChange={setCalculatorOpen}
						onApply={handleCalculatorResult}
					/>
				);
			case "LUMP_SUM":
				return (
					<LumpSumCalculator
						open={calculatorOpen}
						onOpenChange={setCalculatorOpen}
						onApply={handleCalculatorResult}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{isEdit ? t("editItem") : t("addItem")} — {category.nameAr}
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						{/* Floor selector for PER_FLOOR */}
						{showFloorSelector && (
							<div className="space-y-1">
								<Label className="text-sm">{t("selectFloor")}</Label>
								<FloorSelector
									floors={floors}
									value={form.floorId ?? ""}
									onChange={(floorId, floorName) =>
										setForm((prev) => ({ ...prev, floorId, floorName }))
									}
									showAllFloors={!isEdit}
								/>
							</div>
						)}

						{/* Linking Section */}
						{hasLinking && (
							<div className="space-y-2">
								{currentLink ? (
									<div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 p-2.5">
										<div className="flex items-center gap-2 min-w-0">
											<Link2 className="h-4 w-4 shrink-0 text-blue-600" />
											<span className="text-xs text-blue-700 dark:text-blue-300 truncate">
												{currentLink.label}
											</span>
										</div>
										<Button
											variant="ghost"
											size="sm"
											className="h-7 text-xs shrink-0"
											onClick={handleUnlink}
										>
											<Unlink className="h-3 w-3 me-1" />
											{t("linking.unlink")}
										</Button>
									</div>
								) : (
									<div className="space-y-1.5">
										<Label className="text-xs text-muted-foreground">
											{t("linking.fillFromBuilding")}
										</Label>
										<div className="flex flex-wrap gap-1.5">
											{derivationOptions.map((option) => {
												let previewQty: number | null = null;
												if (
													option.sourceType === "building_config" &&
													buildingConfig
												) {
													previewQty = computeDerivedQuantity(
														option.derivation,
														buildingConfig,
														form.floorId,
													);
												} else if (
													option.sourceType === "category" &&
													option.sourceCategoryId &&
													allItems
												) {
													previewQty = getQuantityFromCategory(
														option.sourceCategoryId,
														allItems,
														form.floorId ?? undefined,
													);
												}

												const isDisabled =
													previewQty == null ||
													previewQty <= 0 ||
													(option.requiresFloor && !form.floorId);

												return (
													<Button
														key={option.derivation + (option.sourceCategoryId ?? "")}
														variant="outline"
														size="sm"
														className="h-auto py-1.5 px-2.5 text-xs whitespace-normal text-start"
														disabled={isDisabled}
														onClick={() => handleApplyLink(option)}
													>
														<Link2 className="h-3 w-3 me-1.5 shrink-0" />
														<span>
															{option.labelAr}
															{previewQty != null && previewQty > 0 && (
																<span className="text-muted-foreground ms-1">
																	({previewQty} {t(`units.${option.unit}` as "units.m2")})
																</span>
															)}
														</span>
													</Button>
												);
											})}
										</div>
									</div>
								)}
							</div>
						)}

						{/* Name */}
						<div className="space-y-1">
							<Label className="text-sm">الاسم</Label>
							<Input
								value={form.name}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, name: e.target.value }))
								}
							/>
						</div>

						{/* Sub-category */}
						{category.subCategories.length > 0 && (
							<div className="space-y-1">
								<Label className="text-sm">{t("subCategory")}</Label>
								<Select
									value={form.subCategory ?? ""}
									onValueChange={(v) =>
										setForm((prev) => ({ ...prev, subCategory: v }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder={t("subCategory")} />
									</SelectTrigger>
									<SelectContent>
										{category.subCategories.map((sub) => (
											<SelectItem key={sub.id} value={sub.id}>
												{sub.nameAr}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}

						{/* Quality level */}
						{category.qualityLevels.length > 0 && (
							<div className="space-y-1">
								<Label className="text-sm">{t("qualityLevel")}</Label>
								<Select
									value={form.qualityLevel ?? ""}
									onValueChange={(v) =>
										setForm((prev) => ({ ...prev, qualityLevel: v }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder={t("qualityLevel")} />
									</SelectTrigger>
									<SelectContent>
										{category.qualityLevels.map((ql) => (
											<SelectItem key={ql.id} value={ql.id}>
												{ql.nameAr}{" "}
												<span className="text-xs text-muted-foreground">
													({ql.priceRangeAr})
												</span>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}

						{/* Calculator trigger */}
						{category.calculationMethod !== "LUMP_SUM" && (
							<Button
								variant="outline"
								size="sm"
								className="w-full"
								onClick={() => setCalculatorOpen(true)}
							>
								<Calculator className="h-4 w-4 me-2" />
								{t(`calculator.${category.calculationMethod === "ROOM_BY_ROOM" ? "roomByRoom" : category.calculationMethod === "WALL_DEDUCTION" ? "wallDeduction" : category.calculationMethod === "DIRECT_AREA" ? "directArea" : category.calculationMethod === "PER_UNIT" ? "perUnit" : "linear"}` as "calculator.roomByRoom")}
							</Button>
						)}

						{/* Measurement fields */}
						<div className="grid grid-cols-2 gap-3">
							{(category.unit === "m2" || category.unit === "m") && (
								<div className="space-y-1">
									<Label className="text-sm">
										{category.unit === "m2" ? "المساحة (م²)" : "الطول (م.ط)"}
									</Label>
									<Input
										type="number"
										value={
											category.unit === "m2"
												? form.area || ""
												: form.length || ""
										}
										onChange={(e) => {
											const val = parseFloat(e.target.value) || 0;
											setForm((prev) =>
												category.unit === "m2"
													? { ...prev, area: val }
													: { ...prev, length: val },
											);
										}}
									/>
								</div>
							)}
							{(category.unit === "piece" || category.unit === "set") && (
								<div className="space-y-1">
									<Label className="text-sm">
										الكمية ({t(`units.${category.unit}` as "units.piece")})
									</Label>
									<Input
										type="number"
										value={form.quantity || ""}
										onChange={(e) =>
											setForm((prev) => ({
												...prev,
												quantity: parseInt(e.target.value) || 0,
											}))
										}
									/>
								</div>
							)}
							{category.defaultWastage > 0 && (
								<div className="space-y-1">
									<Label className="text-sm">{t("wastage")} %</Label>
									<Input
										type="number"
										value={form.wastagePercent || ""}
										onChange={(e) =>
											setForm((prev) => ({
												...prev,
												wastagePercent: parseFloat(e.target.value) || 0,
											}))
										}
									/>
								</div>
							)}
						</div>

						{/* Pricing */}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1">
								<Label className="text-sm">
									{t("materialPrice")} (ر.س/{t(`units.${category.unit}` as "units.m2")})
								</Label>
								<Input
									type="number"
									value={form.materialPrice || ""}
									onChange={(e) =>
										setForm((prev) => ({
											...prev,
											materialPrice: parseFloat(e.target.value) || 0,
										}))
									}
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-sm">
									{t("laborPrice")} (ر.س/{t(`units.${category.unit}` as "units.m2")})
								</Label>
								<Input
									type="number"
									value={form.laborPrice || ""}
									onChange={(e) =>
										setForm((prev) => ({
											...prev,
											laborPrice: parseFloat(e.target.value) || 0,
										}))
									}
								/>
							</div>
						</div>

						{/* Cost display */}
						<div className="rounded-lg bg-muted p-3 space-y-1">
							{category.unit !== "lump_sum" && (
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">
										{t("actualQuantity")}:
									</span>
									<span>
										{(
											(form.area || form.quantity || form.length || 0) *
											(1 + (form.wastagePercent || 0) / 100)
										).toFixed(2)}{" "}
										{t(`units.${category.unit}` as "units.m2")}
									</span>
								</div>
							)}
							<div className="flex justify-between font-medium">
								<span>{t("estimatedCost")}:</span>
								<span>{formatCurrency(computedCost)}</span>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isPending}
						>
							إلغاء
						</Button>
						<Button onClick={handleSave} disabled={isPending}>
							{isPending ? "جارٍ الحفظ..." : isEdit ? "تحديث" : "حفظ"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{renderCalculator()}
		</>
	);
}
