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
	ChevronDown,
	ChevronLeft,
	Building2,
	Layers,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { toast } from "sonner";
import { calculateStairs, type StairsResult } from "../../../lib/calculations";
import { formatNumber, ELEMENT_PREFIXES } from "../../../lib/utils";
import { STOCK_LENGTHS, REBAR_WEIGHTS } from "../../../constants/prices";
import {
	ElementHeaderRow,
	RebarMeshInput,
	CalculationResultsPanel,
} from "../shared";
import type { StructuralFloorConfig } from "../../../types/structural-building-config";

interface StairsSectionProps {
	studyId: string;
	organizationId: string;
	items: Array<{
		id: string;
		name: string;
		dimensions: Record<string, number>;
		concreteVolume: number;
		steelWeight: number;
		totalCost: number;
	}>;
	onSave: () => void;
	onUpdate: () => void;
	specs?: { concreteType: string; steelGrade: string };
	buildingFloors?: StructuralFloorConfig[];
}

interface CuttingDetail {
	description: string;
	diameter: number;
	barLength: number;
	barCount: number;
	stockLength: number;
	stocksNeeded: number;
	cutsPerStock: number;
	wastePerStock: number;
	totalWaste: number;
	wastePercentage: number;
	netWeight: number;
	grossWeight: number;
}

interface EnhancedStairsResult extends StairsResult {
	cuttingDetails: CuttingDetail[];
	totals: {
		netWeight: number;
		grossWeight: number;
		wasteWeight: number;
		wastePercentage: number;
		stocksNeeded: Array<{ diameter: number; count: number; length: number }>;
	};
}

interface StairConnection {
	id: string;
	fromFloor: { label: string; icon: string };
	toFloor: { label: string; icon: string };
	height: number; // meters
	label: string;
}

interface ConnectionCalc {
	connection: StairConnection;
	risersCount: number;
	goingLength: number;
	flightLength: number;
	calculations: EnhancedStairsResult;
}

// ثوابت حساب حديد السلالم (SBC 304)
const STAIR_REBAR_DEFAULTS = {
	DEV_LENGTH_MULTIPLIER: 40,      // 40d - طول التماسك
	HOOK_MULTIPLIER: 12,            // 12d - طول الخطاف
	TOP_BAR_EXTENSION_RATIO: 0.25,  // 0.25L - امتداد الحديد العلوي
	CUT_LENGTH_ROUNDING: 0.05,      // تقريب لأقرب 5 سم
};

function roundUpTo5cm(length: number): number {
	return Math.ceil(length / 0.05) * 0.05;
}

// دالة حساب تفاصيل القص
function calculateCuttingDetail(
	description: string,
	diameter: number,
	barLength: number,
	barCount: number
): CuttingDetail {
	const stockLength = STOCK_LENGTHS[diameter] || 12;
	const weight = REBAR_WEIGHTS[diameter] || diameter * diameter * 0.00617;

	const cutsPerStock = Math.floor(stockLength / barLength) || 1;
	const stocksNeeded = Math.ceil(barCount / cutsPerStock);
	const wastePerStock = stockLength - cutsPerStock * barLength;
	const totalWaste = stocksNeeded * wastePerStock;

	const netLength = barCount * barLength;
	const grossLength = stocksNeeded * stockLength;

	const netWeight = netLength * weight;
	const grossWeight = grossLength * weight;
	const wastePercentage = grossLength > 0 ? (totalWaste / grossLength) * 100 : 0;

	return {
		description,
		diameter,
		barLength: Number(barLength.toFixed(3)),
		barCount,
		stockLength,
		stocksNeeded,
		cutsPerStock,
		wastePerStock: Number(wastePerStock.toFixed(3)),
		totalWaste: Number(totalWaste.toFixed(2)),
		wastePercentage: Number(wastePercentage.toFixed(1)),
		netWeight: Number(netWeight.toFixed(2)),
		grossWeight: Number(grossWeight.toFixed(2)),
	};
}

// حساب تفاصيل القص لجميع طبقات حديد السلم (4 طبقات)
function computeStairCuttingDetails(params: {
	flightLength: number;
	landingLength: number;
	width: number;
	mainBarDiameter: number;
	mainBarsPerMeter: number;
	secondaryBarDiameter: number;
	secondaryBarsPerMeter: number;
}): CuttingDetail[] {
	const {
		flightLength, landingLength, width,
		mainBarDiameter, mainBarsPerMeter,
		secondaryBarDiameter, secondaryBarsPerMeter,
	} = params;

	const totalLength = flightLength + landingLength;
	const mainBarsCount = Math.ceil(width * mainBarsPerMeter) + 1;
	const secondaryBarsCount = Math.ceil(totalLength * secondaryBarsPerMeter) + 1;

	const mainDevLength = STAIR_REBAR_DEFAULTS.DEV_LENGTH_MULTIPLIER * (mainBarDiameter / 1000);
	const mainHookLength = STAIR_REBAR_DEFAULTS.HOOK_MULTIPLIER * (mainBarDiameter / 1000);
	const secDevLength = STAIR_REBAR_DEFAULTS.DEV_LENGTH_MULTIPLIER * (secondaryBarDiameter / 1000);
	const secHookLength = STAIR_REBAR_DEFAULTS.HOOK_MULTIPLIER * (secondaryBarDiameter / 1000);

	const topExtension = STAIR_REBAR_DEFAULTS.TOP_BAR_EXTENSION_RATIO * flightLength;
	const secondaryBarSpacing = Math.round(1000 / secondaryBarsPerMeter);

	// الطبقة 1: حديد سفلي رئيسي (طولي)
	const bottomMainBarLength = roundUpTo5cm(totalLength + 2 * mainDevLength + 2 * mainHookLength);
	const bottomMainCutting = calculateCuttingDetail(
		"حديد سفلي رئيسي (طولي)",
		mainBarDiameter,
		bottomMainBarLength,
		mainBarsCount
	);

	// الطبقة 2: حديد سفلي ثانوي (عرضي)
	const bottomSecBarLength = roundUpTo5cm(width + 2 * secDevLength + 2 * secHookLength);
	const bottomSecCutting = calculateCuttingDetail(
		"حديد سفلي ثانوي (عرضي)",
		secondaryBarDiameter,
		bottomSecBarLength,
		secondaryBarsCount
	);

	// الطبقة 3: حديد علوي رئيسي (مساند)
	const topMainPieceLength = roundUpTo5cm(topExtension + mainDevLength + mainHookLength);
	const topMainCount = mainBarsCount * 2;
	const topMainCutting = calculateCuttingDetail(
		"حديد علوي رئيسي (مساند)",
		mainBarDiameter,
		topMainPieceLength,
		topMainCount
	);

	// الطبقة 4: حديد علوي ثانوي (توزيع مساند)
	const topSecBarLength = bottomSecBarLength;
	const topSecCount = 2 * (Math.ceil((topExtension * 1000) / secondaryBarSpacing) + 1);
	const topSecCutting = calculateCuttingDetail(
		"حديد علوي ثانوي (توزيع مساند)",
		secondaryBarDiameter,
		topSecBarLength,
		topSecCount
	);

	return [bottomMainCutting, bottomSecCutting, topMainCutting, topSecCutting];
}

export function StairsSection({
	studyId,
	organizationId,
	items,
	onSave,
	onUpdate,
	specs,
	buildingFloors,
}: StairsSectionProps) {
	const t = useTranslations();
	const [isAdding, setIsAdding] = useState(false);
	const [editingItemId, setEditingItemId] = useState<string | null>(null);
	const [showCuttingDetails, setShowCuttingDetails] = useState(false);

	const [formData, setFormData] = useState({
		name: "",
		width: 1.2, // متر
		flightLength: 3, // متر
		landingLength: 1.5, // متر
		landingWidth: 1.2, // متر
		thickness: 15, // سم
		risersCount: 10,
		riserHeight: 17, // سم
		treadDepth: 28, // سم
		mainBarDiameter: 14,
		mainBarsPerMeter: 7, // سيخ/متر (≈ 150 مم)
		secondaryBarDiameter: 10,
		secondaryBarsPerMeter: 5, // سيخ/متر (≈ 200 مم)
	});

	// Auto-mode state
	const [autoFormData, setAutoFormData] = useState({
		width: 1.2,
		landingLength: 1.5,
		landingWidth: 1.2,
		thickness: 15,
		riserHeight: 17,
		treadDepth: 28,
		mainBarDiameter: 14,
		mainBarsPerMeter: 7,
		secondaryBarDiameter: 10,
		secondaryBarsPerMeter: 5,
	});
	const [showAutoForm, setShowAutoForm] = useState(false);
	const [isAutoSaving, setIsAutoSaving] = useState(false);

	// Stair connections from building config
	const stairConnections = useMemo((): StairConnection[] => {
		if (!buildingFloors) return [];
		const enabled = buildingFloors.filter(f => f.enabled).sort((a, b) => a.sortOrder - b.sortOrder);
		const connections: StairConnection[] = [];
		for (let i = 0; i < enabled.length - 1; i++) {
			connections.push({
				id: `stair-${enabled[i].id}-${enabled[i + 1].id}`,
				fromFloor: { label: enabled[i].label, icon: enabled[i].icon },
				toFloor: { label: enabled[i + 1].label, icon: enabled[i + 1].icon },
				height: enabled[i + 1].height,
				label: `سلم من ${enabled[i].label} إلى ${enabled[i + 1].label}`,
			});
			if (enabled[i + 1].isRepeated && enabled[i + 1].repeatCount > 1) {
				for (let r = 1; r < enabled[i + 1].repeatCount; r++) {
					connections.push({
						id: `stair-repeated-${enabled[i + 1].id}-${r}`,
						fromFloor: { label: enabled[i + 1].label, icon: enabled[i + 1].icon },
						toFloor: { label: enabled[i + 1].label, icon: enabled[i + 1].icon },
						height: enabled[i + 1].height,
						label: `سلم الدور المتكرر ${r} إلى ${r + 1}`,
					});
				}
			}
		}
		return connections;
	}, [buildingFloors]);

	const isAutoMode = stairConnections.length > 0;

	// Auto-mode calculations
	const autoCalculations = useMemo((): ConnectionCalc[] | null => {
		if (!isAutoMode || !showAutoForm) return null;
		if (autoFormData.width <= 0 || autoFormData.riserHeight <= 0) return null;

		return stairConnections.map(conn => {
			const risersCount = Math.ceil((conn.height * 100) / autoFormData.riserHeight);
			const goingLength = risersCount * (autoFormData.treadDepth / 100);
			const flightLength = Math.sqrt(goingLength ** 2 + conn.height ** 2);

			const mainBarSpacing = Math.round(1000 / autoFormData.mainBarsPerMeter);
			const secondaryBarSpacing = Math.round(1000 / autoFormData.secondaryBarsPerMeter);

			const baseResult = calculateStairs({
				width: autoFormData.width,
				flightLength,
				landingLength: autoFormData.landingLength,
				landingWidth: autoFormData.landingWidth,
				thickness: autoFormData.thickness,
				risersCount,
				riserHeight: autoFormData.riserHeight,
				treadDepth: autoFormData.treadDepth,
				mainBarDiameter: autoFormData.mainBarDiameter,
				mainBarSpacing,
				secondaryBarDiameter: autoFormData.secondaryBarDiameter,
				secondaryBarSpacing,
				concreteType: specs?.concreteType || "C30",
			});

			// Calculate cutting details (4 layers)
			const cuttingDetails = computeStairCuttingDetails({
				flightLength,
				landingLength: autoFormData.landingLength,
				width: autoFormData.width,
				mainBarDiameter: autoFormData.mainBarDiameter,
				mainBarsPerMeter: autoFormData.mainBarsPerMeter,
				secondaryBarDiameter: autoFormData.secondaryBarDiameter,
				secondaryBarsPerMeter: autoFormData.secondaryBarsPerMeter,
			});
			const netWeight = cuttingDetails.reduce((sum, d) => sum + d.netWeight, 0);
			const grossWeight = cuttingDetails.reduce((sum, d) => sum + d.grossWeight, 0);
			const wasteWeight = grossWeight - netWeight;
			const wastePercentage = grossWeight > 0 ? (wasteWeight / grossWeight) * 100 : 0;

			const stocksMap = new Map<number, { diameter: number; count: number; length: number }>();
			cuttingDetails.forEach(d => {
				const existing = stocksMap.get(d.diameter);
				if (existing) { existing.count += d.stocksNeeded; }
				else { stocksMap.set(d.diameter, { diameter: d.diameter, count: d.stocksNeeded, length: d.stockLength }); }
			});

			return {
				connection: conn,
				risersCount,
				goingLength,
				flightLength,
				calculations: {
					...baseResult,
					cuttingDetails,
					totals: {
						netWeight: Number(netWeight.toFixed(2)),
						grossWeight: Number(grossWeight.toFixed(2)),
						wasteWeight: Number(wasteWeight.toFixed(2)),
						wastePercentage: Number(wastePercentage.toFixed(1)),
						stocksNeeded: Array.from(stocksMap.values()),
					},
				},
			};
		});
	}, [isAutoMode, showAutoForm, autoFormData, stairConnections, specs]);

	const autoTotals = useMemo(() => {
		if (!autoCalculations) return null;
		return {
			totalConcrete: autoCalculations.reduce((s, c) => s + c.calculations.concreteVolume, 0),
			totalSteel: autoCalculations.reduce((s, c) => s + c.calculations.totals.grossWeight, 0),
		};
	}, [autoCalculations]);

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

	const autoCreateMutation = useMutation(
		orpc.pricing.studies.structuralItem.create.mutationOptions({
			onSuccess: () => {},
			onError: () => toast.error("حدث خطأ"),
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

	// حساب نتائج السلم مع تفاصيل القص
	const calculations = useMemo((): EnhancedStairsResult | null => {
		if (formData.width <= 0 || formData.flightLength <= 0) return null;

		// تحويل الأسياخ/متر إلى تباعد بالمم للحسابات
		const mainBarSpacing = Math.round(1000 / formData.mainBarsPerMeter);
		const secondaryBarSpacing = Math.round(1000 / formData.secondaryBarsPerMeter);

		const baseResult = calculateStairs({
			width: formData.width,
			flightLength: formData.flightLength,
			landingLength: formData.landingLength,
			landingWidth: formData.landingWidth,
			thickness: formData.thickness,
			risersCount: formData.risersCount,
			riserHeight: formData.riserHeight,
			treadDepth: formData.treadDepth,
			mainBarDiameter: formData.mainBarDiameter,
			mainBarSpacing: mainBarSpacing,
			secondaryBarDiameter: formData.secondaryBarDiameter,
			secondaryBarSpacing: secondaryBarSpacing,
			concreteType: specs?.concreteType || "C30",
		});

		// حساب تفاصيل القص - 4 طبقات
		const cuttingDetails = computeStairCuttingDetails({
			flightLength: formData.flightLength,
			landingLength: formData.landingLength,
			width: formData.width,
			mainBarDiameter: formData.mainBarDiameter,
			mainBarsPerMeter: formData.mainBarsPerMeter,
			secondaryBarDiameter: formData.secondaryBarDiameter,
			secondaryBarsPerMeter: formData.secondaryBarsPerMeter,
		});

		// حساب الإجماليات
		const netWeight = cuttingDetails.reduce((sum, d) => sum + d.netWeight, 0);
		const grossWeight = cuttingDetails.reduce((sum, d) => sum + d.grossWeight, 0);
		const wasteWeight = grossWeight - netWeight;
		const wastePercentage = grossWeight > 0 ? (wasteWeight / grossWeight) * 100 : 0;

		// تجميع الأسياخ حسب القطر
		const stocksMap = new Map<number, { diameter: number; count: number; length: number }>();
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
			...baseResult,
			cuttingDetails,
			totals: {
				netWeight: Number(netWeight.toFixed(2)),
				grossWeight: Number(grossWeight.toFixed(2)),
				wasteWeight: Number(wasteWeight.toFixed(2)),
				wastePercentage: Number(wastePercentage.toFixed(1)),
				stocksNeeded: Array.from(stocksMap.values()),
			},
		};
	}, [formData, specs]);

	const handleSubmit = async () => {
		if (!formData.name || !calculations) return;

		const itemData = {
			costStudyId: studyId,
			organizationId,
			category: "stairs",
			name: formData.name,
			quantity: 1,
			unit: "m2",
			dimensions: {
				width: formData.width,
				flightLength: formData.flightLength,
				landingLength: formData.landingLength,
				landingWidth: formData.landingWidth,
				thickness: formData.thickness,
				risersCount: formData.risersCount,
				mainDiameter: formData.mainBarDiameter,
				mainBarsPerMeter: formData.mainBarsPerMeter,
				secondaryDiameter: formData.secondaryBarDiameter,
				secondaryBarsPerMeter: formData.secondaryBarsPerMeter,
			},
			concreteVolume: calculations.concreteVolume,
			concreteType: specs?.concreteType || "C30",
			steelWeight: calculations.totals.grossWeight,
			steelRatio: (calculations.totals.grossWeight / calculations.concreteVolume) || 0,
			materialCost: calculations.concreteCost + calculations.rebarCost,
			laborCost: calculations.laborCost,
			totalCost: calculations.totalCost,
		};

		if (editingItemId) {
			(updateMutation as any).mutate({ ...itemData, id: editingItemId, costStudyId: studyId });
		} else {
			(createMutation as any).mutate(itemData);
		}
	};

	const handleAutoSave = async () => {
		if (!autoCalculations) return;
		setIsAutoSaving(true);
		try {
			for (const calc of autoCalculations) {
				const itemData = {
					costStudyId: studyId,
					organizationId,
					category: "stairs",
					name: calc.connection.label,
					quantity: 1,
					unit: "m2",
					dimensions: {
						width: autoFormData.width,
						flightLength: calc.flightLength,
						landingLength: autoFormData.landingLength,
						landingWidth: autoFormData.landingWidth,
						thickness: autoFormData.thickness,
						risersCount: calc.risersCount,
						riserHeight: autoFormData.riserHeight,
						treadDepth: autoFormData.treadDepth,
						mainDiameter: autoFormData.mainBarDiameter,
						mainBarsPerMeter: autoFormData.mainBarsPerMeter,
						secondaryDiameter: autoFormData.secondaryBarDiameter,
						secondaryBarsPerMeter: autoFormData.secondaryBarsPerMeter,
						floor: calc.connection.toFloor.label,
						floorHeight: calc.connection.height,
					},
					concreteVolume: calc.calculations.concreteVolume,
					concreteType: specs?.concreteType || "C30",
					steelWeight: calc.calculations.totals.grossWeight,
					steelRatio: calc.calculations.concreteVolume > 0 ? calc.calculations.totals.grossWeight / calc.calculations.concreteVolume : 0,
					materialCost: calc.calculations.concreteCost + calc.calculations.rebarCost,
					laborCost: calc.calculations.laborCost,
					totalCost: calc.calculations.totalCost,
				};
				await (autoCreateMutation as any).mutateAsync(itemData);
			}
			toast.success(`تم إنشاء ${autoCalculations.length} سلم بنجاح`);
			setShowAutoForm(false);
			onSave();
		} catch (e) {
			toast.error("حدث خطأ أثناء حفظ السلالم");
		}
		setIsAutoSaving(false);
	};

	const handleDelete = (id: string) => {
		if (confirm(t("pricing.studies.messages.confirmDelete"))) {
			(deleteMutation as any).mutate({ id, organizationId, costStudyId: studyId });
		}
	};

	return (
		<div className="space-y-4">
			{items.length > 0 && (
				<div className="border rounded-lg overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-right">{t("pricing.studies.structural.itemName")}</TableHead>
								<TableHead className="text-right">{t("pricing.studies.area")}</TableHead>
								<TableHead className="text-right">{t("pricing.studies.structural.concreteVolume")}</TableHead>
								<TableHead className="text-right">{t("pricing.studies.structural.steelWeight")}</TableHead>
								<TableHead className="w-12"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item) => (
								<TableRow key={item.id}>
									<TableCell className="font-medium">{item.name}</TableCell>
									<TableCell>
										{formatNumber(
											(item.dimensions?.flightLength || 0) * (item.dimensions?.width || 0) +
											(item.dimensions?.landingLength || 0) * (item.dimensions?.width || 0)
										)}{" "}
										{t("pricing.studies.units.m2")}
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
														width: item.dimensions?.width || 1.2,
														flightLength: Number((item.dimensions?.flightLength || 3).toFixed(2)),
														landingLength: item.dimensions?.landingLength || 1.5,
														landingWidth: item.dimensions?.landingWidth || 1.2,
														thickness: item.dimensions?.thickness || 15,
														risersCount: item.dimensions?.risersCount || 10,
														riserHeight: 17,
														treadDepth: 28,
														mainBarDiameter: item.dimensions?.mainDiameter || 14,
														mainBarsPerMeter: item.dimensions?.mainBarsPerMeter || 7,
														secondaryBarDiameter: item.dimensions?.secondaryDiameter || 10,
														secondaryBarsPerMeter: item.dimensions?.secondaryBarsPerMeter || 5,
													});
												}}
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

			{/* Auto-mode section */}
			{isAutoMode && !isAdding && (
				showAutoForm ? (
					<Card className="border-dashed border-2 border-emerald-500/50">
						<CardContent className="p-4 space-y-4">
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2">
									<Building2 className="h-5 w-5 text-emerald-600" />
									<h4 className="font-medium">حساب السلالم تلقائيا من إعدادات المبنى</h4>
									<Badge variant="secondary" className="text-xs">{stairConnections.length} سلم</Badge>
								</div>
								<Button variant="ghost" size="icon" onClick={() => setShowAutoForm(false)}><X className="h-4 w-4" /></Button>
							</div>

							{/* Stair connections preview */}
							<div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 rounded-lg p-3">
								<h5 className="text-sm font-medium mb-2">السلالم المطلوبة:</h5>
								<div className="flex flex-wrap gap-2">
									{stairConnections.map(conn => (
										<Badge key={conn.id} variant="outline" className="text-xs">
											{conn.fromFloor.icon} {conn.fromFloor.label} &rarr; {conn.toFloor.icon} {conn.toFloor.label} ({conn.height} م)
										</Badge>
									))}
								</div>
							</div>

							{/* Unified form inputs (same for all stairs) */}
							<div className="border rounded-lg p-4 bg-slate-50/30 dark:bg-slate-900/30">
								<h5 className="font-medium mb-3">أبعاد موحدة لجميع السلالم</h5>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div>
										<Label>{t("pricing.studies.structural.width")} ({t("pricing.studies.units.m")})</Label>
										<Input type="number" step="0.1" min={0} value={autoFormData.width}
											onChange={(e: any) => setAutoFormData({ ...autoFormData, width: +e.target.value })} />
									</div>
									<div>
										<Label>طول البسطة ({t("pricing.studies.units.m")})</Label>
										<Input type="number" step="0.1" min={0} value={autoFormData.landingLength}
											onChange={(e: any) => setAutoFormData({ ...autoFormData, landingLength: +e.target.value })} />
									</div>
									<div>
										<Label>{t("pricing.studies.structural.thickness")} ({t("pricing.studies.units.cm")})</Label>
										<Select value={autoFormData.thickness.toString()} onValueChange={(v: any) => setAutoFormData({ ...autoFormData, thickness: +v })}>
											<SelectTrigger><SelectValue /></SelectTrigger>
											<SelectContent>
												{[12, 14, 15, 16, 18, 20].map(th => (
													<SelectItem key={th} value={th.toString()}>{th} سم</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div>
										<Label>ارتفاع القائمة ({t("pricing.studies.units.cm")})</Label>
										<Select value={autoFormData.riserHeight.toString()} onValueChange={(v: any) => setAutoFormData({ ...autoFormData, riserHeight: +v })}>
											<SelectTrigger><SelectValue /></SelectTrigger>
											<SelectContent>
												{[15, 16, 17, 18, 19, 20].map(h => (
													<SelectItem key={h} value={h.toString()}>{h} سم</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div>
										<Label>عمق النائمة ({t("pricing.studies.units.cm")})</Label>
										<Select value={autoFormData.treadDepth.toString()} onValueChange={(v: any) => setAutoFormData({ ...autoFormData, treadDepth: +v })}>
											<SelectTrigger><SelectValue /></SelectTrigger>
											<SelectContent>
												{[25, 27, 28, 30, 32].map(d => (
													<SelectItem key={d} value={d.toString()}>{d} سم</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>

							{/* Reinforcement */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<RebarMeshInput title="الحديد الرئيسي (الطولي)" diameter={autoFormData.mainBarDiameter}
									onDiameterChange={d => setAutoFormData({ ...autoFormData, mainBarDiameter: d })}
									barsPerMeter={autoFormData.mainBarsPerMeter}
									onBarsPerMeterChange={n => setAutoFormData({ ...autoFormData, mainBarsPerMeter: n })}
									colorScheme="blue" availableDiameters={[10, 12, 14, 16, 18, 20]} />
								<RebarMeshInput title="الحديد الثانوي (التوزيع)" diameter={autoFormData.secondaryBarDiameter}
									onDiameterChange={d => setAutoFormData({ ...autoFormData, secondaryBarDiameter: d })}
									barsPerMeter={autoFormData.secondaryBarsPerMeter}
									onBarsPerMeterChange={n => setAutoFormData({ ...autoFormData, secondaryBarsPerMeter: n })}
									colorScheme="green" availableDiameters={[8, 10, 12, 14]} />
							</div>

							{/* Per-connection results table */}
							{autoCalculations && autoCalculations.length > 0 && (
								<div className="bg-muted/50 rounded-lg p-4 space-y-3">
									<div className="flex items-center gap-2">
										<Calculator className="h-5 w-5 text-primary" />
										<h4 className="font-medium">نتائج الحساب لكل سلم</h4>
									</div>
									<div className="border rounded-lg overflow-hidden">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="text-right">السلم</TableHead>
													<TableHead className="text-right">الارتفاع</TableHead>
													<TableHead className="text-right">القوائم</TableHead>
													<TableHead className="text-right">طول المائل</TableHead>
													<TableHead className="text-right">خرسانة</TableHead>
													<TableHead className="text-right">حديد</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{autoCalculations.map(calc => (
													<TableRow key={calc.connection.id}>
														<TableCell className="font-medium text-sm">{calc.connection.label}</TableCell>
														<TableCell>{formatNumber(calc.connection.height)} م</TableCell>
														<TableCell>{calc.risersCount}</TableCell>
														<TableCell>{formatNumber(calc.flightLength)} م</TableCell>
														<TableCell>{formatNumber(calc.calculations.concreteVolume)} م&#179;</TableCell>
														<TableCell>{formatNumber(calc.calculations.totals.grossWeight)} كجم</TableCell>
													</TableRow>
												))}
												{/* Totals row */}
												{autoTotals && (
													<TableRow className="bg-muted/30 font-bold">
														<TableCell colSpan={4}>إجمالي</TableCell>
														<TableCell>{formatNumber(autoTotals.totalConcrete)} م&#179;</TableCell>
														<TableCell>{formatNumber(autoTotals.totalSteel)} كجم</TableCell>
													</TableRow>
												)}
											</TableBody>
										</Table>
									</div>
								</div>
							)}

							{/* Save/Cancel */}
							<div className="flex justify-end gap-2">
								<Button variant="outline" onClick={() => setShowAutoForm(false)}>
									{t("pricing.studies.form.cancel")}
								</Button>
								<Button onClick={handleAutoSave} disabled={isAutoSaving || !autoCalculations || autoCalculations.length === 0}
									className="bg-emerald-600 hover:bg-emerald-700">
									<Save className="h-4 w-4 ml-2" />
									حفظ {autoCalculations?.length || 0} سلم
								</Button>
							</div>
						</CardContent>
					</Card>
				) : (
					<Button variant="outline"
						className="w-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-2 border-dashed border-emerald-400/40 hover:bg-emerald-500/20 hover:border-emerald-400/60 transition-all"
						onClick={() => setShowAutoForm(true)}>
						<Building2 className="h-5 w-5 ml-2" />
						<span className="font-semibold">حساب السلالم من إعدادات المبنى</span>
						<Badge variant="secondary" className="mr-2 text-xs">{stairConnections.length} سلم</Badge>
					</Button>
				)
			)}

			{isAdding ? (
				<Card className="border-dashed border-2 border-primary/50">
					<CardContent className="p-4 space-y-4">
						<div className="flex items-center justify-between mb-4">
							<h4 className="font-medium">
								{editingItemId ? t("pricing.studies.structural.editItem") : t("pricing.studies.structural.addItem")}
							</h4>
							<Button variant="ghost" size="icon" onClick={() => { setIsAdding(false); setEditingItemId(null); }}>
								<X className="h-4 w-4" />
							</Button>
						</div>

						{/* البيانات الأساسية */}
						<ElementHeaderRow
							autoNamePrefix={ELEMENT_PREFIXES.stairs}
							existingCount={items.length}
							name={formData.name}
							onNameChange={(name) => setFormData({ ...formData, name })}
							quantity={1}
							onQuantityChange={() => {}}
							showConcreteType={false}
							showQuantity={false}
							showSubType={false}
						/>

						{/* أبعاد السلم */}
						<div className="border rounded-lg p-4 bg-slate-50/30 dark:bg-slate-900/30">
							<h5 className="font-medium mb-3">أبعاد السلم</h5>
							<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
								<div>
									<Label>{t("pricing.studies.structural.width")} ({t("pricing.studies.units.m")})</Label>
									<Input
										type="number"
										step="0.1"
										min={0}
										value={formData.width}
										onChange={(e: any) =>
											setFormData({ ...formData, width: +e.target.value })
										}
									/>
								</div>
								<div>
									<Label>طول الجزء المائل ({t("pricing.studies.units.m")})</Label>
									<Input
										type="number"
										step="0.1"
										min={0}
										value={formData.flightLength}
										onChange={(e: any) =>
											setFormData({ ...formData, flightLength: +e.target.value })
										}
									/>
								</div>
								<div>
									<Label>طول البسطة ({t("pricing.studies.units.m")})</Label>
									<Input
										type="number"
										step="0.1"
										min={0}
										value={formData.landingLength}
										onChange={(e: any) =>
											setFormData({ ...formData, landingLength: +e.target.value })
										}
									/>
								</div>
								<div>
									<Label>{t("pricing.studies.structural.thickness")} ({t("pricing.studies.units.cm")})</Label>
									<Select
										value={formData.thickness.toString()}
										onValueChange={(v: any) =>
											setFormData({ ...formData, thickness: +v })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{[12, 14, 15, 16, 18, 20].map((t) => (
												<SelectItem key={t} value={t.toString()}>
													{t} سم
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="bg-muted/50 rounded p-2 flex flex-col justify-center">
									<span className="text-xs text-muted-foreground">المساحة</span>
									<span className="font-bold">
										{formatNumber(
											formData.flightLength * formData.width +
											formData.landingLength * formData.landingWidth
										)} م²
									</span>
								</div>
							</div>
						</div>

						{/* الدرجات */}
						<div className="border rounded-lg p-4 bg-amber-50/30 dark:bg-amber-900/20">
							<h5 className="font-medium mb-3">الدرجات</h5>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div>
									<Label>عدد القوائم</Label>
									<Input
										type="number"
										min={1}
										value={formData.risersCount}
										onChange={(e: any) =>
											setFormData({ ...formData, risersCount: +e.target.value })
										}
									/>
								</div>
								<div>
									<Label>ارتفاع القائمة ({t("pricing.studies.units.cm")})</Label>
									<Select
										value={formData.riserHeight.toString()}
										onValueChange={(v: any) =>
											setFormData({ ...formData, riserHeight: +v })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{[15, 16, 17, 18, 19, 20].map((h) => (
												<SelectItem key={h} value={h.toString()}>
													{h} سم
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label>عمق النائمة ({t("pricing.studies.units.cm")})</Label>
									<Select
										value={formData.treadDepth.toString()}
										onValueChange={(v: any) =>
											setFormData({ ...formData, treadDepth: +v })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{[25, 27, 28, 30, 32].map((d) => (
												<SelectItem key={d} value={d.toString()}>
													{d} سم
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="bg-muted/50 rounded p-2 flex flex-col justify-center">
									<span className="text-xs text-muted-foreground">الارتفاع الكلي</span>
									<span className="font-bold">
										{formatNumber((formData.risersCount * formData.riserHeight) / 100)} م
									</span>
								</div>
							</div>
						</div>

						{/* التسليح */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<RebarMeshInput
								title="الحديد الرئيسي (الطولي)"
								diameter={formData.mainBarDiameter}
								onDiameterChange={(d) =>
									setFormData({ ...formData, mainBarDiameter: d })
								}
								barsPerMeter={formData.mainBarsPerMeter}
								onBarsPerMeterChange={(n) =>
									setFormData({ ...formData, mainBarsPerMeter: n })
								}
								colorScheme="blue"
								availableDiameters={[10, 12, 14, 16, 18, 20]}
							/>
							<RebarMeshInput
								title="الحديد الثانوي (التوزيع)"
								diameter={formData.secondaryBarDiameter}
								onDiameterChange={(d) =>
									setFormData({ ...formData, secondaryBarDiameter: d })
								}
								barsPerMeter={formData.secondaryBarsPerMeter}
								onBarsPerMeterChange={(n) =>
									setFormData({ ...formData, secondaryBarsPerMeter: n })
								}
								colorScheme="green"
								availableDiameters={[8, 10, 12, 14]}
							/>
						</div>

						{/* نتائج الحساب */}
						{calculations && (
							<div className="bg-muted/50 rounded-lg p-4 space-y-4">
								<div className="flex items-center gap-2 mb-3">
									<Calculator className="h-5 w-5 text-primary" />
									<h4 className="font-medium">{t("pricing.studies.calculations.results")}</h4>
								</div>
								<CalculationResultsPanel
									concreteVolume={calculations.concreteVolume}
									totals={calculations.totals}
									cuttingDetails={calculations.cuttingDetails.map((detail) => ({
										description: detail.description,
										diameter: detail.diameter,
										barLength: detail.barLength,
										barCount: detail.barCount,
										cutsPerStock: detail.cutsPerStock,
										stocksNeeded: detail.stocksNeeded,
										weight: detail.grossWeight,
										grossWeight: detail.grossWeight,
										wastePercentage: detail.wastePercentage,
									}))}
									showCuttingDetails={showCuttingDetails}
									onToggleCuttingDetails={setShowCuttingDetails}
									showCutsPerStock={true}
								/>
							</div>
						)}

						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => { setIsAdding(false); setEditingItemId(null); }}>
								{t("pricing.studies.form.cancel")}
							</Button>
							<Button
								onClick={handleSubmit}
								disabled={createMutation.isPending || updateMutation.isPending || !formData.name || !calculations}
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
					<h4 className="font-medium mb-2">{t("pricing.studies.summary.totalItems")}</h4>
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">
								{t("pricing.studies.summary.totalConcrete")}:
							</span>
							<p className="font-bold">
								{formatNumber(items.reduce((sum, i) => sum + i.concreteVolume, 0))}{" "}
								{t("pricing.studies.units.m3")}
							</p>
						</div>
						<div>
							<span className="text-muted-foreground">
								{t("pricing.studies.summary.totalRebar")}:
							</span>
							<p className="font-bold">
								{formatNumber(items.reduce((sum, i) => sum + i.steelWeight, 0))}{" "}
								{t("pricing.studies.units.kg")}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
