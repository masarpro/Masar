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

export function StairsSection({
	studyId,
	organizationId,
	items,
	onSave,
	onUpdate,
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
		concreteType: "C30",
	});

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
			concreteType: formData.concreteType,
		});

		// حساب تفاصيل القص للحديد الرئيسي والثانوي
		const totalLength = formData.flightLength + formData.landingLength;

		// الحديد الرئيسي (الطولي)
		const mainBarLength = totalLength + 0.5; // إضافة الرجوع
		const mainBarsCount = Math.ceil(formData.width * formData.mainBarsPerMeter) + 1;
		const mainCutting = calculateCuttingDetail(
			"حديد رئيسي (طولي)",
			formData.mainBarDiameter,
			mainBarLength,
			mainBarsCount
		);

		// الحديد الثانوي (العرضي)
		const secondaryBarLength = formData.width + 0.3;
		const secondaryBarsCount = Math.ceil(totalLength * formData.secondaryBarsPerMeter) + 1;
		const secondaryCutting = calculateCuttingDetail(
			"حديد ثانوي (عرضي)",
			formData.secondaryBarDiameter,
			secondaryBarLength,
			secondaryBarsCount
		);

		const cuttingDetails = [mainCutting, secondaryCutting];

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
	}, [formData]);

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
				thickness: formData.thickness,
				risersCount: formData.risersCount,
			},
			concreteVolume: calculations.concreteVolume,
			concreteType: formData.concreteType,
			steelWeight: calculations.totals.grossWeight,
			steelRatio: (calculations.totals.grossWeight / calculations.concreteVolume) || 0,
			materialCost: calculations.concreteCost + calculations.rebarCost,
			laborCost: calculations.laborCost,
			totalCost: calculations.totalCost,
		};

		if (editingItemId) {
			updateMutation.mutate({ ...itemData, id: editingItemId, costStudyId: studyId });
		} else {
			createMutation.mutate(itemData);
		}
	};

	const handleDelete = (id: string) => {
		if (confirm(t("pricing.studies.messages.confirmDelete"))) {
			deleteMutation.mutate({ id, organizationId, costStudyId: studyId });
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
														flightLength: item.dimensions?.flightLength || 3,
														landingLength: item.dimensions?.landingLength || 1.5,
														landingWidth: 1.2,
														thickness: item.dimensions?.thickness || 15,
														risersCount: item.dimensions?.risersCount || 10,
														riserHeight: 17,
														treadDepth: 28,
														mainBarDiameter: 14,
														mainBarsPerMeter: 7,
														secondaryBarDiameter: 10,
														secondaryBarsPerMeter: 5,
														concreteType: "C30",
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
							concreteType={formData.concreteType}
							onConcreteTypeChange={(type) =>
								setFormData({ ...formData, concreteType: type })
							}
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
										onChange={(e) =>
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
										onChange={(e) =>
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
										onChange={(e) =>
											setFormData({ ...formData, landingLength: +e.target.value })
										}
									/>
								</div>
								<div>
									<Label>{t("pricing.studies.structural.thickness")} ({t("pricing.studies.units.cm")})</Label>
									<Select
										value={formData.thickness.toString()}
										onValueChange={(v) =>
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
										onChange={(e) =>
											setFormData({ ...formData, risersCount: +e.target.value })
										}
									/>
								</div>
								<div>
									<Label>ارتفاع القائمة ({t("pricing.studies.units.cm")})</Label>
									<Select
										value={formData.riserHeight.toString()}
										onValueChange={(v) =>
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
										onValueChange={(v) =>
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
					className="w-full border-dashed"
					onClick={() => setIsAdding(true)}
				>
					<Plus className="h-4 w-4 ml-2" />
					{t("pricing.studies.structural.addItem")}
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
