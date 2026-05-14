"use client";

import { useState, useMemo } from "react";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { Label } from "@ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	Plus,
	Save,
	Trash2,
	Pencil,
	Calculator,
	X,
	Copy,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { toast } from "sonner";
import { calculateColumnRebar } from "../../../../lib/structural-calculations";
import { formatNumber, ELEMENT_PREFIXES } from "../../../../lib/utils";
import { REBAR_DIAMETERS } from "../../../../constants/prices";
import {
	ElementHeaderRow,
	DimensionsCard,
	RebarBarsInput,
	StirrupsInput,
	CalculationResultsPanel,
} from "../../shared";
import type { StructuralItemCreateInput, StructuralItemUpdateInput, StructuralItemDeleteInput } from "../../../../types/structural-mutation";
import type { FloorColumnsPanelProps, ItemType } from "./types";

export function FloorColumnsPanel({
	floor,
	studyId,
	organizationId,
	items,
	specs,
	onSave,
	onUpdate,
	allItemsCount,
	derivedColumnHeight,
}: FloorColumnsPanelProps) {
	const t = useTranslations();
	const [isAdding, setIsAdding] = useState(false);
	const [editingItemId, setEditingItemId] = useState<string | null>(null);
	const [showCuttingDetails, setShowCuttingDetails] = useState(false);

	const defaultColumnHeight = derivedColumnHeight != null && derivedColumnHeight > 0
		? derivedColumnHeight / 100 // cm → m
		: 3;

	const [formData, setFormData] = useState({
		name: "",
		quantity: 1,
		shape: "rectangular" as "rectangular" | "circular",
		width: 30,
		depth: 30,
		diameter: 40,
		height: defaultColumnHeight,
		mainBarsCount: 8,
		mainBarDiameter: 16,
		stirrupDiameter: 8,
		stirrupSpacing: 150,
	});

	const calculations = useMemo(() => {
		const isCircular = formData.shape === "circular";
		if (formData.height <= 0) return null;
		if (isCircular) {
			if (!formData.diameter || formData.diameter <= 0) return null;
		} else if (formData.width <= 0 || formData.depth <= 0) return null;
		return calculateColumnRebar({
			...formData,
			concreteType: specs?.concreteType || "C35",
		});
	}, [formData, specs]);

	const createMutation = useMutation(
		orpc.pricing.studies.structuralItem.create.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.studies.messages.itemCreated"));
				setIsAdding(false);
				setEditingItemId(null);
				resetForm();
				onSave();
			},
			onError: () => {
				toast.error(t("pricing.studies.messages.itemCreateError"));
			},
		}),
	);

	const updateMutation = useMutation(
		orpc.pricing.studies.structuralItem.update.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.studies.messages.itemUpdated"));
				setIsAdding(false);
				setEditingItemId(null);
				resetForm();
				onUpdate();
			},
			onError: () => {
				toast.error(t("pricing.studies.messages.itemUpdateError"));
			},
		}),
	);

	const deleteMutation = useMutation(
		orpc.pricing.studies.structuralItem.delete.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.studies.messages.itemDeleted"));
				onUpdate();
			},
			onError: () => {
				toast.error(t("pricing.studies.messages.itemDeleteError"));
			},
		}),
	);

	const resetForm = () => {
		setFormData({
			name: "",
			quantity: 1,
			shape: "rectangular",
			width: 30,
			depth: 30,
			diameter: 40,
			height: defaultColumnHeight,
			mainBarsCount: 8,
			mainBarDiameter: 16,
			stirrupDiameter: 8,
			stirrupSpacing: 150,
		});
	};

	const handleSubmit = async () => {
		if (!formData.name || !calculations) return;

		const itemData = {
			costStudyId: studyId,
			organizationId,
			category: "columns",
			subCategory: floor.id,
			name: formData.name,
			quantity: formData.quantity,
			unit: "m3",
			dimensions: {
				width: formData.width,
				depth: formData.depth,
				height: formData.height,
				mainBarsCount: formData.mainBarsCount,
				mainBarDiameter: formData.mainBarDiameter,
				stirrupDiameter: formData.stirrupDiameter,
				stirrupSpacing: formData.stirrupSpacing,
				shape: formData.shape === "circular" ? 1 : 0,
				diameter: formData.diameter,
			},
			concreteVolume: calculations.concreteVolume,
			concreteType: specs?.concreteType || "C35",
			steelWeight: calculations.totals.grossWeight,
			steelRatio:
				calculations.concreteVolume > 0
					? calculations.totals.grossWeight / calculations.concreteVolume
					: 0,
			materialCost: calculations.concreteCost + calculations.rebarCost,
			laborCost: calculations.laborCost,
			totalCost: calculations.totalCost,
		};

		if (editingItemId) {
			(updateMutation.mutate as (data: StructuralItemUpdateInput) => void)({
				...itemData,
				id: editingItemId,
				costStudyId: studyId,
			});
		} else {
			(createMutation.mutate as (data: StructuralItemCreateInput) => void)(itemData);
		}
	};

	const handleDelete = (id: string) => {
		if (confirm(t("pricing.studies.messages.confirmDelete"))) {
			(deleteMutation.mutate as (data: StructuralItemDeleteInput) => void)({
				id,
				organizationId,
				costStudyId: studyId,
			});
		}
	};

	const handleStartAdding = () => {
		resetForm();
		setEditingItemId(null);
		setIsAdding(true);
	};

	const handleEdit = (item: ItemType) => {
		setEditingItemId(item.id);
		setIsAdding(true);
		setFormData({
			name: item.name,
			quantity: item.quantity,
			shape: item.dimensions?.shape ? "circular" : "rectangular",
			width: item.dimensions?.width || 30,
			depth: item.dimensions?.depth || 30,
			diameter: item.dimensions?.diameter || 40,
			height: item.dimensions?.height || 3,
			mainBarsCount: item.dimensions?.mainBarsCount || 8,
			mainBarDiameter: item.dimensions?.mainBarDiameter || 16,
			stirrupDiameter: item.dimensions?.stirrupDiameter || 8,
			stirrupSpacing: item.dimensions?.stirrupSpacing || 150,
		});
	};

	const handleDuplicate = (item: ItemType) => {
		setEditingItemId(null);
		setIsAdding(true);
		setFormData({
			name: `${item.name} - نسخة`,
			quantity: item.quantity,
			shape: item.dimensions?.shape ? "circular" : "rectangular",
			width: item.dimensions?.width || 30,
			depth: item.dimensions?.depth || 30,
			diameter: item.dimensions?.diameter || 40,
			height: item.dimensions?.height || 3,
			mainBarsCount: item.dimensions?.mainBarsCount || 8,
			mainBarDiameter: item.dimensions?.mainBarDiameter || 16,
			stirrupDiameter: item.dimensions?.stirrupDiameter || 8,
			stirrupSpacing: item.dimensions?.stirrupSpacing || 150,
		});
	};

	const floorConcrete = items.reduce((s, i) => s + i.concreteVolume, 0);
	const floorSteel = items.reduce((s, i) => s + i.steelWeight, 0);

	return (
		<div className="space-y-3">
			{/* جدول العناصر */}
			{items.length > 0 && (
				<div className="border rounded-lg overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-right">
									{t("pricing.studies.structural.itemName")}
								</TableHead>
								<TableHead className="text-right">
									{t("pricing.studies.structural.quantity")}
								</TableHead>
								<TableHead className="text-right">
									{t("pricing.studies.form.dimensions")}
								</TableHead>
								<TableHead className="text-right">التسليح</TableHead>
								<TableHead className="text-right">
									{t("pricing.studies.structural.concreteVolume")}
								</TableHead>
								<TableHead className="text-right">
									{t("pricing.studies.structural.steelWeight")}
								</TableHead>
								<TableHead className="w-12"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item) => (
								<TableRow key={item.id}>
									<TableCell className="font-medium">{item.name}</TableCell>
									<TableCell>{item.quantity}</TableCell>
									<TableCell>
										{item.dimensions?.shape ? (
											<>
												Ø{item.dimensions?.diameter || 0}{" "}
												{t("pricing.studies.units.cm")} ×{" "}
												{item.dimensions?.height || 0}{" "}
												{t("pricing.studies.units.m")}
											</>
										) : (
											<>
												{item.dimensions?.width || 0}×
												{item.dimensions?.depth || 0}{" "}
												{t("pricing.studies.units.cm")} ×{" "}
												{item.dimensions?.height || 0}{" "}
												{t("pricing.studies.units.m")}
											</>
										)}
									</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										{item.dimensions?.mainBarsCount || 8}∅
										{item.dimensions?.mainBarDiameter || 16} + ك∅
										{item.dimensions?.stirrupDiameter || 8}/
										{item.dimensions?.stirrupSpacing || 150}
									</TableCell>
									<TableCell>
										{formatNumber(item.concreteVolume)}{" "}
										{t("pricing.studies.units.m3")}
									</TableCell>
									<TableCell>
										{formatNumber(item.steelWeight)}{" "}
										{t("pricing.studies.units.kg")}
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-1">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleEdit(item)}
												title={t("common.edit")}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleDuplicate(item)}
												title="نسخ"
											>
												<Copy className="h-4 w-4 text-blue-600" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleDelete(item.id)}
												disabled={deleteMutation.isPending}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{/* نموذج الإضافة */}
			{isAdding ? (
				<Card className="border-dashed border-2 border-primary/50">
					<CardContent className="p-4 space-y-4">
						<div className="flex items-center justify-between">
							<h4 className="font-medium">
								{editingItemId
									? t("pricing.studies.structural.editItem")
									: t("pricing.studies.structural.addItem")}
							</h4>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									setIsAdding(false);
									setEditingItemId(null);
									resetForm();
								}}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>

						<ElementHeaderRow
							autoNamePrefix={ELEMENT_PREFIXES.columns}
							existingCount={allItemsCount}
							name={formData.name}
							onNameChange={(name) => setFormData({ ...formData, name })}
							quantity={formData.quantity}
							onQuantityChange={(quantity) =>
								setFormData({ ...formData, quantity })
							}
							showConcreteType={false}
							showSubType={false}
						/>

						<div className="flex items-center gap-2">
							<Label className="text-sm text-muted-foreground">شكل العمود:</Label>
							<div className="flex gap-1">
								<Button
									type="button"
									variant={formData.shape === "rectangular" ? "primary" : "outline"}
									size="sm"
									onClick={() => setFormData({ ...formData, shape: "rectangular" })}
								>
									مستطيل
								</Button>
								<Button
									type="button"
									variant={formData.shape === "circular" ? "primary" : "outline"}
									size="sm"
									onClick={() =>
										setFormData({
											...formData,
											shape: "circular",
											mainBarsCount: Math.max(formData.mainBarsCount, 8),
										})
									}
								>
									عمود دائري
								</Button>
							</div>
						</div>

						<DimensionsCard
							title={derivedColumnHeight != null ? "أبعاد العمود (الارتفاع محسوب من المناسيب)" : "أبعاد العمود"}
							dimensions={
								formData.shape === "circular"
									? [
										{
											key: "diameter",
											label: "القطر",
											value: formData.diameter,
											unit: "سم",
											step: 1,
											min: 20,
											max: 200,
										},
										{
											key: "height",
											label: derivedColumnHeight != null ? "الارتفاع (محسوب)" : "الارتفاع",
											value: formData.height,
											unit: "م",
											step: 0.1,
											min: 0.5,
										},
									]
									: [
										{
											key: "width",
											label: "العرض",
											value: formData.width,
											unit: "سم",
											step: 5,
											min: 20,
										},
										{
											key: "depth",
											label: "العمق",
											value: formData.depth,
											unit: "سم",
											step: 5,
											min: 20,
										},
										{
											key: "height",
											label: derivedColumnHeight != null ? "الارتفاع (محسوب)" : "الارتفاع",
											value: formData.height,
											unit: "م",
											step: 0.1,
											min: 0.5,
										},
									]
							}
							onDimensionChange={(key, value) =>
								setFormData({ ...formData, [key]: value })
							}
							calculatedVolume={
								formData.shape === "circular"
									? Math.PI * (formData.diameter / 200) ** 2 * formData.height * formData.quantity
									: (formData.width / 100) *
										(formData.depth / 100) *
										formData.height *
										formData.quantity
							}
						/>

						<div className="border-t pt-4 space-y-4">
							<h4 className="font-medium flex items-center gap-2">
								<span className="w-2 h-2 rounded-full bg-primary" />
								تسليح العمود
							</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<RebarBarsInput
									title="الأسياخ الرئيسية"
									diameter={formData.mainBarDiameter}
									onDiameterChange={(d) =>
										setFormData({ ...formData, mainBarDiameter: d })
									}
									barsCount={formData.mainBarsCount}
									onBarsCountChange={(n) =>
										setFormData({ ...formData, mainBarsCount: n })
									}
									colorScheme="indigo"
									availableDiameters={REBAR_DIAMETERS.filter((d) => d >= 12)}
									availableBarsCount={
										formData.shape === "circular"
											? [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 50]
											: [4, 6, 8, 10, 12, 14, 16]
									}
									allowCustomCount
								/>
								<StirrupsInput
									diameter={formData.stirrupDiameter}
									onDiameterChange={(d) =>
										setFormData({ ...formData, stirrupDiameter: d })
									}
									spacing={formData.stirrupSpacing}
									onSpacingChange={(s) =>
										setFormData({ ...formData, stirrupSpacing: s })
									}
									availableDiameters={REBAR_DIAMETERS.filter((d) => d <= 10)}
									availableSpacings={[100, 125, 150, 175, 200, 250]}
								/>
							</div>
						</div>

						{calculations && (
							<div className="bg-muted/50 rounded-lg p-4 space-y-4">
								<div className="flex items-center gap-2 mb-3">
									<Calculator className="h-5 w-5 text-primary" />
									<h4 className="font-medium">
										{t("pricing.studies.calculations.results")}
									</h4>
								</div>
								<CalculationResultsPanel
									concreteVolume={calculations.concreteVolume}
									totals={calculations.totals}
									cuttingDetails={calculations.cuttingDetails}
									showCuttingDetails={showCuttingDetails}
									onToggleCuttingDetails={setShowCuttingDetails}
								/>
							</div>
						)}

						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => {
									setIsAdding(false);
									setEditingItemId(null);
									resetForm();
								}}
							>
								{t("pricing.studies.form.cancel")}
							</Button>
							<Button
								onClick={handleSubmit}
								disabled={
									createMutation.isPending ||
									updateMutation.isPending ||
									!formData.name ||
									!calculations
								}
							>
								<Save className="h-4 w-4 ml-2" />
								{editingItemId
									? t("pricing.studies.structural.updateItem")
									: t("pricing.studies.structural.saveItem")}
							</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<Button
					variant="outline"
					className="w-full bg-primary/10 text-primary border-2 border-dashed border-primary/40 hover:bg-primary/20 hover:border-primary/60 transition-all"
					onClick={handleStartAdding}
				>
					<Plus className="h-5 w-5 ml-2" />
					<span className="font-semibold">إضافة عمود</span>
				</Button>
			)}

			{/* ملخص الدور */}
			{items.length > 0 && (
				<div className="bg-muted/30 rounded-lg p-3">
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">خرسانة:</span>
							<span className="font-bold mr-1">
								{formatNumber(floorConcrete)} {t("pricing.studies.units.m3")}
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">حديد:</span>
							<span className="font-bold mr-1">
								{formatNumber(floorSteel)} {t("pricing.studies.units.kg")}
							</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
