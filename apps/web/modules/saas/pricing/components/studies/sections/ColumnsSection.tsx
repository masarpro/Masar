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
	Plus,
	Save,
	Trash2,
	Pencil,
	Calculator,
	X,
	ChevronDown,
	ChevronLeft,
	Building2,
	Copy,
	Layers,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { toast } from "sonner";
import { calculateColumn } from "../../../lib/calculations";
import { getRebarWeightPerMeter } from "../../../lib/structural-calculations";
import { formatNumber, ELEMENT_PREFIXES } from "../../../lib/utils";
import { REBAR_DIAMETERS, STOCK_LENGTHS } from "../../../constants/prices";
import {
	ElementHeaderRow,
	DimensionsCard,
	RebarBarsInput,
	StirrupsInput,
	CalculationResultsPanel,
} from "../shared";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ItemType {
	id: string;
	name: string;
	subCategory?: string | null;
	quantity: number;
	dimensions: Record<string, number>;
	concreteVolume: number;
	steelWeight: number;
	totalCost: number;
}

interface ColumnsSectionProps {
	studyId: string;
	organizationId: string;
	items: ItemType[];
	onSave: () => void;
	onUpdate: () => void;
	specs?: { concreteType: string; steelGrade: string };
}

interface FloorDef {
	id: string;
	label: string;
	icon: string;
	hasNeckColumns?: boolean;
	isRepeated?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const FLOORS: FloorDef[] = [
	{ id: "ground", label: "الدور الأرضي", icon: "🏠", hasNeckColumns: true },
	{ id: "first", label: "الدور الأول", icon: "🏢" },
	{ id: "mezzanine", label: "الميزانين", icon: "📐" },
	{ id: "repeated", label: "الدور المتكرر", icon: "🔁", isRepeated: true },
	{ id: "annex", label: "الملحق", icon: "🏗️" },
];

const NECK_HEIGHT_PRESETS = [1, 1.5, 2, 3, 4];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function calculateCuttingDetails(
	barLength: number,
	barCount: number,
	diameter: number,
	description: string,
) {
	const stockLength = STOCK_LENGTHS[diameter] || 12;
	const cutsPerStock = Math.floor(stockLength / barLength) || 1;
	const stocksNeeded = Math.ceil(barCount / cutsPerStock);
	const wastePerStock = stockLength - cutsPerStock * barLength;
	const totalWaste = stocksNeeded * wastePerStock;
	const totalLength = barCount * barLength;
	const grossLength = stocksNeeded * stockLength;
	const wastePercentage =
		grossLength > 0 ? (totalWaste / grossLength) * 100 : 0;
	const weight = totalLength * getRebarWeightPerMeter(diameter);

	return {
		description,
		diameter,
		barLength: Number(barLength.toFixed(2)),
		barCount,
		stocksNeeded,
		wastePerStock: Number(wastePerStock.toFixed(2)),
		totalWaste: Number(totalWaste.toFixed(2)),
		wastePercentage: Number(wastePercentage.toFixed(1)),
		weight: Number(weight.toFixed(2)),
		stockLength,
	};
}

function computeFullCalc(params: {
	quantity: number;
	width: number;
	depth: number;
	height: number;
	mainBarsCount: number;
	mainBarDiameter: number;
	stirrupDiameter: number;
	stirrupSpacing: number;
	concreteType: string;
}) {
	const baseCalc = calculateColumn(params);

	const mainBarLength = params.height + 0.8;
	const widthM = params.width / 100;
	const depthM = params.depth / 100;
	const stirrupPerimeter = 2 * (widthM + depthM - 0.08) + 0.3;
	const stirrupsCount =
		Math.ceil((params.height * 1000) / params.stirrupSpacing) + 1;

	const cuttingDetails = [
		calculateCuttingDetails(
			mainBarLength,
			params.mainBarsCount * params.quantity,
			params.mainBarDiameter,
			"حديد رئيسي",
		),
		calculateCuttingDetails(
			stirrupPerimeter,
			stirrupsCount * params.quantity,
			params.stirrupDiameter,
			"كانات",
		),
	];

	const netWeight = cuttingDetails.reduce((sum, d) => sum + d.weight, 0);
	const grossWeight = cuttingDetails.reduce(
		(sum, d) =>
			sum +
			d.stocksNeeded * d.stockLength * getRebarWeightPerMeter(d.diameter),
		0,
	);
	const wasteWeight = grossWeight - netWeight;
	const wastePercentage =
		grossWeight > 0 ? (wasteWeight / grossWeight) * 100 : 0;

	const stocksMap = new Map<
		number,
		{ diameter: number; count: number; length: number }
	>();
	cuttingDetails.forEach((d) => {
		const existing = stocksMap.get(d.diameter);
		if (existing) {
			existing.count += d.stocksNeeded;
		} else {
			stocksMap.set(d.diameter, {
				diameter: d.diameter,
				count: d.stocksNeeded,
				length: d.stockLength,
			});
		}
	});

	return {
		...baseCalc,
		cuttingDetails,
		totals: {
			netWeight: Number(netWeight.toFixed(2)),
			grossWeight: Number(grossWeight.toFixed(2)),
			wasteWeight: Number(wasteWeight.toFixed(2)),
			wastePercentage: Number(wastePercentage.toFixed(1)),
			stocksNeeded: Array.from(stocksMap.values()),
		},
	};
}

// ═══════════════════════════════════════════════════════════════
// مكون الدور الواحد (بدون رقاب — الرقاب منفصلة)
// ═══════════════════════════════════════════════════════════════

interface FloorColumnsPanelProps {
	floor: FloorDef;
	studyId: string;
	organizationId: string;
	items: ItemType[];
	specs?: { concreteType: string; steelGrade: string };
	onSave: () => void;
	onUpdate: () => void;
	allItemsCount: number;
}

function FloorColumnsPanel({
	floor,
	studyId,
	organizationId,
	items,
	specs,
	onSave,
	onUpdate,
	allItemsCount,
}: FloorColumnsPanelProps) {
	const t = useTranslations();
	const [isAdding, setIsAdding] = useState(false);
	const [editingItemId, setEditingItemId] = useState<string | null>(null);
	const [showCuttingDetails, setShowCuttingDetails] = useState(false);

	const [formData, setFormData] = useState({
		name: "",
		quantity: 1,
		width: 30,
		depth: 30,
		height: 3,
		mainBarsCount: 8,
		mainBarDiameter: 16,
		stirrupDiameter: 8,
		stirrupSpacing: 150,
	});

	const calculations = useMemo(() => {
		if (formData.width <= 0 || formData.depth <= 0 || formData.height <= 0)
			return null;
		return computeFullCalc({
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
			width: 30,
			depth: 30,
			height: 3,
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
			(updateMutation as any).mutate({
				...itemData,
				id: editingItemId,
				costStudyId: studyId,
			});
		} else {
			(createMutation as any).mutate(itemData);
		}
	};

	const handleDelete = (id: string) => {
		if (confirm(t("pricing.studies.messages.confirmDelete"))) {
			(deleteMutation as any).mutate({
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
			width: item.dimensions?.width || 30,
			depth: item.dimensions?.depth || 30,
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
										{item.dimensions?.width || 0}×
										{item.dimensions?.depth || 0}{" "}
										{t("pricing.studies.units.cm")} ×{" "}
										{item.dimensions?.height || 0}{" "}
										{t("pricing.studies.units.m")}
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

						<DimensionsCard
							title="أبعاد العمود"
							dimensions={[
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
									label: "الارتفاع",
									value: formData.height,
									unit: "م",
									step: 0.1,
									min: 0.5,
								},
							]}
							onDimensionChange={(key, value) =>
								setFormData({ ...formData, [key]: value })
							}
							calculatedVolume={
								(formData.width / 100) *
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
									availableBarsCount={[4, 6, 8, 10, 12, 14, 16]}
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

// ═══════════════════════════════════════════════════════════════
// رقاب الأعمدة — تُنسخ تلقائياً من أعمدة الدور الأرضي
// ═══════════════════════════════════════════════════════════════

interface NeckColumnsSectionProps {
	groundColumns: ItemType[];
	neckHeight: number;
	onNeckHeightChange: (h: number) => void;
	onDisable: () => void;
	specs?: { concreteType: string; steelGrade: string };
}

function NeckColumnsSection({
	groundColumns,
	neckHeight,
	onNeckHeightChange,
	onDisable,
	specs,
}: NeckColumnsSectionProps) {
	const t = useTranslations();
	const [showCuttingDetails, setShowCuttingDetails] = useState(false);

	const neckCalcs = useMemo(() => {
		return groundColumns.map((col) => {
			const width = col.dimensions?.width || 30;
			const depth = col.dimensions?.depth || 30;
			const mainBarsCount = col.dimensions?.mainBarsCount || 8;
			const mainBarDiameter = col.dimensions?.mainBarDiameter || 16;
			const stirrupDiameter = col.dimensions?.stirrupDiameter || 8;
			const stirrupSpacing = col.dimensions?.stirrupSpacing || 150;

			const calc = computeFullCalc({
				quantity: col.quantity,
				width,
				depth,
				height: neckHeight,
				mainBarsCount,
				mainBarDiameter,
				stirrupDiameter,
				stirrupSpacing,
				concreteType: specs?.concreteType || "C35",
			});

			return {
				name: col.name,
				quantity: col.quantity,
				width,
				depth,
				mainBarsCount,
				mainBarDiameter,
				stirrupDiameter,
				stirrupSpacing,
				calc,
			};
		});
	}, [groundColumns, neckHeight, specs]);

	const totalConcrete = neckCalcs.reduce(
		(s, n) => s + n.calc.concreteVolume,
		0,
	);
	const totalSteel = neckCalcs.reduce(
		(s, n) => s + n.calc.totals.grossWeight,
		0,
	);

	if (groundColumns.length === 0) {
		return (
			<div className="rounded-xl border-2 border-dashed border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/10 p-6 text-center">
				<p className="text-sm text-muted-foreground">
					أضف أعمدة الدور الأرضي أولاً ليتم نسخها كرقاب تلقائياً
				</p>
			</div>
		);
	}

	return (
		<Card className="border-amber-200/50 bg-amber-50/10 dark:bg-amber-950/10">
			<CardContent className="p-4 space-y-4">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="text-lg">⬇️</span>
						<h4 className="font-semibold">رقاب الأعمدة</h4>
						<Badge
							variant="secondary"
							className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
						>
							{groundColumns.length} رقبة
						</Badge>
					</div>
					<Button
						variant="ghost"
						size="sm"
						className="text-muted-foreground hover:text-destructive"
						onClick={onDisable}
					>
						<X className="h-4 w-4 ml-1" />
						إزالة
					</Button>
				</div>

				<p className="text-xs text-muted-foreground">
					الرقاب تُنسخ تلقائياً من أعمدة الدور الأرضي بنفس الأبعاد والتسليح
					— فقط الارتفاع يتم تغييره
				</p>

				{/* Height selector */}
				<div className="flex flex-wrap items-center gap-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 rounded-lg p-3">
					<Label className="font-medium text-sm whitespace-nowrap">
						ارتفاع الرقبة:
					</Label>
					<div className="flex gap-1.5">
						{NECK_HEIGHT_PRESETS.map((h) => (
							<Button
								key={h}
								variant={neckHeight === h ? "primary" : "outline"}
								size="sm"
								className={`h-8 px-3 ${neckHeight === h ? "bg-amber-600 hover:bg-amber-700" : ""}`}
								onClick={() => onNeckHeightChange(h)}
							>
								{h} م
							</Button>
						))}
					</div>
					<div className="flex items-center gap-1.5">
						<Input
							type="number"
							min={0.5}
							max={10}
							step={0.5}
							value={neckHeight}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								onNeckHeightChange(
									Math.max(0.5, parseFloat(e.target.value) || 1),
								)
							}
							className="w-20 h-8 text-center"
						/>
						<span className="text-xs text-muted-foreground">م</span>
					</div>
				</div>

				{/* Table */}
				<div className="border rounded-lg overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-right">رقبة العمود</TableHead>
								<TableHead className="text-right">العدد</TableHead>
								<TableHead className="text-right">الأبعاد</TableHead>
								<TableHead className="text-right">التسليح</TableHead>
								<TableHead className="text-right">الخرسانة</TableHead>
								<TableHead className="text-right">الحديد</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{neckCalcs.map((neck, idx) => (
								<TableRow key={idx} className="bg-amber-50/20 dark:bg-amber-950/10">
									<TableCell className="font-medium">
										رقبة {neck.name}
									</TableCell>
									<TableCell>{neck.quantity}</TableCell>
									<TableCell className="text-sm">
										{neck.width}×{neck.depth} سم × {neckHeight} م
									</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										{neck.mainBarsCount}∅{neck.mainBarDiameter} + ك∅
										{neck.stirrupDiameter}/{neck.stirrupSpacing}
									</TableCell>
									<TableCell>
										{formatNumber(neck.calc.concreteVolume)} م³
									</TableCell>
									<TableCell>
										{formatNumber(neck.calc.totals.grossWeight)} كجم
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				{/* Cutting details - expandable */}
				<div className="space-y-2">
					<Button
						variant="ghost"
						size="sm"
						className="gap-1.5 text-xs"
						onClick={() => setShowCuttingDetails(!showCuttingDetails)}
					>
						{showCuttingDetails ? (
							<ChevronDown className="h-3 w-3" />
						) : (
							<ChevronLeft className="h-3 w-3" />
						)}
						تفاصيل القص والحديد
					</Button>

					{showCuttingDetails && (
						<div className="space-y-3">
							{neckCalcs.map((neck, idx) => (
								<div key={idx} className="border rounded-lg p-3 bg-background">
									<h5 className="text-sm font-medium mb-2">
										رقبة {neck.name} ({neck.quantity} رقبة)
									</h5>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="text-right text-xs">
													الوصف
												</TableHead>
												<TableHead className="text-right text-xs">
													∅ القطر
												</TableHead>
												<TableHead className="text-right text-xs">
													طول السيخ
												</TableHead>
												<TableHead className="text-right text-xs">
													العدد
												</TableHead>
												<TableHead className="text-right text-xs">
													أسياخ مطلوبة
												</TableHead>
												<TableHead className="text-right text-xs">
													الهالك
												</TableHead>
												<TableHead className="text-right text-xs">
													الوزن
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{neck.calc.cuttingDetails.map((d, di) => (
												<TableRow key={di}>
													<TableCell className="text-xs">
														{d.description}
													</TableCell>
													<TableCell className="text-xs">
														{d.diameter} مم
													</TableCell>
													<TableCell className="text-xs">
														{d.barLength} م
													</TableCell>
													<TableCell className="text-xs">
														{d.barCount}
													</TableCell>
													<TableCell className="text-xs">
														{d.stocksNeeded} × {d.stockLength}م
													</TableCell>
													<TableCell className="text-xs">
														{d.wastePercentage}%
													</TableCell>
													<TableCell className="text-xs">
														{formatNumber(d.weight)} كجم
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Totals */}
				<div className="bg-amber-100/50 dark:bg-amber-900/20 rounded-lg p-3">
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">
								إجمالي خرسانة الرقاب:
							</span>
							<span className="font-bold mr-1">
								{formatNumber(totalConcrete)} م³
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">
								إجمالي حديد الرقاب:
							</span>
							<span className="font-bold mr-1">
								{formatNumber(totalSteel)} كجم
							</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// ═══════════════════════════════════════════════════════════════
// المكون الرئيسي
// ═══════════════════════════════════════════════════════════════

export function ColumnsSection({
	studyId,
	organizationId,
	items,
	onSave,
	onUpdate,
	specs,
}: ColumnsSectionProps) {
	const t = useTranslations();
	const [expandedFloors, setExpandedFloors] = useState<string[]>(["ground"]);
	const [repeatedCount, setRepeatedCount] = useState(3);
	const [expandedRepeatedFloors, setExpandedRepeatedFloors] = useState<
		number[]
	>([]);
	const [neckEnabled, setNeckEnabled] = useState(false);
	const [neckHeight, setNeckHeight] = useState(1);

	const toggleFloor = (floorId: string) => {
		setExpandedFloors((prev) =>
			prev.includes(floorId)
				? prev.filter((f) => f !== floorId)
				: [...prev, floorId],
		);
	};

	const toggleRepeatedFloor = (index: number) => {
		setExpandedRepeatedFloors((prev) =>
			prev.includes(index)
				? prev.filter((i) => i !== index)
				: [...prev, index],
		);
	};

	// فلترة عناصر الرقاب القديمة (الرقاب الآن محسوبة تلقائياً)
	const activeItems = useMemo(
		() => items.filter((i) => !i.subCategory?.endsWith("_neck")),
		[items],
	);

	// العناصر حسب الدور
	const getFloorItems = (floorId: string) => {
		const floorItems = activeItems.filter((i) => i.subCategory === floorId);
		if (floorId === "ground") {
			const allFloorIds = FLOORS.map((f) => f.id);
			const unassigned = activeItems.filter(
				(i) =>
					!i.subCategory ||
					!allFloorIds.some((fid) => i.subCategory === fid),
			);
			return [...floorItems, ...unassigned];
		}
		return floorItems;
	};

	const groundColumns = getFloorItems("ground");
	const repeatedTemplateItems = getFloorItems("repeated");

	// حساب إجمالي الرقاب
	const neckTotals = useMemo(() => {
		if (!neckEnabled || groundColumns.length === 0)
			return { concrete: 0, steel: 0 };
		let concrete = 0;
		let steel = 0;
		groundColumns.forEach((col) => {
			const calc = computeFullCalc({
				quantity: col.quantity,
				width: col.dimensions?.width || 30,
				depth: col.dimensions?.depth || 30,
				height: neckHeight,
				mainBarsCount: col.dimensions?.mainBarsCount || 8,
				mainBarDiameter: col.dimensions?.mainBarDiameter || 16,
				stirrupDiameter: col.dimensions?.stirrupDiameter || 8,
				stirrupSpacing: col.dimensions?.stirrupSpacing || 150,
				concreteType: specs?.concreteType || "C35",
			});
			concrete += calc.concreteVolume;
			steel += calc.totals.grossWeight;
		});
		return { concrete, steel };
	}, [neckEnabled, groundColumns, neckHeight, specs]);

	// حساب الإجمالي الحقيقي
	const nonRepeatedActive = activeItems.filter(
		(i) => i.subCategory !== "repeated",
	);
	const repeatedConcrete =
		repeatedTemplateItems.reduce((s, i) => s + i.concreteVolume, 0) *
		repeatedCount;
	const repeatedSteel =
		repeatedTemplateItems.reduce((s, i) => s + i.steelWeight, 0) *
		repeatedCount;
	const grandTotalConcrete =
		nonRepeatedActive.reduce((s, i) => s + i.concreteVolume, 0) +
		repeatedConcrete +
		neckTotals.concrete;
	const grandTotalSteel =
		nonRepeatedActive.reduce((s, i) => s + i.steelWeight, 0) +
		repeatedSteel +
		neckTotals.steel;

	return (
		<div className="space-y-3">
			{/* أقسام الأدوار */}
			{FLOORS.map((floor) => {
				const floorItems = getFloorItems(floor.id);
				const isExpanded = expandedFloors.includes(floor.id);
				const hasItems = floorItems.length > 0;

				const displayConcrete = floor.isRepeated
					? floorItems.reduce((s, i) => s + i.concreteVolume, 0) *
						repeatedCount
					: floorItems.reduce((s, i) => s + i.concreteVolume, 0);
				const displaySteel = floor.isRepeated
					? floorItems.reduce((s, i) => s + i.steelWeight, 0) * repeatedCount
					: floorItems.reduce((s, i) => s + i.steelWeight, 0);

				return (
					<div
						key={floor.id}
						className={`border rounded-lg overflow-hidden transition-all ${
							hasItems
								? "border-blue-200/50 bg-blue-50/20 dark:bg-blue-950/10"
								: "border-border"
						} ${floor.isRepeated && hasItems ? "border-purple-300/50 bg-purple-50/20 dark:bg-purple-950/10" : ""}`}
					>
						{/* رأس الدور */}
						<button
							type="button"
							className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
							onClick={() => toggleFloor(floor.id)}
						>
							<div className="flex items-center gap-3">
								{isExpanded ? (
									<ChevronDown className="h-4 w-4 text-muted-foreground" />
								) : (
									<ChevronLeft className="h-4 w-4 text-muted-foreground" />
								)}
								<span className="text-lg">{floor.icon}</span>
								<span className="font-semibold">{floor.label}</span>
								{floor.isRepeated && repeatedCount > 1 && (
									<Badge
										variant="default"
										className="bg-purple-600 text-xs"
									>
										{repeatedCount} أدوار
									</Badge>
								)}
								{floor.id === "ground" && neckEnabled && (
									<Badge
										variant="secondary"
										className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
									>
										+ رقاب
									</Badge>
								)}
								{hasItems && (
									<Badge variant="secondary" className="text-xs">
										{floorItems.length} عنصر
									</Badge>
								)}
							</div>
							{hasItems && (
								<div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
									{displayConcrete > 0 && (
										<span>
											خرسانة:{" "}
											<span className="font-semibold text-blue-600">
												{formatNumber(displayConcrete)} م³
											</span>
										</span>
									)}
									{displaySteel > 0 && (
										<span>
											حديد:{" "}
											<span className="font-semibold text-orange-600">
												{formatNumber(displaySteel)} كجم
											</span>
										</span>
									)}
								</div>
							)}
						</button>

						{/* محتوى الدور */}
						{isExpanded && (
							<div className="px-4 pb-4">
								{floor.id === "ground" ? (
									/* ═══ الدور الأرضي: أعمدة + رقاب ═══ */
									<div className="space-y-4">
										<FloorColumnsPanel
											floor={floor}
											studyId={studyId}
											organizationId={organizationId}
											items={floorItems}
											specs={specs}
											onSave={onSave}
											onUpdate={onUpdate}
											allItemsCount={activeItems.length}
										/>

										{/* قسم الرقاب */}
										{neckEnabled ? (
											<NeckColumnsSection
												groundColumns={groundColumns}
												neckHeight={neckHeight}
												onNeckHeightChange={setNeckHeight}
												onDisable={() => setNeckEnabled(false)}
												specs={specs}
											/>
										) : (
											floorItems.length > 0 && (
												<Button
													variant="outline"
													className="w-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border-2 border-dashed border-amber-400/40 hover:bg-amber-500/20 hover:border-amber-400/60 transition-all"
													onClick={() => setNeckEnabled(true)}
												>
													<Plus className="h-5 w-5 ml-2" />
													<span className="font-semibold">
														إضافة رقاب الأعمدة
													</span>
													<span className="text-xs mr-2 text-amber-600/70 dark:text-amber-500/70">
														(الجزء المدفون تحت الأرض)
													</span>
												</Button>
											)
										)}
									</div>
								) : floor.isRepeated ? (
									/* ═══ الدور المتكرر: خاص ═══ */
									<div className="space-y-4">
										{/* إعداد عدد الأدوار */}
										<div className="flex items-center gap-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 rounded-lg p-3">
											<Layers className="h-5 w-5 text-purple-600" />
											<Label className="font-medium text-sm">
												عدد الأدوار المتكررة:
											</Label>
											<Input
												type="number"
												min={1}
												max={50}
												value={repeatedCount}
												onChange={(
													e: React.ChangeEvent<HTMLInputElement>,
												) =>
													setRepeatedCount(
														Math.max(1, parseInt(e.target.value) || 1),
													)
												}
												className="w-20 h-8 text-center font-bold"
											/>
											<span className="text-xs text-muted-foreground">
												أضف الأعمدة مرة واحدة وسيتم تطبيقها على{" "}
												{repeatedCount} أدوار
											</span>
										</div>

										{/* قالب الأعمدة */}
										<div className="border border-purple-200/30 rounded-lg p-3">
											<div className="flex items-center gap-2 mb-3">
												<Copy className="h-4 w-4 text-purple-600" />
												<h5 className="font-medium text-sm">
													قالب الأعمدة (يُطبق على كل دور)
												</h5>
											</div>
											<FloorColumnsPanel
												floor={floor}
												studyId={studyId}
												organizationId={organizationId}
												items={floorItems}
												specs={specs}
												onSave={onSave}
												onUpdate={onUpdate}
												allItemsCount={activeItems.length}
											/>
										</div>

										{/* عرض كل دور متكرر بالتفصيل */}
										{floorItems.length > 0 && (
											<div className="space-y-2">
												<div className="flex items-center gap-2">
													<Building2 className="h-4 w-4 text-purple-600" />
													<h5 className="font-medium text-sm">
														تفصيل الأدوار المتكررة
													</h5>
												</div>
												{Array.from(
													{ length: repeatedCount },
													(_, i) => {
														const floorNum = i + 1;
														const isOpen =
															expandedRepeatedFloors.includes(i);
														const perFloorConcrete = floorItems.reduce(
															(s, item) => s + item.concreteVolume,
															0,
														);
														const perFloorSteel = floorItems.reduce(
															(s, item) => s + item.steelWeight,
															0,
														);

														return (
															<div
																key={i}
																className="border rounded-lg overflow-hidden bg-background"
															>
																<button
																	type="button"
																	className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/30 transition-colors text-sm"
																	onClick={() => toggleRepeatedFloor(i)}
																>
																	<div className="flex items-center gap-2">
																		{isOpen ? (
																			<ChevronDown className="h-3 w-3 text-muted-foreground" />
																		) : (
																			<ChevronLeft className="h-3 w-3 text-muted-foreground" />
																		)}
																		<span className="font-medium">
																			الدور المتكرر {floorNum}
																		</span>
																		<Badge
																			variant="outline"
																			className="text-xs"
																		>
																			{floorItems.length} عنصر
																		</Badge>
																	</div>
																	<div className="flex items-center gap-3 text-xs text-muted-foreground">
																		<span>
																			خرسانة:{" "}
																			<span className="font-semibold text-blue-600">
																				{formatNumber(perFloorConcrete)} م³
																			</span>
																		</span>
																		<span>
																			حديد:{" "}
																			<span className="font-semibold text-orange-600">
																				{formatNumber(perFloorSteel)} كجم
																			</span>
																		</span>
																	</div>
																</button>
																{isOpen && (
																	<div className="px-3 pb-3 border-t">
																		<Table>
																			<TableHeader>
																				<TableRow>
																					<TableHead className="text-right text-xs">
																						{t(
																							"pricing.studies.structural.itemName",
																						)}
																					</TableHead>
																					<TableHead className="text-right text-xs">
																						{t(
																							"pricing.studies.structural.quantity",
																						)}
																					</TableHead>
																					<TableHead className="text-right text-xs">
																						{t(
																							"pricing.studies.form.dimensions",
																						)}
																					</TableHead>
																					<TableHead className="text-right text-xs">
																						{t(
																							"pricing.studies.structural.concreteVolume",
																						)}
																					</TableHead>
																					<TableHead className="text-right text-xs">
																						{t(
																							"pricing.studies.structural.steelWeight",
																						)}
																					</TableHead>
																				</TableRow>
																			</TableHeader>
																			<TableBody>
																				{floorItems.map((item) => (
																					<TableRow
																						key={`${item.id}-f${floorNum}`}
																					>
																						<TableCell className="text-sm">
																							{item.name}
																						</TableCell>
																						<TableCell className="text-sm">
																							{item.quantity}
																						</TableCell>
																						<TableCell className="text-sm">
																							{item.dimensions?.width || 0}×
																							{item.dimensions?.depth || 0} سم
																							×{" "}
																							{item.dimensions?.height || 0} م
																						</TableCell>
																						<TableCell className="text-sm">
																							{formatNumber(
																								item.concreteVolume,
																							)}{" "}
																							م³
																						</TableCell>
																						<TableCell className="text-sm">
																							{formatNumber(item.steelWeight)}{" "}
																							كجم
																						</TableCell>
																					</TableRow>
																				))}
																			</TableBody>
																		</Table>
																		<div className="bg-muted/30 rounded p-2 mt-2 flex gap-4 text-xs">
																			<span>
																				إجمالي الدور {floorNum}:{" "}
																			</span>
																			<span className="font-bold text-blue-600">
																				{formatNumber(perFloorConcrete)} م³
																				خرسانة
																			</span>
																			<span className="font-bold text-orange-600">
																				{formatNumber(perFloorSteel)} كجم
																				حديد
																			</span>
																		</div>
																	</div>
																)}
															</div>
														);
													},
												)}

												{/* ملخص جميع الأدوار المتكررة */}
												<div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 rounded-lg p-3">
													<div className="flex items-center justify-between">
														<span className="font-semibold text-sm flex items-center gap-2">
															<Layers className="h-4 w-4 text-purple-600" />
															إجمالي {repeatedCount} أدوار متكررة
														</span>
														<div className="flex gap-4 text-sm">
															<span>
																خرسانة:{" "}
																<span className="font-bold text-blue-600">
																	{formatNumber(repeatedConcrete)} م³
																</span>
															</span>
															<span>
																حديد:{" "}
																<span className="font-bold text-orange-600">
																	{formatNumber(repeatedSteel)} كجم
																</span>
															</span>
														</div>
													</div>
												</div>
											</div>
										)}
									</div>
								) : (
									/* ═══ الأدوار العادية ═══ */
									<FloorColumnsPanel
										floor={floor}
										studyId={studyId}
										organizationId={organizationId}
										items={floorItems}
										specs={specs}
										onSave={onSave}
										onUpdate={onUpdate}
										allItemsCount={activeItems.length}
									/>
								)}
							</div>
						)}
					</div>
				);
			})}

			{/* الملخص الإجمالي */}
			{activeItems.length > 0 && (
				<div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
					<div className="flex items-center gap-2 mb-2">
						<Building2 className="h-5 w-5 text-primary" />
						<h4 className="font-semibold">إجمالي جميع الأدوار</h4>
						{repeatedCount > 1 && repeatedTemplateItems.length > 0 && (
							<span className="text-xs text-muted-foreground">
								(يشمل {repeatedCount} أدوار متكررة)
							</span>
						)}
						{neckEnabled && groundColumns.length > 0 && (
							<span className="text-xs text-muted-foreground">
								(يشمل رقاب الأعمدة)
							</span>
						)}
					</div>
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">
								{t("pricing.studies.summary.totalConcrete")}:
							</span>
							<p className="font-bold text-lg">
								{formatNumber(grandTotalConcrete)}{" "}
								{t("pricing.studies.units.m3")}
							</p>
						</div>
						<div>
							<span className="text-muted-foreground">
								{t("pricing.studies.summary.totalRebar")}:
							</span>
							<p className="font-bold text-lg">
								{formatNumber(grandTotalSteel)}{" "}
								{t("pricing.studies.units.kg")}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
