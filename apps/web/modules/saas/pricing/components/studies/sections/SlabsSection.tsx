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
	ChevronDown,
	ChevronLeft,
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
	getRebarWeightPerMeter,
	type EnhancedSlabResult,
} from "../../../lib/structural-calculations";
import type {
	SolidSlab,
	FlatSlab,
	RibbedSlab,
	HollowCoreSlab,
	BandedBeamSlab,
} from "../../../types/slabs";
import { calculateBeam } from "../../../lib/calculations";
import { formatNumber, ELEMENT_PREFIXES } from "../../../lib/utils";
import { REBAR_DIAMETERS, STOCK_LENGTHS } from "../../../constants/prices";
import {
	SLAB_TYPE_INFO,
	COMMON_THICKNESSES,
	HORDI_BLOCK_SIZES,
	COMMON_SPACINGS,
	SLAB_FLOOR_NAMES,
} from "../../../constants/slabs";
import {
	ElementHeaderRow,
	DimensionsCard,
	RebarMeshInput,
	RebarBarsInput,
	StirrupsInput,
	CalculationResultsPanel,
} from "../shared";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

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
	specs?: { concreteType: string; steelGrade: string };
}

type SlabTypeKey = "solid" | "flat" | "ribbed" | "hollow_core" | "banded_beam";
type SlabTypeKeyOrEmpty = SlabTypeKey | "";

// ═══════════════════════════════════════════════════════════════
// كمرة السقف الصلب
// ═══════════════════════════════════════════════════════════════

interface SlabBeamDef {
	id: string;
	name: string;
	quantity: number;
	width: number; // سم
	height: number; // سم
	length: number; // م
	topBarsCount: number;
	topBarDiameter: number;
	bottomBarsCount: number;
	bottomBarDiameter: number;
	stirrupDiameter: number;
	stirrupSpacing: number;
}

const getDefaultBeam = (index: number): SlabBeamDef => ({
	id: `beam-${Date.now()}-${index}`,
	name: `ك${index + 1}`,
	quantity: 1,
	width: 30,
	height: 60,
	length: 5,
	topBarsCount: 3,
	topBarDiameter: 16,
	bottomBarsCount: 4,
	bottomBarDiameter: 18,
	stirrupDiameter: 8,
	stirrupSpacing: 150,
});

// ═══════════════════════════════════════════════════════════════
// حساب تفاصيل القص للكمرات
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

function computeBeamCalc(beam: SlabBeamDef, concreteType: string) {
	const baseCalc = calculateBeam({
		quantity: beam.quantity,
		width: beam.width,
		height: beam.height,
		length: beam.length,
		topBarsCount: beam.topBarsCount,
		topBarDiameter: beam.topBarDiameter,
		bottomBarsCount: beam.bottomBarsCount,
		bottomBarDiameter: beam.bottomBarDiameter,
		stirrupDiameter: beam.stirrupDiameter,
		stirrupSpacing: beam.stirrupSpacing,
		concreteType,
	});

	const barLength = beam.length + 0.6;
	const widthM = beam.width / 100;
	const heightM = beam.height / 100;
	const stirrupPerimeter = 2 * (widthM + heightM - 0.08) + 0.3;
	const stirrupsCount =
		Math.ceil((beam.length * 1000) / beam.stirrupSpacing) + 1;

	const cuttingDetails = [
		calculateCuttingDetails(
			barLength,
			beam.topBarsCount * beam.quantity,
			beam.topBarDiameter,
			`${beam.name} - حديد علوي`,
		),
		calculateCuttingDetails(
			barLength,
			beam.bottomBarsCount * beam.quantity,
			beam.bottomBarDiameter,
			`${beam.name} - حديد سفلي`,
		),
		calculateCuttingDetails(
			stirrupPerimeter,
			stirrupsCount * beam.quantity,
			beam.stirrupDiameter,
			`${beam.name} - كانات`,
		),
	];

	const netWeight = cuttingDetails.reduce((sum, d) => sum + d.weight, 0);
	const grossWeight = cuttingDetails.reduce(
		(sum, d) =>
			sum +
			d.stocksNeeded * d.stockLength * getRebarWeightPerMeter(d.diameter),
		0,
	);

	return {
		...baseCalc,
		cuttingDetails,
		netWeight,
		grossWeight,
	};
}

// ═══════════════════════════════════════════════════════════════
// FORM DATA
// ═══════════════════════════════════════════════════════════════

interface FormData {
	name: string;
	slabType: SlabTypeKeyOrEmpty;
	floor: string;
	quantity: number;
	length: number;
	width: number;
	thickness: number;
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
	slabType: "",
	floor: "",
	quantity: 1,
	length: 0,
	width: 0,
	thickness: 15,
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

// ═══════════════════════════════════════════════════════════════
// مكون إدخال كمرة واحدة
// ═══════════════════════════════════════════════════════════════

interface BeamInputRowProps {
	beam: SlabBeamDef;
	index: number;
	isExpanded: boolean;
	onToggle: () => void;
	onChange: (beam: SlabBeamDef) => void;
	onRemove: () => void;
	concreteType: string;
}

function BeamInputRow({
	beam,
	index,
	isExpanded,
	onToggle,
	onChange,
	onRemove,
	concreteType,
}: BeamInputRowProps) {
	const calc = useMemo(() => computeBeamCalc(beam, concreteType), [beam, concreteType]);

	return (
		<div className="border rounded-lg overflow-hidden bg-background">
			{/* رأس الكمرة - ملخص */}
			<button
				type="button"
				className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors text-sm"
				onClick={onToggle}
			>
				<div className="flex items-center gap-3">
					{isExpanded ? (
						<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
					) : (
						<ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
					)}
					<span className="text-base">📏</span>
					<span className="font-semibold">{beam.name}</span>
					<Badge variant="outline" className="text-xs">
						{beam.quantity} كمرة
					</Badge>
					<span className="text-xs text-muted-foreground">
						{beam.width}×{beam.height} سم × {beam.length} م
					</span>
				</div>
				<div className="flex items-center gap-4 text-xs text-muted-foreground">
					<span>
						خرسانة:{" "}
						<span className="font-semibold text-blue-600">
							{formatNumber(calc.concreteVolume)} م³
						</span>
					</span>
					<span>
						حديد:{" "}
						<span className="font-semibold text-orange-600">
							{formatNumber(calc.grossWeight)} كجم
						</span>
					</span>
				</div>
			</button>

			{/* تفاصيل الكمرة */}
			{isExpanded && (
				<div className="px-3 pb-3 border-t space-y-3">
					{/* الاسم والعدد */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
						<div className="space-y-1">
							<Label className="text-xs">اسم الكمرة</Label>
							<Input
								value={beam.name}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									onChange({ ...beam, name: e.target.value })
								}
								className="h-8 text-sm"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">العدد</Label>
							<Input
								type="number"
								min={1}
								value={beam.quantity}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									onChange({
										...beam,
										quantity: Math.max(1, parseInt(e.target.value) || 1),
									})
								}
								className="h-8 text-sm"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">العرض (سم)</Label>
							<Select
								value={beam.width.toString()}
								onValueChange={(v) =>
									onChange({ ...beam, width: +v })
								}
							>
								<SelectTrigger className="h-8 text-sm">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[20, 25, 30, 35, 40, 50, 60].map((w) => (
										<SelectItem key={w} value={w.toString()}>
											{w} سم
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">الارتفاع (سم)</Label>
							<Select
								value={beam.height.toString()}
								onValueChange={(v) =>
									onChange({ ...beam, height: +v })
								}
							>
								<SelectTrigger className="h-8 text-sm">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[30, 40, 50, 60, 70, 80, 90, 100].map((h) => (
										<SelectItem key={h} value={h.toString()}>
											{h} سم
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* الطول */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
						<div className="space-y-1">
							<Label className="text-xs">الطول (م)</Label>
							<Input
								type="number"
								min={0.5}
								step={0.1}
								value={beam.length}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									onChange({
										...beam,
										length: Math.max(0.5, parseFloat(e.target.value) || 1),
									})
								}
								className="h-8 text-sm"
							/>
						</div>
						<div className="bg-blue-50/50 dark:bg-blue-950/20 rounded p-2 flex flex-col justify-center items-center">
							<span className="text-xs text-muted-foreground">
								حجم الخرسانة
							</span>
							<span className="font-bold text-sm text-blue-700">
								{formatNumber(calc.concreteVolume)} م³
							</span>
						</div>
					</div>

					{/* التسليح */}
					<div className="space-y-2">
						<h6 className="text-xs font-semibold text-muted-foreground">
							التسليح
						</h6>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
							<RebarBarsInput
								title="حديد سفلي (شد)"
								diameter={beam.bottomBarDiameter}
								onDiameterChange={(d) =>
									onChange({ ...beam, bottomBarDiameter: d })
								}
								barsCount={beam.bottomBarsCount}
								onBarsCountChange={(n) =>
									onChange({ ...beam, bottomBarsCount: n })
								}
								colorScheme="blue"
								availableDiameters={REBAR_DIAMETERS.filter((d) => d >= 12)}
								availableBarsCount={[2, 3, 4, 5, 6, 8]}
							/>
							<RebarBarsInput
								title="حديد علوي (ضغط)"
								diameter={beam.topBarDiameter}
								onDiameterChange={(d) =>
									onChange({ ...beam, topBarDiameter: d })
								}
								barsCount={beam.topBarsCount}
								onBarsCountChange={(n) =>
									onChange({ ...beam, topBarsCount: n })
								}
								colorScheme="green"
								availableDiameters={REBAR_DIAMETERS.filter((d) => d >= 12)}
								availableBarsCount={[2, 3, 4, 5, 6]}
							/>
							<StirrupsInput
								diameter={beam.stirrupDiameter}
								onDiameterChange={(d) =>
									onChange({ ...beam, stirrupDiameter: d })
								}
								spacing={beam.stirrupSpacing}
								onSpacingChange={(s) =>
									onChange({ ...beam, stirrupSpacing: s })
								}
								availableDiameters={REBAR_DIAMETERS.filter((d) => d <= 10)}
								availableSpacings={[100, 125, 150, 175, 200, 250]}
							/>
						</div>
					</div>

					{/* نتائج الكمرة */}
					<div className="bg-muted/30 rounded-lg p-2 grid grid-cols-3 gap-3 text-xs">
						<div>
							<span className="text-muted-foreground">خرسانة: </span>
							<span className="font-bold">
								{formatNumber(calc.concreteVolume)} م³
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">حديد (صافي): </span>
							<span className="font-bold">
								{formatNumber(calc.netWeight)} كجم
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">حديد (إجمالي): </span>
							<span className="font-bold">
								{formatNumber(calc.grossWeight)} كجم
							</span>
						</div>
					</div>

					{/* زر الحذف */}
					<div className="flex justify-end">
						<Button
							variant="ghost"
							size="sm"
							className="text-destructive hover:text-destructive text-xs"
							onClick={onRemove}
						>
							<Trash2 className="h-3.5 w-3.5 ml-1" />
							حذف الكمرة
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// المكون الرئيسي
// ═══════════════════════════════════════════════════════════════

export function SlabsSection({
	studyId,
	organizationId,
	items,
	onSave,
	onUpdate,
	specs,
}: SlabsSectionProps) {
	const t = useTranslations();
	const [isAdding, setIsAdding] = useState(false);
	const [editingItemId, setEditingItemId] = useState<string | null>(null);
	const [showCuttingDetails, setShowCuttingDetails] = useState(false);
	const [showFormwork, setShowFormwork] = useState(false);
	const [showBeamCutting, setShowBeamCutting] = useState(false);

	const [formData, setFormData] = useState<FormData>(getDefaultFormData());

	// كمرات السقف الصلب
	const [slabBeams, setSlabBeams] = useState<SlabBeamDef[]>([]);
	const [expandedBeamIds, setExpandedBeamIds] = useState<string[]>([]);

	const toggleBeam = (id: string) => {
		setExpandedBeamIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);
	};

	const addBeam = () => {
		const newBeam = getDefaultBeam(slabBeams.length);
		setSlabBeams([...slabBeams, newBeam]);
		setExpandedBeamIds([...expandedBeamIds, newBeam.id]);
	};

	const updateBeam = (id: string, updated: SlabBeamDef) => {
		setSlabBeams((prev) =>
			prev.map((b) => (b.id === id ? updated : b)),
		);
	};

	const removeBeam = (id: string) => {
		setSlabBeams((prev) => prev.filter((b) => b.id !== id));
		setExpandedBeamIds((prev) => prev.filter((x) => x !== id));
	};

	const resetForm = () => {
		setFormData(getDefaultFormData());
		setSlabBeams([]);
		setExpandedBeamIds([]);
	};

	// ═══ حساب الكمرات ═══
	const beamsCalcs = useMemo(() => {
		if (formData.slabType !== "solid" || slabBeams.length === 0) return null;

		const concreteType = specs?.concreteType || "C30";
		const allCalcs = slabBeams.map((beam) => ({
			beam,
			calc: computeBeamCalc(beam, concreteType),
		}));

		const totalConcrete = allCalcs.reduce(
			(s, c) => s + c.calc.concreteVolume,
			0,
		);
		const totalNetWeight = allCalcs.reduce(
			(s, c) => s + c.calc.netWeight,
			0,
		);
		const totalGrossWeight = allCalcs.reduce(
			(s, c) => s + c.calc.grossWeight,
			0,
		);
		const allCuttingDetails = allCalcs.flatMap((c) => c.calc.cuttingDetails);

		const wasteWeight = totalGrossWeight - totalNetWeight;
		const wastePercentage =
			totalGrossWeight > 0
				? (wasteWeight / totalGrossWeight) * 100
				: 0;

		// تجميع الأسياخ المطلوبة
		const stocksMap = new Map<
			number,
			{ diameter: number; count: number; length: number }
		>();
		allCuttingDetails.forEach((d) => {
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
			totalConcrete,
			totalNetWeight,
			totalGrossWeight,
			wasteWeight,
			wastePercentage,
			allCuttingDetails,
			stocksNeeded: Array.from(stocksMap.values()),
			details: allCalcs,
		};
	}, [slabBeams, formData.slabType, specs]);

	// ═══ حساب السقف ═══
	const calculations = useMemo((): EnhancedSlabResult | null => {
		if (!formData.slabType || formData.length <= 0 || formData.width <= 0) return null;

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
						bands: Array.from(
							{ length: formData.bandedBeamCount },
							(_, i) => ({
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
							}),
						),
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

	// ═══ الإجماليات المجمعة (سقف + كمرات) ═══
	const combinedTotals = useMemo(() => {
		if (!calculations) return null;

		const slabConcrete = calculations.concreteVolume;
		const slabSteel = calculations.totals.grossWeight;
		const beamConcrete = beamsCalcs?.totalConcrete || 0;
		const beamSteel = beamsCalcs?.totalGrossWeight || 0;

		return {
			totalConcrete: slabConcrete + beamConcrete,
			totalSteel: slabSteel + beamSteel,
			slabConcrete,
			slabSteel,
			beamConcrete,
			beamSteel,
		};
	}, [calculations, beamsCalcs]);

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

	const handleSubmit = async () => {
		if (!formData.name || !formData.slabType || !formData.floor || !calculations) return;

		const totalConcreteVolume =
			calculations.concreteVolume + (beamsCalcs?.totalConcrete || 0);
		const totalSteelWeight =
			calculations.totals.grossWeight + (beamsCalcs?.totalGrossWeight || 0);

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
				floor: formData.floor,
				cover: formData.cover,
				// تسليح الشبكة السفلية
				bottomMainDiameter: formData.bottomMainDiameter,
				bottomMainBarsPerMeter: formData.bottomMainBarsPerMeter,
				bottomSecondaryDiameter: formData.bottomSecondaryDiameter,
				bottomSecondaryBarsPerMeter: formData.bottomSecondaryBarsPerMeter,
				// تسليح الشبكة العلوية
				hasTopMesh: formData.hasTopMesh ? 1 : 0,
				topMainDiameter: formData.topMainDiameter,
				topMainBarsPerMeter: formData.topMainBarsPerMeter,
				topSecondaryDiameter: formData.topSecondaryDiameter,
				topSecondaryBarsPerMeter: formData.topSecondaryBarsPerMeter,
				...(formData.slabType === "ribbed" && {
					ribWidth: formData.ribWidth,
					ribSpacing: formData.ribSpacing,
					blockHeight: formData.blockHeight,
					ribBottomBars: formData.ribBottomBars,
					ribBarDiameter: formData.ribBarDiameter,
					ribTopBars: formData.ribTopBars,
					ribTopBarDiameter: formData.ribTopBarDiameter,
					hasRibStirrup: formData.hasRibStirrup ? 1 : 0,
					ribStirrupDiameter: formData.ribStirrupDiameter,
					ribStirrupSpacing: formData.ribStirrupSpacing,
				}),
				// بيانات الكمرات (للسقف الصلب)
				...(formData.slabType === "solid" &&
					slabBeams.length > 0 && {
						beamsCount: slabBeams.length,
						beamsConcrete: beamsCalcs?.totalConcrete || 0,
						beamsSteel: beamsCalcs?.totalGrossWeight || 0,
					}),
			},
			concreteVolume: totalConcreteVolume,
			concreteType: specs?.concreteType || "C30",
			steelWeight: totalSteelWeight,
			steelRatio:
				totalConcreteVolume > 0
					? totalSteelWeight / totalConcreteVolume
					: 0,
			materialCost:
				calculations.costs.concrete +
				calculations.costs.rebar +
				(calculations.costs.blocks || 0) +
				(beamsCalcs
					? beamsCalcs.details.reduce(
							(s, c) => s + c.calc.concreteCost + c.calc.rebarCost,
							0,
						)
					: 0),
			laborCost:
				calculations.costs.labor +
				(beamsCalcs
					? beamsCalcs.details.reduce((s, c) => s + c.calc.laborCost, 0)
					: 0),
			totalCost:
				calculations.costs.total +
				(beamsCalcs
					? beamsCalcs.details.reduce((s, c) => s + c.calc.totalCost, 0)
					: 0),
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

	const handleEdit = (item: (typeof items)[0]) => {
		setEditingItemId(item.id);
		setIsAdding(true);
		setFormData({
			...getDefaultFormData(),
			name: item.name,
			slabType: (item.subCategory as SlabTypeKey) || "solid",
			floor: String(item.dimensions?.floor || ""),
			quantity: item.quantity,
			length: item.dimensions?.length || 0,
			width: item.dimensions?.width || 0,
			thickness: item.dimensions?.thickness || 15,
			ribWidth: item.dimensions?.ribWidth || 15,
			ribSpacing: item.dimensions?.ribSpacing || 52,
			blockHeight: item.dimensions?.blockHeight || 20,
		});
		// إعادة تحميل الكمرات لو موجودة
		setSlabBeams([]);
		setExpandedBeamIds([]);
	};

	return (
		<div className="space-y-4">
			{/* جدول العناصر الموجودة */}
			{items.length > 0 && (
				<div className="border rounded-lg overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-right">
									{t("pricing.studies.structural.itemName")}
								</TableHead>
								<TableHead className="text-right">النوع</TableHead>
								<TableHead className="text-right">
									{t("pricing.studies.structural.quantity")}
								</TableHead>
								<TableHead className="text-right">
									{t("pricing.studies.area")}
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
										{item.dimensions?.beamsCount > 0 && (
											<Badge
												variant="secondary"
												className="text-xs mr-2"
											>
												+ {item.dimensions.beamsCount} كمرة
											</Badge>
										)}
									</TableCell>
									<TableCell>
										<Badge variant="outline">
											{SLAB_TYPE_INFO[item.subCategory as SlabTypeKey]
												?.nameAr || item.subCategory}
										</Badge>
									</TableCell>
									<TableCell>{item.quantity}</TableCell>
									<TableCell>
										{formatNumber(
											(item.dimensions?.length || 0) *
												(item.dimensions?.width || 0),
										)}{" "}
										{t("pricing.studies.units.m2")}
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

						{/* البيانات الأساسية */}
						<div className="flex flex-wrap items-end gap-3">
							<div className="flex-1">
								<ElementHeaderRow
									autoNamePrefix={ELEMENT_PREFIXES.slabs}
									existingCount={items.length}
									name={formData.name}
									onNameChange={(name) => setFormData({ ...formData, name })}
									subTypes={Object.entries(SLAB_TYPE_INFO).map(
										([key, info]) => ({
											value: key,
											label: info.nameAr,
										}),
									)}
									selectedSubType={formData.slabType}
									onSubTypeChange={(type) =>
										setFormData({
											...formData,
											slabType: type as SlabTypeKey,
										})
									}
									subTypeRequired={true}
									quantity={formData.quantity}
									onQuantityChange={(quantity) =>
										setFormData({ ...formData, quantity })
									}
									showConcreteType={false}
									showQuantity={true}
								/>
							</div>
							<div className="flex-shrink-0 w-32">
								<Label className="text-xs mb-1 block">الدور <span className="text-destructive">*</span></Label>
								<Select
									value={formData.floor || undefined}
									onValueChange={(v: string) =>
										setFormData({ ...formData, floor: v })
									}
								>
									<SelectTrigger className={!formData.floor ? "border-destructive ring-destructive/30 ring-2" : ""}>
										<SelectValue placeholder="⚠ اختر الدور" />
									</SelectTrigger>
									<SelectContent>
										{SLAB_FLOOR_NAMES.map((floor) => (
											<SelectItem key={floor} value={floor}>
												{floor}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* رسالة اختيار النوع والدور */}
						{(!formData.slabType || !formData.floor) && (
							<div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
								<p className="text-sm font-medium">
									{!formData.slabType && !formData.floor
										? "يرجى اختيار نوع السقف والدور للمتابعة"
										: !formData.slabType
											? "يرجى اختيار نوع السقف للمتابعة"
											: "يرجى اختيار الدور للمتابعة"}
								</p>
							</div>
						)}

						{/* الأبعاد - للسقف الصلب والفلات والكمرات العريضة */}
						{formData.floor && (formData.slabType === "solid" ||
							formData.slabType === "flat" ||
							formData.slabType === "banded_beam") && (
							<DimensionsCard
								title="أبعاد السقف"
								dimensions={[
									{
										key: "length",
										label: "الطول",
										value: formData.length,
										unit: "م",
										step: 0.1,
									},
									{
										key: "width",
										label: "العرض",
										value: formData.width,
										unit: "م",
										step: 0.1,
									},
									{
										key: "thickness",
										label: "السماكة",
										value: formData.thickness,
										unit: "سم",
										step: 1,
									},
								]}
								onDimensionChange={(key, value) =>
									setFormData({ ...formData, [key]: value })
								}
								calculatedArea={formData.length * formData.width}
							/>
						)}

						{/* الأبعاد - للهوردي */}
						{formData.floor && formData.slabType === "ribbed" && (
							<>
								<DimensionsCard
									title="أبعاد السقف"
									dimensions={[
										{
											key: "length",
											label: "الطول",
											value: formData.length,
											unit: "م",
											step: 0.1,
										},
										{
											key: "width",
											label: "العرض",
											value: formData.width,
											unit: "م",
											step: 0.1,
										},
									]}
									onDimensionChange={(key, value) =>
										setFormData({ ...formData, [key]: value })
									}
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
												onValueChange={(v: string) =>
													setFormData({ ...formData, ribWidth: +v })
												}
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
											<Label className="text-sm">
												محور الأعصاب (سم)
											</Label>
											<Select
												value={formData.ribSpacing.toString()}
												onValueChange={(v: string) =>
													setFormData({ ...formData, ribSpacing: +v })
												}
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
											<Label className="text-sm">
												ارتفاع البلوك (سم)
											</Label>
											<Select
												value={formData.blockHeight.toString()}
												onValueChange={(v: string) =>
													setFormData({ ...formData, blockHeight: +v })
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{HORDI_BLOCK_SIZES.map((b) => (
														<SelectItem
															key={b.nameAr}
															value={b.height.toString()}
														>
															{b.height} سم ({b.nameAr})
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-1.5">
											<Label className="text-sm">
												سماكة الطبقة العلوية (سم)
											</Label>
											<Select
												value={formData.toppingThickness.toString()}
												onValueChange={(v: string) =>
													setFormData({
														...formData,
														toppingThickness: +v,
													})
												}
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
											<span className="text-xs text-muted-foreground">
												السماكة الكلية
											</span>
											<span className="font-bold text-lg text-orange-700">
												{formData.blockHeight + formData.toppingThickness}{" "}
												سم
											</span>
										</div>
									</div>
								</div>
							</>
						)}

						{/* الأبعاد - للهولوكور */}
						{formData.floor && formData.slabType === "hollow_core" && (
							<>
								<DimensionsCard
									title="أبعاد السقف"
									dimensions={[
										{
											key: "length",
											label: "الطول",
											value: formData.length,
											unit: "م",
											step: 0.1,
										},
										{
											key: "width",
											label: "العرض",
											value: formData.width,
											unit: "م",
											step: 0.1,
										},
									]}
									onDimensionChange={(key, value) =>
										setFormData({ ...formData, [key]: value })
									}
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
												onValueChange={(v: string) =>
													setFormData({
														...formData,
														panelWidth: +v,
													})
												}
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
												onValueChange={(v: string) =>
													setFormData({
														...formData,
														panelThickness: +v,
													})
												}
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
											<Label className="text-sm">
												سماكة الطبقة العلوية (سم)
											</Label>
											<Select
												value={formData.toppingThickness.toString()}
												onValueChange={(v: string) =>
													setFormData({
														...formData,
														toppingThickness: +v,
													})
												}
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
											<span className="text-xs text-muted-foreground">
												عدد الألواح
											</span>
											<span className="font-bold text-lg text-green-700">
												{Math.ceil(formData.width / formData.panelWidth)}{" "}
												لوح
											</span>
										</div>
									</div>
								</div>
							</>
						)}

						{/* إعدادات الفلات سلاب */}
						{formData.floor && formData.slabType === "flat" && (
							<div className="border rounded-lg p-4 bg-purple-50/30">
								<div className="flex items-center gap-2 mb-3">
									<input
										type="checkbox"
										id="hasDropPanels"
										checked={formData.hasDropPanels}
										onChange={(
											e: React.ChangeEvent<HTMLInputElement>,
										) =>
											setFormData({
												...formData,
												hasDropPanels: e.target.checked,
											})
										}
										className="rounded border-purple-500"
									/>
									<Label
										htmlFor="hasDropPanels"
										className="text-sm font-medium text-purple-700 cursor-pointer"
									>
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
												onChange={(
													e: React.ChangeEvent<HTMLInputElement>,
												) =>
													setFormData({
														...formData,
														dropPanelLength: +e.target.value,
													})
												}
											/>
										</div>
										<div className="space-y-1.5">
											<Label className="text-sm">
												عرض التكثيف (م)
											</Label>
											<Input
												type="number"
												step="0.1"
												value={formData.dropPanelWidth}
												onChange={(
													e: React.ChangeEvent<HTMLInputElement>,
												) =>
													setFormData({
														...formData,
														dropPanelWidth: +e.target.value,
													})
												}
											/>
										</div>
										<div className="space-y-1.5">
											<Label className="text-sm">
												عمق إضافي (م)
											</Label>
											<Input
												type="number"
												step="0.05"
												value={formData.dropPanelDepth}
												onChange={(
													e: React.ChangeEvent<HTMLInputElement>,
												) =>
													setFormData({
														...formData,
														dropPanelDepth: +e.target.value,
													})
												}
											/>
										</div>
										<div className="space-y-1.5">
											<Label className="text-sm">عدد التكثيفات</Label>
											<Input
												type="number"
												min={1}
												value={formData.dropPanelCount}
												onChange={(
													e: React.ChangeEvent<HTMLInputElement>,
												) =>
													setFormData({
														...formData,
														dropPanelCount: +e.target.value,
													})
												}
											/>
										</div>
									</div>
								)}
							</div>
						)}

						{/* إعدادات الكمرات العريضة */}
						{formData.floor && formData.slabType === "banded_beam" && (
							<div className="border rounded-lg p-4 bg-indigo-50/30">
								<h5 className="font-medium mb-3 text-indigo-700">
									إعدادات الكمرات العريضة
								</h5>
								<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
									<div className="space-y-1.5">
										<Label className="text-sm">عرض الكمرة (م)</Label>
										<Input
											type="number"
											step="0.1"
											value={formData.bandedBeamWidth}
											onChange={(
												e: React.ChangeEvent<HTMLInputElement>,
											) =>
												setFormData({
													...formData,
													bandedBeamWidth: +e.target.value,
												})
											}
										/>
									</div>
									<div className="space-y-1.5">
										<Label className="text-sm">عمق الكمرة (م)</Label>
										<Input
											type="number"
											step="0.05"
											value={formData.bandedBeamDepth}
											onChange={(
												e: React.ChangeEvent<HTMLInputElement>,
											) =>
												setFormData({
													...formData,
													bandedBeamDepth: +e.target.value,
												})
											}
										/>
									</div>
									<div className="space-y-1.5">
										<Label className="text-sm">عدد الكمرات</Label>
										<Input
											type="number"
											min={1}
											value={formData.bandedBeamCount}
											onChange={(
												e: React.ChangeEvent<HTMLInputElement>,
											) =>
												setFormData({
													...formData,
													bandedBeamCount: +e.target.value,
												})
											}
										/>
									</div>
								</div>
							</div>
						)}

						{/* تسليح السقف الصلب */}
						{formData.floor && (formData.slabType === "solid" ||
							formData.slabType === "flat" ||
							formData.slabType === "banded_beam") && (
							<div className="border-t pt-4 space-y-4">
								<h4 className="font-medium flex items-center gap-2">
									<span className="w-2 h-2 rounded-full bg-primary" />
									تسليح السقف
								</h4>

								{/* الشبكة السفلية */}
								<div className="space-y-3">
									<h5 className="text-sm font-medium text-blue-700">
										الشبكة السفلية (الفرش)
									</h5>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<RebarMeshInput
											title="الحديد الرئيسي"
											direction="الاتجاه الطويل"
											diameter={formData.bottomMainDiameter}
											onDiameterChange={(d) =>
												setFormData({
													...formData,
													bottomMainDiameter: d,
												})
											}
											barsPerMeter={formData.bottomMainBarsPerMeter}
											onBarsPerMeterChange={(n) =>
												setFormData({
													...formData,
													bottomMainBarsPerMeter: n,
												})
											}
											colorScheme="blue"
											availableDiameters={REBAR_DIAMETERS.filter(
												(d) => d >= 10 && d <= 16,
											)}
											availableBarsPerMeter={[5, 6, 7, 8, 9, 10]}
										/>
										<RebarMeshInput
											title="الحديد الثانوي"
											direction="الاتجاه القصير"
											diameter={formData.bottomSecondaryDiameter}
											onDiameterChange={(d) =>
												setFormData({
													...formData,
													bottomSecondaryDiameter: d,
												})
											}
											barsPerMeter={
												formData.bottomSecondaryBarsPerMeter
											}
											onBarsPerMeterChange={(n) =>
												setFormData({
													...formData,
													bottomSecondaryBarsPerMeter: n,
												})
											}
											colorScheme="blue"
											availableDiameters={REBAR_DIAMETERS.filter(
												(d) => d >= 8 && d <= 14,
											)}
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
											onChange={(
												e: React.ChangeEvent<HTMLInputElement>,
											) =>
												setFormData({
													...formData,
													hasTopMesh: e.target.checked,
												})
											}
											className="rounded border-green-500"
										/>
										<Label
											htmlFor="hasTopMesh"
											className="text-sm font-medium text-green-700 cursor-pointer"
										>
											الشبكة العلوية (الغطاء) - للسحب السالب
										</Label>
									</div>
									{formData.hasTopMesh && (
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
											<RebarMeshInput
												title="الحديد الرئيسي"
												direction="الاتجاه الطويل"
												diameter={formData.topMainDiameter}
												onDiameterChange={(d) =>
													setFormData({
														...formData,
														topMainDiameter: d,
													})
												}
												barsPerMeter={formData.topMainBarsPerMeter}
												onBarsPerMeterChange={(n) =>
													setFormData({
														...formData,
														topMainBarsPerMeter: n,
													})
												}
												colorScheme="green"
												availableDiameters={REBAR_DIAMETERS.filter(
													(d) => d >= 8 && d <= 14,
												)}
												availableBarsPerMeter={[4, 5, 6, 7, 8]}
											/>
											<RebarMeshInput
												title="الحديد الثانوي"
												direction="الاتجاه القصير"
												diameter={formData.topSecondaryDiameter}
												onDiameterChange={(d) =>
													setFormData({
														...formData,
														topSecondaryDiameter: d,
													})
												}
												barsPerMeter={
													formData.topSecondaryBarsPerMeter
												}
												onBarsPerMeterChange={(n) =>
													setFormData({
														...formData,
														topSecondaryBarsPerMeter: n,
													})
												}
												colorScheme="green"
												availableDiameters={REBAR_DIAMETERS.filter(
													(d) => d >= 8 && d <= 12,
												)}
												availableBarsPerMeter={[3, 4, 5, 6]}
											/>
										</div>
									)}
								</div>
							</div>
						)}

						{/* تسليح الهوردي */}
						{formData.floor && formData.slabType === "ribbed" && (
							<div className="border-t pt-4 space-y-4">
								<h4 className="font-medium flex items-center gap-2">
									<span className="w-2 h-2 rounded-full bg-orange-500" />
									تسليح الأعصاب
								</h4>

								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div className="space-y-1.5">
										<Label className="text-sm text-blue-700">
											عدد أسياخ القاع
										</Label>
										<Select
											value={formData.ribBottomBars.toString()}
											onValueChange={(v: string) =>
												setFormData({
													...formData,
													ribBottomBars: +v,
												})
											}
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
										<Label className="text-sm text-blue-700">
											قطر سيخ القاع
										</Label>
										<Select
											value={formData.ribBarDiameter.toString()}
											onValueChange={(v: string) =>
												setFormData({
													...formData,
													ribBarDiameter: +v,
												})
											}
										>
											<SelectTrigger className="border-blue-200">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{REBAR_DIAMETERS.filter(
													(d) => d >= 10 && d <= 16,
												).map((d) => (
													<SelectItem key={d} value={d.toString()}>
														{d} مم
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-1.5">
										<Label className="text-sm text-green-700">
											عدد أسياخ الرأس
										</Label>
										<Select
											value={formData.ribTopBars.toString()}
											onValueChange={(v: string) =>
												setFormData({
													...formData,
													ribTopBars: +v,
												})
											}
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
										<Label className="text-sm text-green-700">
											قطر سيخ الرأس
										</Label>
										<Select
											value={formData.ribTopBarDiameter.toString()}
											onValueChange={(v: string) =>
												setFormData({
													...formData,
													ribTopBarDiameter: +v,
												})
											}
										>
											<SelectTrigger className="border-green-200">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{REBAR_DIAMETERS.filter(
													(d) => d >= 8 && d <= 12,
												).map((d) => (
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
											onChange={(
												e: React.ChangeEvent<HTMLInputElement>,
											) =>
												setFormData({
													...formData,
													hasRibStirrup: e.target.checked,
												})
											}
											className="rounded border-gray-500"
										/>
										<Label
											htmlFor="hasRibStirrup"
											className="text-sm font-medium cursor-pointer"
										>
											كانات العصب
										</Label>
									</div>
									{formData.hasRibStirrup && (
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-1.5">
												<Label className="text-sm">قطر الكانة</Label>
												<Select
													value={formData.ribStirrupDiameter.toString()}
													onValueChange={(v: string) =>
														setFormData({
															...formData,
															ribStirrupDiameter: +v,
														})
													}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{REBAR_DIAMETERS.filter(
															(d) => d >= 6 && d <= 10,
														).map((d) => (
															<SelectItem
																key={d}
																value={d.toString()}
															>
																{d} مم
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-1.5">
												<Label className="text-sm">
													تباعد الكانات (مم)
												</Label>
												<Select
													value={formData.ribStirrupSpacing.toString()}
													onValueChange={(v: string) =>
														setFormData({
															...formData,
															ribStirrupSpacing: +v,
														})
													}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{[150, 200, 250, 300].map((s) => (
															<SelectItem
																key={s}
																value={s.toString()}
															>
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
									<h5 className="text-sm font-medium text-blue-700">
										تسليح الطبقة العلوية
									</h5>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<RebarMeshInput
											title="الشبكة العلوية"
											direction="الاتجاه الطويل"
											diameter={formData.bottomSecondaryDiameter}
											onDiameterChange={(d) =>
												setFormData({
													...formData,
													bottomSecondaryDiameter: d,
												})
											}
											barsPerMeter={
												formData.bottomSecondaryBarsPerMeter
											}
											onBarsPerMeterChange={(n) =>
												setFormData({
													...formData,
													bottomSecondaryBarsPerMeter: n,
												})
											}
											colorScheme="blue"
											availableDiameters={REBAR_DIAMETERS.filter(
												(d) => d >= 6 && d <= 10,
											)}
											availableBarsPerMeter={[4, 5, 6, 7]}
										/>
									</div>
								</div>
							</div>
						)}

						{/* ═══════════════════════════════════════════════════ */}
						{/* كمرات السقف الصلب                                */}
						{/* ═══════════════════════════════════════════════════ */}
						{formData.floor && formData.slabType === "solid" && (
							<div className="border-t pt-4 space-y-4">
								<div className="flex items-center justify-between">
									<h4 className="font-medium flex items-center gap-2">
										<span className="text-lg">📏</span>
										كمرات السقف الصلب
										{slabBeams.length > 0 && (
											<Badge
												variant="secondary"
												className="text-xs"
											>
												{slabBeams.length} كمرة
											</Badge>
										)}
									</h4>
								</div>

								<p className="text-xs text-muted-foreground">
									أضف الكمرات الحاملة للسقف الصلب — يتم حساب خرسانة
									وحديد الكمرات منفصلاً ثم إضافتها لإجمالي السقف
								</p>

								{/* قائمة الكمرات */}
								{slabBeams.length > 0 && (
									<div className="space-y-2">
										{slabBeams.map((beam, idx) => (
											<BeamInputRow
												key={beam.id}
												beam={beam}
												index={idx}
												isExpanded={expandedBeamIds.includes(
													beam.id,
												)}
												onToggle={() => toggleBeam(beam.id)}
												onChange={(updated) =>
													updateBeam(beam.id, updated)
												}
												onRemove={() => removeBeam(beam.id)}
												concreteType={
													specs?.concreteType || "C30"
												}
											/>
										))}
									</div>
								)}

								{/* زر إضافة كمرة */}
								<Button
									variant="outline"
									className="w-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-2 border-dashed border-indigo-400/40 hover:bg-indigo-500/20 hover:border-indigo-400/60 transition-all"
									onClick={addBeam}
								>
									<Plus className="h-4 w-4 ml-2" />
									<span className="font-semibold">إضافة كمرة</span>
								</Button>

								{/* ملخص الكمرات */}
								{beamsCalcs && beamsCalcs.totalConcrete > 0 && (
									<div className="space-y-3">
										<div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 rounded-lg p-3">
											<div className="flex items-center gap-2 mb-2">
												<span className="text-sm">📏</span>
												<h5 className="font-semibold text-sm">
													إجمالي كمرات السقف
												</h5>
											</div>
											<div className="grid grid-cols-3 gap-4 text-sm">
												<div>
													<span className="text-muted-foreground">
														خرسانة:
													</span>
													<span className="font-bold mr-1 text-blue-600">
														{formatNumber(
															beamsCalcs.totalConcrete,
														)}{" "}
														م³
													</span>
												</div>
												<div>
													<span className="text-muted-foreground">
														حديد (إجمالي):
													</span>
													<span className="font-bold mr-1 text-orange-600">
														{formatNumber(
															beamsCalcs.totalGrossWeight,
														)}{" "}
														كجم
													</span>
												</div>
												<div>
													<span className="text-muted-foreground">
														هالك:
													</span>
													<span className="font-bold mr-1 text-red-500">
														{formatNumber(
															beamsCalcs.wastePercentage,
															1,
														)}
														%
													</span>
												</div>
											</div>
										</div>

										{/* تفاصيل القص للكمرات */}
										<div>
											<Button
												variant="ghost"
												size="sm"
												className="gap-1.5 text-xs"
												onClick={() =>
													setShowBeamCutting(!showBeamCutting)
												}
											>
												{showBeamCutting ? (
													<ChevronDown className="h-3 w-3" />
												) : (
													<ChevronLeft className="h-3 w-3" />
												)}
												تفاصيل قص حديد الكمرات
											</Button>

											{showBeamCutting && (
												<div className="border rounded-lg overflow-hidden mt-2">
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
															{beamsCalcs.allCuttingDetails.map(
																(d, i) => (
																	<TableRow key={i}>
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
																			{d.stocksNeeded} ×{" "}
																			{d.stockLength}م
																		</TableCell>
																		<TableCell className="text-xs">
																			{d.wastePercentage}%
																		</TableCell>
																		<TableCell className="text-xs">
																			{formatNumber(d.weight)}{" "}
																			كجم
																		</TableCell>
																	</TableRow>
																),
															)}
														</TableBody>
													</Table>

													{/* الأسياخ المطلوبة من المصنع */}
													<div className="bg-muted/30 p-3 border-t">
														<h6 className="text-xs font-semibold mb-2">
															أسياخ المصنع المطلوبة للكمرات:
														</h6>
														<div className="flex flex-wrap gap-3">
															{beamsCalcs.stocksNeeded.map(
																(s, i) => (
																	<Badge
																		key={i}
																		variant="outline"
																		className="text-xs"
																	>
																		∅{s.diameter}مم: {s.count}{" "}
																		سيخ × {s.length}م
																	</Badge>
																),
															)}
														</div>
													</div>
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						)}

						{/* نتائج الحساب */}
						{formData.floor && calculations && (
							<div className="bg-muted/50 rounded-lg p-4 space-y-4">
								<div className="flex items-center gap-2 mb-3">
									<Calculator className="h-5 w-5 text-primary" />
									<h4 className="font-medium">
										{t("pricing.studies.calculations.results")}
									</h4>
								</div>

								{/* البلوكات - للهوردي */}
								{calculations.blocksCount &&
									calculations.blocksCount > 0 && (
										<div className="bg-orange-100/50 rounded p-3">
											<div className="flex items-center gap-2 text-orange-700">
												<Package className="h-4 w-4" />
												<span className="font-medium">
													عدد البلوكات:{" "}
													{formatNumber(calculations.blocksCount, 0)}{" "}
													بلوكة
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
											onChange={(
												e: React.ChangeEvent<HTMLInputElement>,
											) => setShowFormwork(e.target.checked)}
											className="rounded"
										/>
										<Label
											htmlFor="showFormwork"
											className="text-sm font-medium cursor-pointer"
										>
											إظهار حساب الشدات
										</Label>
									</div>
									{showFormwork && calculations.formworkArea > 0 && (
										<div className="flex items-center gap-2 text-blue-600">
											<LayoutGrid className="h-4 w-4" />
											<span className="font-bold">
												{formatNumber(calculations.formworkArea)}{" "}
												{t("pricing.studies.units.m2")}
											</span>
										</div>
									)}
								</div>

								{/* إجمالي السقف (البلاطة فقط) */}
								<CalculationResultsPanel
									concreteVolume={calculations.concreteVolume}
									totals={calculations.totals}
									cuttingDetails={calculations.rebarDetails.map(
										(detail) => ({
											description: detail.description,
											diameter: detail.diameter,
											barLength: detail.barLength,
											barCount: detail.barCount,
											stocksNeeded: detail.stocksNeeded,
											weight: detail.weight,
											grossWeight: detail.weight,
											wastePercentage: detail.wastePercentage,
										}),
									)}
									showCuttingDetails={showCuttingDetails}
									onToggleCuttingDetails={setShowCuttingDetails}
								/>

								{/* الإجمالي المجمع (سقف + كمرات) */}
								{combinedTotals &&
									beamsCalcs &&
									beamsCalcs.totalConcrete > 0 && (
										<div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
											<h5 className="font-semibold text-sm mb-3 flex items-center gap-2">
												<Calculator className="h-4 w-4 text-primary" />
												الإجمالي الكلي (البلاطة + الكمرات)
											</h5>
											<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
												<div>
													<span className="text-muted-foreground text-xs">
														خرسانة البلاطة:
													</span>
													<p className="font-bold">
														{formatNumber(
															combinedTotals.slabConcrete,
														)}{" "}
														م³
													</p>
												</div>
												<div>
													<span className="text-muted-foreground text-xs">
														خرسانة الكمرات:
													</span>
													<p className="font-bold text-indigo-600">
														{formatNumber(
															combinedTotals.beamConcrete,
														)}{" "}
														م³
													</p>
												</div>
												<div>
													<span className="text-muted-foreground text-xs">
														حديد البلاطة:
													</span>
													<p className="font-bold">
														{formatNumber(
															combinedTotals.slabSteel,
														)}{" "}
														كجم
													</p>
												</div>
												<div>
													<span className="text-muted-foreground text-xs">
														حديد الكمرات:
													</span>
													<p className="font-bold text-indigo-600">
														{formatNumber(
															combinedTotals.beamSteel,
														)}{" "}
														كجم
													</p>
												</div>
											</div>
											<div className="border-t mt-3 pt-3 grid grid-cols-2 gap-4">
												<div>
													<span className="text-muted-foreground text-xs">
														إجمالي الخرسانة:
													</span>
													<p className="font-bold text-lg">
														{formatNumber(
															combinedTotals.totalConcrete,
														)}{" "}
														م³
													</p>
												</div>
												<div>
													<span className="text-muted-foreground text-xs">
														إجمالي الحديد:
													</span>
													<p className="font-bold text-lg">
														{formatNumber(
															combinedTotals.totalSteel,
														)}{" "}
														كجم
													</p>
												</div>
											</div>
										</div>
									)}
							</div>
						)}

						{/* أزرار الحفظ والإلغاء */}
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
									!formData.slabType ||
									!formData.floor ||
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
					onClick={() => setIsAdding(true)}
				>
					<Plus className="h-5 w-5 ml-2" />
					<span className="font-semibold">
						{t("pricing.studies.structural.addItem")}
					</span>
				</Button>
			)}

			{/* ملخص العناصر */}
			{items.length > 0 && (
				<div className="bg-muted/30 rounded-lg p-4">
					<h4 className="font-medium mb-2">
						{t("pricing.studies.summary.totalItems")}
					</h4>
					<div className="grid grid-cols-3 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">
								إجمالي المساحة:
							</span>
							<p className="font-bold">
								{formatNumber(
									items.reduce(
										(sum, i) =>
											sum +
											(i.dimensions?.length || 0) *
												(i.dimensions?.width || 0) *
												i.quantity,
										0,
									),
								)}{" "}
								{t("pricing.studies.units.m2")}
							</p>
						</div>
						<div>
							<span className="text-muted-foreground">
								{t("pricing.studies.summary.totalConcrete")}:
							</span>
							<p className="font-bold">
								{formatNumber(
									items.reduce(
										(sum, i) => sum + i.concreteVolume,
										0,
									),
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
									items.reduce(
										(sum, i) => sum + i.steelWeight,
										0,
									),
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
