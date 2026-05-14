"use client";

import { useState, useMemo } from "react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Card, CardContent } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
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
import { calculateBeam } from "../../../lib/calculations";
import { getRebarWeightPerMeter, calculateBeamRebar } from "../../../lib/structural-calculations";
import { formatNumber, formatCurrency, ELEMENT_PREFIXES } from "../../../lib/utils";
import { CONCRETE_TYPES, REBAR_DIAMETERS, STOCK_LENGTHS } from "../../../constants/prices";
import {
	ElementHeaderRow,
	DimensionsCard,
	RebarBarsInput,
	StirrupsInput,
	CalculationResultsPanel,
} from "../shared";
import type { StructuralItemCreateInput, StructuralItemUpdateInput, StructuralItemDeleteInput } from "../../../types/structural-mutation";

interface BeamsSectionProps {
	studyId: string;
	organizationId: string;
	items: Array<{
		id: string;
		name: string;
		subCategory?: string | null;
		quantity: number;
		dimensions: Record<string, number>;
		concreteVolume: number;
		steelWeight: number;
		totalCost: number;
	}>;
	onSave: () => void;
	onUpdate: () => void;
	specs?: { concreteType: string; steelGrade: string };
}

export function BeamsSection({
	studyId,
	organizationId,
	items,
	onSave,
	onUpdate,
	specs,
}: BeamsSectionProps) {
	const t = useTranslations();
	const [isAdding, setIsAdding] = useState(false);
	const [editingItemId, setEditingItemId] = useState<string | null>(null);
	const [showCuttingDetails, setShowCuttingDetails] = useState(false);

	const [formData, setFormData] = useState({
		name: "",
		beamType: "beam" as "beam" | "groundBeam",
		quantity: 1,
		width: 30, // سم
		height: 60, // سم
		length: 5, // متر
		topBarsCount: 3,
		topBarDiameter: 16,
		bottomBarsCount: 4,
		bottomBarDiameter: 18,
		stirrupDiameter: 8,
		stirrupSpacing: 150,
	});

	// حساب النتائج مع تفاصيل القص
	const calculations = useMemo(() => {
		if (formData.width <= 0 || formData.height <= 0 || formData.length <= 0) {
			return null;
		}

		return calculateBeamRebar({
			quantity: formData.quantity,
			width: formData.width,
			height: formData.height,
			length: formData.length,
			topBarsCount: formData.topBarsCount,
			topBarDiameter: formData.topBarDiameter,
			bottomBarsCount: formData.bottomBarsCount,
			bottomBarDiameter: formData.bottomBarDiameter,
			stirrupDiameter: formData.stirrupDiameter,
			stirrupSpacing: formData.stirrupSpacing,
			concreteType: specs?.concreteType || "C30",
		});
	}, [formData, specs]);

	const createMutation = useMutation(
		orpc.pricing.studies.structuralItem.create.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.studies.messages.itemCreated"));
				setIsAdding(false);
				setEditingItemId(null);
				onSave();
			},
			onError: () => {
				toast.error(t("pricing.studies.messages.itemCreateError"));
			},
		})
	);

	const updateMutation = useMutation(
		orpc.pricing.studies.structuralItem.update.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.studies.messages.itemUpdated"));
				setIsAdding(false);
				setEditingItemId(null);
				onUpdate();
			},
			onError: () => {
				toast.error(t("pricing.studies.messages.itemUpdateError"));
			},
		})
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
		})
	);

	const handleSubmit = async () => {
		if (!formData.name || !calculations) return;

		const itemData = {
			costStudyId: studyId,
			organizationId,
			category: "beams",
			subCategory: formData.beamType,
			name: formData.name,
			quantity: formData.quantity,
			unit: "m3",
			dimensions: {
				width: formData.width,
				height: formData.height,
				length: formData.length,
				topBarsCount: formData.topBarsCount,
				topBarDiameter: formData.topBarDiameter,
				bottomBarsCount: formData.bottomBarsCount,
				bottomBarDiameter: formData.bottomBarDiameter,
				stirrupDiameter: formData.stirrupDiameter,
				stirrupSpacing: formData.stirrupSpacing,
			},
			concreteVolume: calculations.concreteVolume,
			concreteType: specs?.concreteType || "C30",
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
			(updateMutation.mutate as (data: StructuralItemUpdateInput) => void)({ ...itemData, id: editingItemId, costStudyId: studyId });
		} else {
			(createMutation.mutate as (data: StructuralItemCreateInput) => void)(itemData);
		}
	};

	const handleDelete = (id: string) => {
		if (confirm(t("pricing.studies.messages.confirmDelete"))) {
			(deleteMutation.mutate as (data: StructuralItemDeleteInput) => void)({ id, organizationId, costStudyId: studyId });
		}
	};

	return (
		<div className="space-y-4">
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
									<TableCell className="font-medium">
										{item.name}
										{item.subCategory === "groundBeam" && (
											<Badge variant="outline" className="mr-2 text-xs">ميدة</Badge>
										)}
									</TableCell>
									<TableCell>{item.quantity}</TableCell>
									<TableCell>
										{item.dimensions?.width || 0}×{item.dimensions?.height || 0}{" "}
										{t("pricing.studies.units.cm")} × {item.dimensions?.length || 0}{" "}
										{t("pricing.studies.units.m")}
									</TableCell>
									<TableCell>
										{formatNumber(item.concreteVolume)} {t("pricing.studies.units.m3")}
									</TableCell>
									<TableCell>
										{formatNumber(item.steelWeight)} {t("pricing.studies.units.kg")}
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-1">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => {
													setEditingItemId(item.id);
													setIsAdding(true);
													setFormData({
														name: item.name,
														beamType: (item.subCategory === "groundBeam" ? "groundBeam" : "beam") as "beam" | "groundBeam",
														quantity: item.quantity,
														width: item.dimensions?.width || 30,
														height: item.dimensions?.height || 60,
														length: item.dimensions?.length || 5,
														topBarsCount: item.dimensions?.topBarsCount || 3,
														topBarDiameter: item.dimensions?.topBarDiameter || 16,
														bottomBarsCount: item.dimensions?.bottomBarsCount || 4,
														bottomBarDiameter: item.dimensions?.bottomBarDiameter || 18,
														stirrupDiameter: item.dimensions?.stirrupDiameter || 8,
														stirrupSpacing: item.dimensions?.stirrupSpacing || 150,
													});
												}}
												title={t("common.edit")}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => {
													setEditingItemId(null);
													setIsAdding(true);
													setFormData({
														name: `${item.name} - نسخة`,
														beamType: (item.subCategory === "groundBeam" ? "groundBeam" : "beam") as "beam" | "groundBeam",
														quantity: item.quantity,
														width: item.dimensions?.width || 30,
														height: item.dimensions?.height || 60,
														length: item.dimensions?.length || 5,
														topBarsCount: item.dimensions?.topBarsCount || 3,
														topBarDiameter: item.dimensions?.topBarDiameter || 16,
														bottomBarsCount: item.dimensions?.bottomBarsCount || 4,
														bottomBarDiameter: item.dimensions?.bottomBarDiameter || 18,
														stirrupDiameter: item.dimensions?.stirrupDiameter || 8,
														stirrupSpacing: item.dimensions?.stirrupSpacing || 150,
													});
												}}
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

			{isAdding ? (
				<Card className="border-dashed border-2 border-primary/50">
					<CardContent className="p-4 space-y-4">
						<div className="flex items-center justify-between">
							<h4 className="font-medium">
								{editingItemId ? t("pricing.studies.structural.editItem") : t("pricing.studies.structural.addItem")}
							</h4>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => { setIsAdding(false); setEditingItemId(null); }}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>

						{/* البيانات الأساسية - صف واحد مضغوط */}
						<ElementHeaderRow
							autoNamePrefix={ELEMENT_PREFIXES.beams}
							existingCount={items.length}
							name={formData.name}
							onNameChange={(name) => setFormData({ ...formData, name })}
							subTypes={[
								{ value: "groundBeam", label: "ميدة (كمرة أرضية)" },
								{ value: "beam", label: "كمرة عادية" },
							]}
							selectedSubType={formData.beamType}
							onSubTypeChange={(type) => setFormData({ ...formData, beamType: type as "beam" | "groundBeam" })}
							quantity={formData.quantity}
							onQuantityChange={(quantity) => setFormData({ ...formData, quantity })}
							showConcreteType={false}
						/>

						{/* أبعاد الكمرة */}
						<DimensionsCard
							title="أبعاد الكمرة"
							dimensions={[
								{ key: "width", label: "العرض", value: formData.width, unit: "سم", step: 5, min: 20 },
								{ key: "height", label: "الارتفاع", value: formData.height, unit: "سم", step: 5, min: 30 },
								{ key: "length", label: "الطول", value: formData.length, unit: "م", step: 0.1, min: 1 },
							]}
							onDimensionChange={(key, value) => setFormData({ ...formData, [key]: value })}
							calculatedVolume={(formData.width / 100) * (formData.height / 100) * formData.length * formData.quantity}
						/>

						{/* تسليح الكمرة */}
						<div className="border-t pt-4 space-y-4">
							<h4 className="font-medium flex items-center gap-2">
								<span className="w-2 h-2 rounded-full bg-primary" />
								تسليح الكمرة
							</h4>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
								<RebarBarsInput
									title="الحديد السفلي (الشد)"
									diameter={formData.bottomBarDiameter}
									onDiameterChange={(d) => setFormData({ ...formData, bottomBarDiameter: d })}
									barsCount={formData.bottomBarsCount}
									onBarsCountChange={(n) => setFormData({ ...formData, bottomBarsCount: n })}
									colorScheme="blue"
									availableDiameters={REBAR_DIAMETERS.filter((d) => d >= 12)}
									availableBarsCount={[2, 3, 4, 5, 6, 8]}
								/>
								<RebarBarsInput
									title="الحديد العلوي (الضغط)"
									diameter={formData.topBarDiameter}
									onDiameterChange={(d) => setFormData({ ...formData, topBarDiameter: d })}
									barsCount={formData.topBarsCount}
									onBarsCountChange={(n) => setFormData({ ...formData, topBarsCount: n })}
									colorScheme="green"
									availableDiameters={REBAR_DIAMETERS.filter((d) => d >= 12)}
									availableBarsCount={[2, 3, 4, 5, 6]}
								/>
								<StirrupsInput
									diameter={formData.stirrupDiameter}
									onDiameterChange={(d) => setFormData({ ...formData, stirrupDiameter: d })}
									spacing={formData.stirrupSpacing}
									onSpacingChange={(s) => setFormData({ ...formData, stirrupSpacing: s })}
									availableDiameters={REBAR_DIAMETERS.filter((d) => d <= 10)}
									availableSpacings={[100, 125, 150, 175, 200, 250]}
								/>
							</div>
						</div>

						{/* نتائج الحساب */}
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
							<Button variant="outline" onClick={() => { setIsAdding(false); setEditingItemId(null); }}>
								{t("pricing.studies.form.cancel")}
							</Button>
							<Button
								onClick={handleSubmit}
								disabled={
									createMutation.isPending || updateMutation.isPending || !formData.name || !calculations
								}
							>
								<Save className="h-4 w-4 ml-2" />
								{editingItemId ? t("pricing.studies.structural.updateItem") : t("pricing.studies.structural.saveItem")}
							</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<Button
					variant="outline"
					className="w-full bg-primary/10 text-primary border-2 border-dashed border-primary/40 hover:bg-primary/20 hover:border-primary/60 transition-all"
					onClick={() => setIsAdding(true)}
				>
					<Plus className="h-5 w-5 ml-2" />
					<span className="font-semibold">{t("pricing.studies.structural.addItem")}</span>
				</Button>
			)}

			{items.length > 0 && (
				<div className="bg-muted/30 rounded-lg p-4">
					<h4 className="font-medium mb-2">
						{t("pricing.studies.summary.totalItems")}
					</h4>
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">
								{t("pricing.studies.summary.totalConcrete")}:
							</span>
							<p className="font-bold">
								{formatNumber(
									items.reduce((sum, i) => sum + i.concreteVolume, 0)
								)}{" "}
								{t("pricing.studies.units.m3")}
							</p>
						</div>
						<div>
							<span className="text-muted-foreground">
								{t("pricing.studies.summary.totalRebar")}:
							</span>
							<p className="font-bold">
								{formatNumber(
									items.reduce((sum, i) => sum + i.steelWeight, 0)
								)}{" "}
								{t("pricing.studies.units.kg")}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
