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
	Package,
	LayoutGrid,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { toast } from "sonner";
import {
	calculateSolidSlab,
	calculateFlatSlab,
	calculateRibbedSlab,
	calculateHollowCoreSlab,
	calculateBandedBeamSlab,
	type EnhancedSlabResult,
} from "../../lib/structural-calculations";
import type {
	SolidSlab,
	FlatSlab,
	RibbedSlab,
	HollowCoreSlab,
	BandedBeamSlab,
} from "../../types/slabs";
import { formatNumber, ELEMENT_PREFIXES } from "../../lib/utils";
import {
	REBAR_DIAMETERS,
} from "../../constants/prices";
import {
	SLAB_TYPE_INFO,
	COMMON_THICKNESSES,
	HORDI_BLOCK_SIZES,
	COMMON_SPACINGS,
} from "../../constants/slabs";
import {
	ElementHeaderRow,
	DimensionsCard,
	RebarMeshInput,
	CalculationResultsPanel,
} from "../shared";

interface SlabsSectionProps {
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
}

type SlabTypeKey = "solid" | "flat" | "ribbed" | "hollow_core" | "banded_beam";

interface FormData {
	name: string;
	slabType: SlabTypeKey;
	quantity: number;
	length: number;
	width: number;
	thickness: number;
	concreteType: string;
	cover: number;
	// تسليح السقف الصلب - الشبكة السفلية
	bottomMainDiameter: number;
	bottomMainBarsPerMeter: number;
	bottomSecondaryDiameter: number;
	bottomSecondaryBarsPerMeter: number;
	// تسليح السقف الصلب - الشبكة العلوية (اختياري)
	hasTopMesh: boolean;
	topMainDiameter: number;
	topMainBarsPerMeter: number;
	topSecondaryDiameter: number;
	topSecondaryBarsPerMeter: number;
	// للهوردي
	ribWidth: number;
	ribSpacing: number;
	blockHeight: number;
	toppingThickness: number;
	ribBottomBars: number;
	ribBarDiameter: number;
	ribTopBars: number;
	ribTopBarDiameter: number;
	hasRibStirrup: boolean;
	ribStirrupDiameter: number;
	ribStirrupSpacing: number;
	// للهولوكور
	panelWidth: number;
	panelThickness: number;
	// للفلات سلاب
	hasDropPanels: boolean;
	dropPanelLength: number;
	dropPanelWidth: number;
	dropPanelDepth: number;
	dropPanelCount: number;
	// للكمرات العريضة
	bandedBeamWidth: number;
	bandedBeamDepth: number;
	bandedBeamCount: number;
}

const getDefaultFormData = (): FormData => ({
	name: "",
	slabType: "solid",
	quantity: 1,
	length: 0,
	width: 0,
	thickness: 15,
	concreteType: "C30",
	cover: 0.025,
	// شبكة سفلية
	bottomMainDiameter: 12,
	bottomMainBarsPerMeter: 7,
	bottomSecondaryDiameter: 10,
	bottomSecondaryBarsPerMeter: 5,
	// شبكة علوية
	hasTopMesh: false,
	topMainDiameter: 10,
	topMainBarsPerMeter: 5,
	topSecondaryDiameter: 8,
	topSecondaryBarsPerMeter: 4,
	// هوردي
	ribWidth: 15,
	ribSpacing: 52,
	blockHeight: 20,
	toppingThickness: 5,
	ribBottomBars: 2,
	ribBarDiameter: 12,
	ribTopBars: 2,
	ribTopBarDiameter: 10,
	hasRibStirrup: true,
	ribStirrupDiameter: 8,
	ribStirrupSpacing: 200,
	// هولوكور
	panelWidth: 1.2,
	panelThickness: 20,
	// فلات سلاب
	hasDropPanels: false,
	dropPanelLength: 2,
	dropPanelWidth: 2,
	dropPanelDepth: 0.1,
	dropPanelCount: 4,
	// كمرات عريضة
	bandedBeamWidth: 1.2,
	bandedBeamDepth: 0.4,
	bandedBeamCount: 4,
});

export function SlabsSection({
	studyId,
	organizationId,
	items,
	onSave,
	onUpdate,
}: SlabsSectionProps) {
	const t = useTranslations();
	const [isAdding, setIsAdding] = useState(false);
	const [editingItemId, setEditingItemId] = useState<string | null>(null);
	const [showCuttingDetails, setShowCuttingDetails] = useState(false);
	const [showFormwork, setShowFormwork] = useState(false);

	const [formData, setFormData] = useState<FormData>(getDefaultFormData());

	const resetForm = () => {
		setFormData(getDefaultFormData());
	};

	// حساب النتائج بناءً على نوع السقف
	const calculations = useMemo((): EnhancedSlabResult | null => {
		if (formData.length <= 0 || formData.width <= 0) return null;

		try {
			switch (formData.slabType) {
				case "solid": {
					const input: SolidSlab = {
						id: "temp",
						name: formData.name || "سقف صلب",
						type: "solid",
						subType: "two_way",
						floorName: "أول",
						quantity: formData.quantity,
						isComplete: false,
						dimensions: {
							length: formData.length,
							width: formData.width,
							grossArea: formData.length * formData.width,
						},
						openings: [],
						thickness: formData.thickness / 100,
						reinforcement: {
							inputMethod: "grid",
							grid: {
								bottom: {
									xDirection: {
										diameter: formData.bottomMainDiameter,
										spacing: 1 / formData.bottomMainBarsPerMeter,
									},
									yDirection: {
										diameter: formData.bottomSecondaryDiameter,
										spacing: 1 / formData.bottomSecondaryBarsPerMeter,
									},
								},
								...(formData.hasTopMesh && {
									top: {
										xDirection: {
											diameter: formData.topMainDiameter,
											spacing: 1 / formData.topMainBarsPerMeter,
										},
										yDirection: {
											diameter: formData.topSecondaryDiameter,
											spacing: 1 / formData.topSecondaryBarsPerMeter,
										},
									},
								}),
							},
						},
					};
					return calculateSolidSlab(input);
				}

				case "ribbed": {
					const input: RibbedSlab = {
						id: "temp",
						name: formData.name || "سقف هوردي",
						type: "ribbed",
						ribDirection: "x",
						floorName: "أول",
						quantity: formData.quantity,
						isComplete: false,
						dimensions: {
							length: formData.length,
							width: formData.width,
							grossArea: formData.length * formData.width,
						},
						openings: [],
						system: {
							toppingThickness: formData.toppingThickness,
							ribWidth: formData.ribWidth,
							ribDepth: formData.blockHeight,
							ribSpacing: formData.ribSpacing,
							block: {
								width: 40,
								length: 20,
								height: formData.blockHeight,
								type: "concrete",
							},
						},
						reinforcement: {
							ribs: {
								bottom: {
									count: formData.ribBottomBars,
									diameter: formData.ribBarDiameter,
								},
								top: {
									enabled: formData.ribTopBars > 0,
									count: formData.ribTopBars,
									diameter: formData.ribTopBarDiameter,
								},
								...(formData.hasRibStirrup && {
									stirrups: {
										diameter: formData.ribStirrupDiameter,
										spacing: formData.ribStirrupSpacing / 1000,
									},
								}),
							},
							topping: {},
						},
					};
					return calculateRibbedSlab(input);
				}

				case "flat": {
					const input: FlatSlab = {
						id: "temp",
						name: formData.name || "سقف مسطح",
						type: "flat",
						floorName: "أول",
						quantity: formData.quantity,
						isComplete: false,
						dimensions: {
							length: formData.length,
							width: formData.width,
							grossArea: formData.length * formData.width,
						},
						openings: [],
						thickness: formData.thickness / 100,
						dropPanels: formData.hasDropPanels
							? {
									width: formData.dropPanelWidth,
									depth: formData.dropPanelDepth,
									extraThickness: formData.dropPanelDepth,
								}
							: undefined,
						columnGrid: {
							xSpacing: [6],
							ySpacing: [6],
							columnSize: { width: 0.5, depth: 0.5 },
						},
						hasDropPanels: formData.hasDropPanels,
						hasCapitals: false,
						reinforcement: {
							inputMethod: "ratio",
						},
					};
					return calculateFlatSlab(input);
				}

				case "hollow_core": {
					const input: HollowCoreSlab = {
						id: "temp",
						name: formData.name || "سقف هولوكور",
						type: "hollow_core",
						floorName: "أول",
						quantity: formData.quantity,
						isComplete: false,
						dimensions: {
							length: formData.length,
							width: formData.width,
							grossArea: formData.length * formData.width,
						},
						openings: [],
						panels: {
							thickness: formData.panelThickness,
							width: formData.panelWidth,
						},
						hasTopping: true,
						topping: {
							thickness: formData.toppingThickness / 100,
							reinforcement: {
								mesh: {
									xDirection: { diameter: 8, spacing: 0.2 },
									yDirection: { diameter: 8, spacing: 0.2 },
								},
							},
						},
						grout: { keyway: true, bearingPads: true },
					};
					return calculateHollowCoreSlab(input);
				}

				case "banded_beam": {
					const input: BandedBeamSlab = {
						id: "temp",
						name: formData.name || "سقف كمرات عريضة",
						type: "banded_beam",
						bandDirection: "x",
						floorName: "أول",
						quantity: formData.quantity,
						isComplete: false,
						dimensions: {
							length: formData.length,
							width: formData.width,
							thickness: formData.thickness / 100,
							grossArea: formData.length * formData.width,
							inputMethod: "dimensions",
						},
						openings: [],
						bands: Array.from({ length: formData.bandedBeamCount }, (_, i) => ({
							id: `beam-${i}`,
							name: `ك${i + 1}`,
							direction: "x" as const,
							dimensions: {
								width: formData.bandedBeamWidth,
								depth: formData.bandedBeamDepth,
								length: formData.length,
							},
							reinforcement: {
								top: { count: 2, diameter: 16 },
								bottom: { straight: { count: 3, diameter: 16 } },
								stirrups: { diameter: 10, spacing: 0.2, legs: 2 },
							},
							quantity: 1,
						})),
						reinforcement: {
							bottom: {
								xDirection: {
									diameter: formData.bottomMainDiameter,
									spacing: 1 / formData.bottomMainBarsPerMeter,
								},
								yDirection: {
									diameter: formData.bottomSecondaryDiameter,
									spacing: 1 / formData.bottomSecondaryBarsPerMeter,
								},
							},
						},
					};
					return calculateBandedBeamSlab(input);
				}

				default:
					return null;
			}
		} catch (error) {
			console.error("Calculation error:", error);
			return null;
		}
	}, [formData]);

	const createMutation = useMutation(
		orpc.quantities.structuralItem.create.mutationOptions({
			onSuccess: () => {
				toast.success(t("quantities.messages.itemCreated"));
				setIsAdding(false);
				setEditingItemId(null);
				resetForm();
				onSave();
			},
			onError: () => {
				toast.error(t("quantities.messages.itemCreateError"));
			},
		})
	);

	const updateMutation = useMutation(
		orpc.quantities.structuralItem.update.mutationOptions({
			onSuccess: () => {
				toast.success(t("quantities.messages.itemUpdated"));
				setIsAdding(false);
				setEditingItemId(null);
				resetForm();
				onUpdate();
			},
			onError: () => {
				toast.error(t("quantities.messages.itemUpdateError"));
			},
		})
	);

	const deleteMutation = useMutation(
		orpc.quantities.structuralItem.delete.mutationOptions({
			onSuccess: () => {
				toast.success(t("quantities.messages.itemDeleted"));
				onUpdate();
			},
			onError: () => {
				toast.error(t("quantities.messages.itemDeleteError"));
			},
		})
	);

	const handleSubmit = async () => {
		if (!formData.name || !calculations) return;

		const itemData = {
			costStudyId: studyId,
			organizationId,
			category: "slabs",
			subCategory: formData.slabType,
			name: formData.name,
			quantity: formData.quantity,
			unit: "m2",
			dimensions: {
				length: formData.length,
				width: formData.width,
				thickness: formData.thickness,
				...(formData.slabType === "ribbed" && {
					ribWidth: formData.ribWidth,
					ribSpacing: formData.ribSpacing,
					blockHeight: formData.blockHeight,
				}),
			},
			concreteVolume: calculations.concreteVolume,
			concreteType: formData.concreteType,
			steelWeight: calculations.totals.grossWeight,
			steelRatio:
				calculations.concreteVolume > 0
					? calculations.totals.grossWeight / calculations.concreteVolume
					: 0,
			materialCost:
				calculations.costs.concrete +
				calculations.costs.rebar +
				(calculations.costs.blocks || 0),
			laborCost: calculations.costs.labor,
			totalCost: calculations.costs.total,
		};

		if (editingItemId) {
			updateMutation.mutate({ ...itemData, id: editingItemId, costStudyId: studyId });
		} else {
			createMutation.mutate(itemData);
		}
	};

	const handleDelete = (id: string) => {
		if (confirm(t("quantities.messages.confirmDelete"))) {
			deleteMutation.mutate({ id, organizationId, costStudyId: studyId });
		}
	};

	const handleEdit = (item: typeof items[0]) => {
		setEditingItemId(item.id);
		setIsAdding(true);
		setFormData({
			...getDefaultFormData(),
			name: item.name,
			slabType: (item.subCategory as SlabTypeKey) || "solid",
			quantity: item.quantity,
			length: item.dimensions?.length || 0,
			width: item.dimensions?.width || 0,
			thickness: item.dimensions?.thickness || 15,
			ribWidth: item.dimensions?.ribWidth || 15,
			ribSpacing: item.dimensions?.ribSpacing || 52,
			blockHeight: item.dimensions?.blockHeight || 20,
		});
	};

	return (
		<div className="space-y-4">
			{/* جدول العناصر الموجودة */}
			{items.length > 0 && (
				<div className="border rounded-lg overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-right">{t("quantities.structural.itemName")}</TableHead>
								<TableHead className="text-right">النوع</TableHead>
								<TableHead className="text-right">{t("quantities.structural.quantity")}</TableHead>
								<TableHead className="text-right">{t("quantities.area")}</TableHead>
								<TableHead className="text-right">{t("quantities.structural.concreteVolume")}</TableHead>
								<TableHead className="text-right">{t("quantities.structural.steelWeight")}</TableHead>
								<TableHead className="w-12"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item) => (
								<TableRow key={item.id}>
									<TableCell className="font-medium">{item.name}</TableCell>
									<TableCell>
										<Badge variant="outline">
											{SLAB_TYPE_INFO[item.subCategory as SlabTypeKey]?.nameAr || item.subCategory}
										</Badge>
									</TableCell>
									<TableCell>{item.quantity}</TableCell>
									<TableCell>
										{formatNumber((item.dimensions?.length || 0) * (item.dimensions?.width || 0))} {t("quantities.units.m2")}
									</TableCell>
									<TableCell>
										{formatNumber(item.concreteVolume)} {t("quantities.units.m3")}
									</TableCell>
									<TableCell>
										{formatNumber(item.steelWeight)} {t("quantities.units.kg")}
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
								{editingItemId ? t("quantities.structural.editItem") : t("quantities.structural.addItem")}
							</h4>
							<Button variant="ghost" size="icon" onClick={() => { setIsAdding(false); setEditingItemId(null); resetForm(); }}>
								<X className="h-4 w-4" />
							</Button>
						</div>

						{/* البيانات الأساسية - صف واحد مضغوط */}
						<ElementHeaderRow
							autoNamePrefix={ELEMENT_PREFIXES.slabs}
							existingCount={items.length}
							name={formData.name}
							onNameChange={(name) => setFormData({ ...formData, name })}
							subTypes={Object.entries(SLAB_TYPE_INFO).map(([key, info]) => ({
								value: key,
								label: info.nameAr,
							}))}
							selectedSubType={formData.slabType}
							onSubTypeChange={(type) => setFormData({ ...formData, slabType: type as SlabTypeKey })}
							quantity={formData.quantity}
							onQuantityChange={(quantity) => setFormData({ ...formData, quantity })}
							concreteType={formData.concreteType}
							onConcreteTypeChange={(concreteType) => setFormData({ ...formData, concreteType })}
							showQuantity={true}
						/>

						{/* الأبعاد - للسقف الصلب والفلات والكمرات العريضة */}
						{(formData.slabType === "solid" || formData.slabType === "flat" || formData.slabType === "banded_beam") && (
							<DimensionsCard
								title="أبعاد السقف"
								dimensions={[
									{ key: "length", label: "الطول", value: formData.length, unit: "م", step: 0.1 },
									{ key: "width", label: "العرض", value: formData.width, unit: "م", step: 0.1 },
									{ key: "thickness", label: "السماكة", value: formData.thickness, unit: "سم", step: 1 },
								]}
								onDimensionChange={(key, value) => setFormData({ ...formData, [key]: value })}
								calculatedArea={formData.length * formData.width}
							/>
						)}

						{/* الأبعاد - للهوردي */}
						{formData.slabType === "ribbed" && (
							<>
								<DimensionsCard
									title="أبعاد السقف"
									dimensions={[
										{ key: "length", label: "الطول", value: formData.length, unit: "م", step: 0.1 },
										{ key: "width", label: "العرض", value: formData.width, unit: "م", step: 0.1 },
									]}
									onDimensionChange={(key, value) => setFormData({ ...formData, [key]: value })}
									calculatedArea={formData.length * formData.width}
								/>

								{/* إعدادات الهوردي */}
								<div className="border rounded-lg p-4 bg-orange-50/30">
									<h5 className="font-medium mb-3 flex items-center gap-2">
										<Package className="h-4 w-4 text-orange-600" />
										إعدادات سقف الهوردي
									</h5>
									<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
										<div className="space-y-1.5">
											<Label className="text-sm">عرض العصب (سم)</Label>
											<Select
												value={formData.ribWidth.toString()}
												onValueChange={(v) => setFormData({ ...formData, ribWidth: +v })}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{[10, 12, 15, 18, 20].map((w) => (
														<SelectItem key={w} value={w.toString()}>
															{w} سم
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-1.5">
											<Label className="text-sm">محور الأعصاب (سم)</Label>
											<Select
												value={formData.ribSpacing.toString()}
												onValueChange={(v) => setFormData({ ...formData, ribSpacing: +v })}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{[40, 45, 50, 52, 55, 60, 65].map((s) => (
														<SelectItem key={s} value={s.toString()}>
															{s} سم
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-1.5">
											<Label className="text-sm">ارتفاع البلوك (سم)</Label>
											<Select
												value={formData.blockHeight.toString()}
												onValueChange={(v) => setFormData({ ...formData, blockHeight: +v })}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{HORDI_BLOCK_SIZES.map((b) => (
														<SelectItem key={b.nameAr} value={b.height.toString()}>
															{b.height} سم ({b.nameAr})
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-1.5">
											<Label className="text-sm">سماكة الطبقة العلوية (سم)</Label>
											<Select
												value={formData.toppingThickness.toString()}
												onValueChange={(v) => setFormData({ ...formData, toppingThickness: +v })}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{COMMON_THICKNESSES.topping.map((t) => (
														<SelectItem key={t} value={t.toString()}>
															{t} سم
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="bg-orange-100/50 rounded-lg p-3 flex flex-col justify-center items-center">
											<span className="text-xs text-muted-foreground">السماكة الكلية</span>
											<span className="font-bold text-lg text-orange-700">
												{formData.blockHeight + formData.toppingThickness} سم
											</span>
										</div>
									</div>
								</div>
							</>
						)}

						{/* الأبعاد - للهولوكور */}
						{formData.slabType === "hollow_core" && (
							<>
								<DimensionsCard
									title="أبعاد السقف"
									dimensions={[
										{ key: "length", label: "الطول", value: formData.length, unit: "م", step: 0.1 },
										{ key: "width", label: "العرض", value: formData.width, unit: "م", step: 0.1 },
									]}
									onDimensionChange={(key, value) => setFormData({ ...formData, [key]: value })}
									calculatedArea={formData.length * formData.width}
								/>

								{/* إعدادات الهولوكور */}
								<div className="border rounded-lg p-4 bg-green-50/30">
									<h5 className="font-medium mb-3 flex items-center gap-2">
										<LayoutGrid className="h-4 w-4 text-green-600" />
										إعدادات سقف الهولوكور
									</h5>
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
										<div className="space-y-1.5">
											<Label className="text-sm">عرض اللوح (م)</Label>
											<Select
												value={formData.panelWidth.toString()}
												onValueChange={(v) => setFormData({ ...formData, panelWidth: +v })}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{[0.6, 1.0, 1.2].map((w) => (
														<SelectItem key={w} value={w.toString()}>
															{w} م
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-1.5">
											<Label className="text-sm">سماكة اللوح (سم)</Label>
											<Select
												value={formData.panelThickness.toString()}
												onValueChange={(v) => setFormData({ ...formData, panelThickness: +v })}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{COMMON_THICKNESSES.hollow_core.map((t) => (
														<SelectItem key={t} value={t.toString()}>
															{t} سم
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-1.5">
											<Label className="text-sm">سماكة الطبقة العلوية (سم)</Label>
											<Select
												value={formData.toppingThickness.toString()}
												onValueChange={(v) => setFormData({ ...formData, toppingThickness: +v })}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{COMMON_THICKNESSES.topping.map((t) => (
														<SelectItem key={t} value={t.toString()}>
															{t} سم
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="bg-green-100/50 rounded-lg p-3 flex flex-col justify-center items-center">
											<span className="text-xs text-muted-foreground">عدد الألواح</span>
											<span className="font-bold text-lg text-green-700">
												{Math.ceil(formData.width / formData.panelWidth)} لوح
											</span>
										</div>
									</div>
								</div>
							</>
						)}

						{/* إعدادات الفلات سلاب */}
						{formData.slabType === "flat" && (
							<div className="border rounded-lg p-4 bg-purple-50/30">
								<div className="flex items-center gap-2 mb-3">
									<input
										type="checkbox"
										id="hasDropPanels"
										checked={formData.hasDropPanels}
										onChange={(e) => setFormData({ ...formData, hasDropPanels: e.target.checked })}
										className="rounded border-purple-500"
									/>
									<Label htmlFor="hasDropPanels" className="text-sm font-medium text-purple-700 cursor-pointer">
										يوجد تكثيف (Drop Panels)
									</Label>
								</div>
								{formData.hasDropPanels && (
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
										<div className="space-y-1.5">
											<Label className="text-sm">طول التكثيف (م)</Label>
											<Input
												type="number"
												step="0.1"
												value={formData.dropPanelLength}
												onChange={(e) => setFormData({ ...formData, dropPanelLength: +e.target.value })}
											/>
										</div>
										<div className="space-y-1.5">
											<Label className="text-sm">عرض التكثيف (م)</Label>
											<Input
												type="number"
												step="0.1"
												value={formData.dropPanelWidth}
												onChange={(e) => setFormData({ ...formData, dropPanelWidth: +e.target.value })}
											/>
										</div>
										<div className="space-y-1.5">
											<Label className="text-sm">عمق إضافي (م)</Label>
											<Input
												type="number"
												step="0.05"
												value={formData.dropPanelDepth}
												onChange={(e) => setFormData({ ...formData, dropPanelDepth: +e.target.value })}
											/>
										</div>
										<div className="space-y-1.5">
											<Label className="text-sm">عدد التكثيفات</Label>
											<Input
												type="number"
												min={1}
												value={formData.dropPanelCount}
												onChange={(e) => setFormData({ ...formData, dropPanelCount: +e.target.value })}
											/>
										</div>
									</div>
								)}
							</div>
						)}

						{/* إعدادات الكمرات العريضة */}
						{formData.slabType === "banded_beam" && (
							<div className="border rounded-lg p-4 bg-indigo-50/30">
								<h5 className="font-medium mb-3 text-indigo-700">إعدادات الكمرات العريضة</h5>
								<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
									<div className="space-y-1.5">
										<Label className="text-sm">عرض الكمرة (م)</Label>
										<Input
											type="number"
											step="0.1"
											value={formData.bandedBeamWidth}
											onChange={(e) => setFormData({ ...formData, bandedBeamWidth: +e.target.value })}
										/>
									</div>
									<div className="space-y-1.5">
										<Label className="text-sm">عمق الكمرة (م)</Label>
										<Input
											type="number"
											step="0.05"
											value={formData.bandedBeamDepth}
											onChange={(e) => setFormData({ ...formData, bandedBeamDepth: +e.target.value })}
										/>
									</div>
									<div className="space-y-1.5">
										<Label className="text-sm">عدد الكمرات</Label>
										<Input
											type="number"
											min={1}
											value={formData.bandedBeamCount}
											onChange={(e) => setFormData({ ...formData, bandedBeamCount: +e.target.value })}
										/>
									</div>
								</div>
							</div>
						)}

						{/* تسليح السقف الصلب */}
						{(formData.slabType === "solid" || formData.slabType === "flat" || formData.slabType === "banded_beam") && (
							<div className="border-t pt-4 space-y-4">
								<h4 className="font-medium flex items-center gap-2">
									<span className="w-2 h-2 rounded-full bg-primary" />
									تسليح السقف
								</h4>

								{/* الشبكة السفلية */}
								<div className="space-y-3">
									<h5 className="text-sm font-medium text-blue-700">الشبكة السفلية (الفرش)</h5>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<RebarMeshInput
											title="الحديد الرئيسي"
											direction="الاتجاه الطويل"
											diameter={formData.bottomMainDiameter}
											onDiameterChange={(d) => setFormData({ ...formData, bottomMainDiameter: d })}
											barsPerMeter={formData.bottomMainBarsPerMeter}
											onBarsPerMeterChange={(n) => setFormData({ ...formData, bottomMainBarsPerMeter: n })}
											colorScheme="blue"
											availableDiameters={REBAR_DIAMETERS.filter(d => d >= 10 && d <= 16)}
											availableBarsPerMeter={[5, 6, 7, 8, 9, 10]}
										/>
										<RebarMeshInput
											title="الحديد الثانوي"
											direction="الاتجاه القصير"
											diameter={formData.bottomSecondaryDiameter}
											onDiameterChange={(d) => setFormData({ ...formData, bottomSecondaryDiameter: d })}
											barsPerMeter={formData.bottomSecondaryBarsPerMeter}
											onBarsPerMeterChange={(n) => setFormData({ ...formData, bottomSecondaryBarsPerMeter: n })}
											colorScheme="blue"
											availableDiameters={REBAR_DIAMETERS.filter(d => d >= 8 && d <= 14)}
											availableBarsPerMeter={[4, 5, 6, 7, 8]}
										/>
									</div>
								</div>

								{/* الشبكة العلوية */}
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<input
											type="checkbox"
											id="hasTopMesh"
											checked={formData.hasTopMesh}
											onChange={(e) => setFormData({ ...formData, hasTopMesh: e.target.checked })}
											className="rounded border-green-500"
										/>
										<Label htmlFor="hasTopMesh" className="text-sm font-medium text-green-700 cursor-pointer">
											الشبكة العلوية (الغطاء) - للسحب السالب
										</Label>
									</div>
									{formData.hasTopMesh && (
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
											<RebarMeshInput
												title="الحديد الرئيسي"
												direction="الاتجاه الطويل"
												diameter={formData.topMainDiameter}
												onDiameterChange={(d) => setFormData({ ...formData, topMainDiameter: d })}
												barsPerMeter={formData.topMainBarsPerMeter}
												onBarsPerMeterChange={(n) => setFormData({ ...formData, topMainBarsPerMeter: n })}
												colorScheme="green"
												availableDiameters={REBAR_DIAMETERS.filter(d => d >= 8 && d <= 14)}
												availableBarsPerMeter={[4, 5, 6, 7, 8]}
											/>
											<RebarMeshInput
												title="الحديد الثانوي"
												direction="الاتجاه القصير"
												diameter={formData.topSecondaryDiameter}
												onDiameterChange={(d) => setFormData({ ...formData, topSecondaryDiameter: d })}
												barsPerMeter={formData.topSecondaryBarsPerMeter}
												onBarsPerMeterChange={(n) => setFormData({ ...formData, topSecondaryBarsPerMeter: n })}
												colorScheme="green"
												availableDiameters={REBAR_DIAMETERS.filter(d => d >= 8 && d <= 12)}
												availableBarsPerMeter={[3, 4, 5, 6]}
											/>
										</div>
									)}
								</div>
							</div>
						)}

						{/* تسليح الهوردي */}
						{formData.slabType === "ribbed" && (
							<div className="border-t pt-4 space-y-4">
								<h4 className="font-medium flex items-center gap-2">
									<span className="w-2 h-2 rounded-full bg-orange-500" />
									تسليح الأعصاب
								</h4>

								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div className="space-y-1.5">
										<Label className="text-sm text-blue-700">عدد أسياخ القاع</Label>
										<Select
											value={formData.ribBottomBars.toString()}
											onValueChange={(v) => setFormData({ ...formData, ribBottomBars: +v })}
										>
											<SelectTrigger className="border-blue-200">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{[2, 3, 4].map((n) => (
													<SelectItem key={n} value={n.toString()}>
														{n} أسياخ
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-1.5">
										<Label className="text-sm text-blue-700">قطر سيخ القاع</Label>
										<Select
											value={formData.ribBarDiameter.toString()}
											onValueChange={(v) => setFormData({ ...formData, ribBarDiameter: +v })}
										>
											<SelectTrigger className="border-blue-200">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{REBAR_DIAMETERS.filter((d) => d >= 10 && d <= 16).map((d) => (
													<SelectItem key={d} value={d.toString()}>
														{d} مم
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-1.5">
										<Label className="text-sm text-green-700">عدد أسياخ الرأس</Label>
										<Select
											value={formData.ribTopBars.toString()}
											onValueChange={(v) => setFormData({ ...formData, ribTopBars: +v })}
										>
											<SelectTrigger className="border-green-200">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{[1, 2, 3].map((n) => (
													<SelectItem key={n} value={n.toString()}>
														{n} أسياخ
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-1.5">
										<Label className="text-sm text-green-700">قطر سيخ الرأس</Label>
										<Select
											value={formData.ribTopBarDiameter.toString()}
											onValueChange={(v) => setFormData({ ...formData, ribTopBarDiameter: +v })}
										>
											<SelectTrigger className="border-green-200">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{REBAR_DIAMETERS.filter((d) => d >= 8 && d <= 12).map((d) => (
													<SelectItem key={d} value={d.toString()}>
														{d} مم
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

								{/* كانات العصب */}
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<input
											type="checkbox"
											id="hasRibStirrup"
											checked={formData.hasRibStirrup}
											onChange={(e) => setFormData({ ...formData, hasRibStirrup: e.target.checked })}
											className="rounded border-gray-500"
										/>
										<Label htmlFor="hasRibStirrup" className="text-sm font-medium cursor-pointer">
											كانات العصب
										</Label>
									</div>
									{formData.hasRibStirrup && (
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-1.5">
												<Label className="text-sm">قطر الكانة</Label>
												<Select
													value={formData.ribStirrupDiameter.toString()}
													onValueChange={(v) => setFormData({ ...formData, ribStirrupDiameter: +v })}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{REBAR_DIAMETERS.filter((d) => d >= 6 && d <= 10).map((d) => (
															<SelectItem key={d} value={d.toString()}>
																{d} مم
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-1.5">
												<Label className="text-sm">تباعد الكانات (مم)</Label>
												<Select
													value={formData.ribStirrupSpacing.toString()}
													onValueChange={(v) => setFormData({ ...formData, ribStirrupSpacing: +v })}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{[150, 200, 250, 300].map((s) => (
															<SelectItem key={s} value={s.toString()}>
																{s} مم
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</div>
									)}
								</div>

								{/* تسليح الطبقة العلوية */}
								<div className="space-y-3 border-t pt-3">
									<h5 className="text-sm font-medium text-blue-700">تسليح الطبقة العلوية</h5>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<RebarMeshInput
											title="الشبكة العلوية"
											direction="الاتجاه الطويل"
											diameter={formData.bottomSecondaryDiameter}
											onDiameterChange={(d) => setFormData({ ...formData, bottomSecondaryDiameter: d })}
											barsPerMeter={formData.bottomSecondaryBarsPerMeter}
											onBarsPerMeterChange={(n) => setFormData({ ...formData, bottomSecondaryBarsPerMeter: n })}
											colorScheme="blue"
											availableDiameters={REBAR_DIAMETERS.filter(d => d >= 6 && d <= 10)}
											availableBarsPerMeter={[4, 5, 6, 7]}
										/>
									</div>
								</div>
							</div>
						)}

						{/* نتائج الحساب */}
						{calculations && (
							<div className="bg-muted/50 rounded-lg p-4 space-y-4">
								<div className="flex items-center gap-2 mb-3">
									<Calculator className="h-5 w-5 text-primary" />
									<h4 className="font-medium">{t("quantities.calculations.results")}</h4>
								</div>

								{/* البلوكات - للهوردي */}
								{calculations.blocksCount && calculations.blocksCount > 0 && (
									<div className="bg-orange-100/50 rounded p-3">
										<div className="flex items-center gap-2 text-orange-700">
											<Package className="h-4 w-4" />
											<span className="font-medium">
												عدد البلوكات: {formatNumber(calculations.blocksCount, 0)} بلوكة
											</span>
										</div>
									</div>
								)}

								{/* خيار عرض الشدات */}
								<div className="flex items-center justify-between border rounded-lg p-3 bg-background">
									<div className="flex items-center gap-2">
										<input
											type="checkbox"
											id="showFormwork"
											checked={showFormwork}
											onChange={(e) => setShowFormwork(e.target.checked)}
											className="rounded"
										/>
										<Label htmlFor="showFormwork" className="text-sm font-medium cursor-pointer">
											إظهار حساب الشدات
										</Label>
									</div>
									{showFormwork && calculations.formworkArea > 0 && (
										<div className="flex items-center gap-2 text-blue-600">
											<LayoutGrid className="h-4 w-4" />
											<span className="font-bold">
												{formatNumber(calculations.formworkArea)} {t("quantities.units.m2")}
											</span>
										</div>
									)}
								</div>

								<CalculationResultsPanel
									concreteVolume={calculations.concreteVolume}
									totals={calculations.totals}
									cuttingDetails={calculations.rebarDetails.map((detail) => ({
										description: detail.description,
										diameter: detail.diameter,
										barLength: detail.barLength,
										barCount: detail.barCount,
										stocksNeeded: detail.stocksNeeded,
										weight: detail.weight,
										grossWeight: detail.weight,
										wastePercentage: detail.wastePercentage,
									}))}
									showCuttingDetails={showCuttingDetails}
									onToggleCuttingDetails={setShowCuttingDetails}
								/>
							</div>
						)}

						{/* أزرار الحفظ والإلغاء */}
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => { setIsAdding(false); setEditingItemId(null); resetForm(); }}>
								{t("quantities.form.cancel")}
							</Button>
							<Button
								onClick={handleSubmit}
								disabled={createMutation.isPending || updateMutation.isPending || !formData.name || !calculations}
							>
								<Save className="h-4 w-4 ml-2" />
								{editingItemId ? t("quantities.structural.updateItem") : t("quantities.structural.saveItem")}
							</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<Button
					variant="outline"
					className="w-full border-dashed"
					onClick={() => setIsAdding(true)}
				>
					<Plus className="h-4 w-4 ml-2" />
					{t("quantities.structural.addItem")}
				</Button>
			)}

			{/* ملخص العناصر */}
			{items.length > 0 && (
				<div className="bg-muted/30 rounded-lg p-4">
					<h4 className="font-medium mb-2">{t("quantities.summary.totalItems")}</h4>
					<div className="grid grid-cols-3 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">إجمالي المساحة:</span>
							<p className="font-bold">
								{formatNumber(items.reduce((sum, i) => sum + (i.dimensions?.length || 0) * (i.dimensions?.width || 0) * i.quantity, 0))} {t("quantities.units.m2")}
							</p>
						</div>
						<div>
							<span className="text-muted-foreground">{t("quantities.summary.totalConcrete")}:</span>
							<p className="font-bold">
								{formatNumber(items.reduce((sum, i) => sum + i.concreteVolume, 0))} {t("quantities.units.m3")}
							</p>
						</div>
						<div>
							<span className="text-muted-foreground">{t("quantities.summary.totalRebar")}:</span>
							<p className="font-bold">
								{formatNumber(items.reduce((sum, i) => sum + i.steelWeight, 0))} {t("quantities.units.kg")}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
