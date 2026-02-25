"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
import {
	calculateIsolatedFoundation,
	calculateStripFoundation,
	calculateRaftFoundation,
	type IsolatedFoundationResult,
	type StripFoundationResult,
	type RaftFoundationResult,
} from "../../../lib/structural-calculations";
import type { IsolatedFoundationInput, StripFoundationInput, RaftFoundationInput } from "../../../types/foundations";
import { formatNumber, formatCurrency, ELEMENT_PREFIXES } from "../../../lib/utils";
import { CONCRETE_TYPES, REBAR_DIAMETERS } from "../../../constants/prices";
import {
	ElementHeaderRow,
	DimensionsCard,
	RebarMeshInput,
	RebarBarsInput,
	StirrupsInput,
	CalculationResultsPanel,
} from "../shared";

interface FoundationsSectionProps {
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

type FoundationType = "isolated" | "combined" | "strip" | "raft";

interface FormData {
	name: string;
	type: FoundationType;
	quantity: number;
	length: number;
	width: number;
	height: number;
	concreteType: string;
	cover: number;
	hookLength: number;
	// حديد الفرش القصير (سفلي)
	bottomShortDiameter: number;
	bottomShortBarsPerMeter: number;
	// حديد الفرش الطويل (سفلي)
	bottomLongDiameter: number;
	bottomLongBarsPerMeter: number;
	// حديد الغطاء القصير (علوي)
	hasTopShort: boolean;
	topShortDiameter: number;
	topShortBarsPerMeter: number;
	// حديد الغطاء الطويل (علوي)
	hasTopLong: boolean;
	topLongDiameter: number;
	topLongBarsPerMeter: number;
	// للقواعد الشريطية
	segments: Array<{ length: number }>;
	bottomMainCount: number;
	bottomMainDiameter: number;
	hasStirrup: boolean;
	stirrupDiameter: number;
	stirrupSpacing: number;
	// للبشة
	thickness: number;
	bottomXDiameter: number;
	bottomXBarsPerMeter: number;
	bottomYDiameter: number;
	bottomYBarsPerMeter: number;
	hasTopMesh: boolean;
	topXDiameter: number;
	topXBarsPerMeter: number;
	topYDiameter: number;
	topYBarsPerMeter: number;
}

const FOUNDATION_TYPE_INFO: Record<FoundationType, { nameAr: string; description: string }> = {
	isolated: { nameAr: "قاعدة معزولة", description: "قاعدة منفصلة لعمود واحد" },
	combined: { nameAr: "قاعدة مشتركة", description: "قاعدة لعدة أعمدة" },
	strip: { nameAr: "قاعدة شريطية", description: "قاعدة شريطية متصلة" },
	raft: { nameAr: "لبشة", description: "قاعدة حصيرية كاملة" },
};

type CalculationResult = IsolatedFoundationResult | StripFoundationResult | RaftFoundationResult;

export function FoundationsSection({
	studyId,
	organizationId,
	items,
	onSave,
	onUpdate,
}: FoundationsSectionProps) {
	const t = useTranslations();
	const [isAdding, setIsAdding] = useState(false);
	const [editingItemId, setEditingItemId] = useState<string | null>(null);
	const [showCuttingDetails, setShowCuttingDetails] = useState(false);

	const [formData, setFormData] = useState<FormData>({
		name: "",
		type: "isolated",
		quantity: 1,
		length: 0,
		width: 0,
		height: 0.6,
		concreteType: "C30",
		cover: 0.075,
		hookLength: 0.10,
		// فرش قصير سفلي
		bottomShortDiameter: 16,
		bottomShortBarsPerMeter: 5,
		// فرش طويل سفلي
		bottomLongDiameter: 16,
		bottomLongBarsPerMeter: 5,
		// غطاء قصير علوي
		hasTopShort: true,
		topShortDiameter: 12,
		topShortBarsPerMeter: 4,
		// غطاء طويل علوي
		hasTopLong: true,
		topLongDiameter: 12,
		topLongBarsPerMeter: 4,
		// شريطية
		segments: [{ length: 10 }],
		bottomMainCount: 6,
		bottomMainDiameter: 16,
		hasStirrup: true,
		stirrupDiameter: 10,
		stirrupSpacing: 200,
		// لبشة
		thickness: 0.6,
		bottomXDiameter: 16,
		bottomXBarsPerMeter: 5,
		bottomYDiameter: 16,
		bottomYBarsPerMeter: 5,
		hasTopMesh: true,
		topXDiameter: 12,
		topXBarsPerMeter: 4,
		topYDiameter: 12,
		topYBarsPerMeter: 4,
	});

	// حساب النتائج بناءً على نوع القاعدة
	const calculations = useMemo((): CalculationResult | null => {
		if (formData.type === "isolated" || formData.type === "combined") {
			if (formData.length <= 0 || formData.width <= 0 || formData.height <= 0) return null;

			const input: IsolatedFoundationInput = {
				quantity: formData.quantity,
				length: formData.length,
				width: formData.width,
				height: formData.height,
				cover: formData.cover,
				hookLength: formData.hookLength,
				bottomShort: {
					diameter: formData.bottomShortDiameter,
					barsPerMeter: formData.bottomShortBarsPerMeter,
				},
				bottomLong: {
					diameter: formData.bottomLongDiameter,
					barsPerMeter: formData.bottomLongBarsPerMeter,
				},
				topShort: formData.hasTopShort ? {
					diameter: formData.topShortDiameter,
					barsPerMeter: formData.topShortBarsPerMeter,
				} : undefined,
				topLong: formData.hasTopLong ? {
					diameter: formData.topLongDiameter,
					barsPerMeter: formData.topLongBarsPerMeter,
				} : undefined,
				concreteType: formData.concreteType,
			};

			return calculateIsolatedFoundation(input);
		}

		if (formData.type === "strip") {
			if (formData.width <= 0 || formData.height <= 0) return null;
			const totalLength = formData.segments.reduce((sum, seg) => sum + seg.length, 0);
			if (totalLength <= 0) return null;

			const input: StripFoundationInput = {
				segments: formData.segments,
				width: formData.width,
				height: formData.height,
				cover: formData.cover,
				hookLength: formData.hookLength,
				bottomMain: {
					count: formData.bottomMainCount,
					diameter: formData.bottomMainDiameter,
				},
				stirrups: formData.hasStirrup ? {
					diameter: formData.stirrupDiameter,
					spacing: formData.stirrupSpacing / 1000,
				} : undefined,
				concreteType: formData.concreteType,
			};

			return calculateStripFoundation(input);
		}

		if (formData.type === "raft") {
			if (formData.length <= 0 || formData.width <= 0 || formData.thickness <= 0) return null;

			const input: RaftFoundationInput = {
				length: formData.length,
				width: formData.width,
				thickness: formData.thickness,
				cover: formData.cover,
				bottomX: {
					diameter: formData.bottomXDiameter,
					barsPerMeter: formData.bottomXBarsPerMeter,
				},
				bottomY: {
					diameter: formData.bottomYDiameter,
					barsPerMeter: formData.bottomYBarsPerMeter,
				},
				topX: formData.hasTopMesh ? {
					diameter: formData.topXDiameter,
					barsPerMeter: formData.topXBarsPerMeter,
				} : undefined,
				topY: formData.hasTopMesh ? {
					diameter: formData.topYDiameter,
					barsPerMeter: formData.topYBarsPerMeter,
				} : undefined,
				concreteType: formData.concreteType,
			};

			return calculateRaftFoundation(input);
		}

		return null;
	}, [formData]);

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
		})
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

	const resetForm = () => {
		setFormData({
			name: "",
			type: "isolated",
			quantity: 1,
			length: 0,
			width: 0,
			height: 0.6,
			concreteType: "C30",
			cover: 0.075,
			hookLength: 0.10,
			bottomShortDiameter: 16,
			bottomShortBarsPerMeter: 5,
			bottomLongDiameter: 16,
			bottomLongBarsPerMeter: 5,
			hasTopShort: true,
			topShortDiameter: 12,
			topShortBarsPerMeter: 4,
			hasTopLong: true,
			topLongDiameter: 12,
			topLongBarsPerMeter: 4,
			segments: [{ length: 10 }],
			bottomMainCount: 6,
			bottomMainDiameter: 16,
			hasStirrup: true,
			stirrupDiameter: 10,
			stirrupSpacing: 200,
			thickness: 0.6,
			bottomXDiameter: 16,
			bottomXBarsPerMeter: 5,
			bottomYDiameter: 16,
			bottomYBarsPerMeter: 5,
			hasTopMesh: true,
			topXDiameter: 12,
			topXBarsPerMeter: 4,
			topYDiameter: 12,
			topYBarsPerMeter: 4,
		});
	};

	const handleSubmit = async () => {
		if (!formData.name || !calculations) return;

		const itemData = {
			costStudyId: studyId,
			organizationId,
			category: "foundations",
			subCategory: formData.type,
			name: formData.name,
			quantity: formData.quantity,
			unit: "m3",
			dimensions: {
				length: formData.length,
				width: formData.width,
				height: formData.height,
			},
			concreteVolume: calculations.concreteVolume,
			concreteType: formData.concreteType,
			steelWeight: calculations.totals.grossWeight,
			steelRatio: calculations.concreteVolume > 0
				? calculations.totals.grossWeight / calculations.concreteVolume
				: 0,
			materialCost: calculations.costs.concrete + calculations.costs.rebar,
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
		if (confirm(t("pricing.studies.messages.confirmDelete"))) {
			deleteMutation.mutate({ id, organizationId, costStudyId: studyId });
		}
	};

	return (
		<div className="space-y-4">
			{/* جدول العناصر الموجودة */}
			{items.length > 0 && (
				<div className="border rounded-lg overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-right">{t("pricing.studies.structural.itemName")}</TableHead>
								<TableHead className="text-right">النوع</TableHead>
								<TableHead className="text-right">{t("pricing.studies.structural.quantity")}</TableHead>
								<TableHead className="text-right">{t("pricing.studies.form.dimensions")}</TableHead>
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
										<Badge variant="outline">
											{FOUNDATION_TYPE_INFO[item.subCategory as FoundationType]?.nameAr || item.subCategory}
										</Badge>
									</TableCell>
									<TableCell>{item.quantity}</TableCell>
									<TableCell>
										{item.dimensions?.length || 0}×{item.dimensions?.width || 0}×
										{item.dimensions?.height || 0} {t("pricing.studies.units.m")}
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
														type: (item.subCategory as FoundationType) || "isolated",
														quantity: item.quantity,
														length: item.dimensions?.length || 0,
														width: item.dimensions?.width || 0,
														height: item.dimensions?.height || 0.6,
														concreteType: "C30",
														cover: 0.075,
														hookLength: 0.10,
														bottomShortDiameter: 16,
														bottomShortBarsPerMeter: 5,
														bottomLongDiameter: 16,
														bottomLongBarsPerMeter: 5,
														hasTopShort: true,
														topShortDiameter: 12,
														topShortBarsPerMeter: 4,
														hasTopLong: true,
														topLongDiameter: 12,
														topLongBarsPerMeter: 4,
														segments: [{ length: 10 }],
														bottomMainCount: 6,
														bottomMainDiameter: 16,
														hasStirrup: true,
														stirrupDiameter: 10,
														stirrupSpacing: 200,
														thickness: 0.6,
														bottomXDiameter: 16,
														bottomXBarsPerMeter: 5,
														bottomYDiameter: 16,
														bottomYBarsPerMeter: 5,
														hasTopMesh: true,
														topXDiameter: 12,
														topXBarsPerMeter: 4,
														topYDiameter: 12,
														topYBarsPerMeter: 4,
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

			{/* نموذج الإضافة */}
			{isAdding ? (
				<Card className="border-dashed border-2 border-primary/50">
					<CardContent className="p-4 space-y-4">
						<div className="flex items-center justify-between">
							<h4 className="font-medium">
								{editingItemId ? t("pricing.studies.structural.editItem") : t("pricing.studies.structural.addItem")}
							</h4>
							<Button variant="ghost" size="icon" onClick={() => { setIsAdding(false); setEditingItemId(null); resetForm(); }}>
								<X className="h-4 w-4" />
							</Button>
						</div>

						{/* البيانات الأساسية - صف واحد مضغوط */}
						<ElementHeaderRow
							autoNamePrefix={ELEMENT_PREFIXES.foundations}
							existingCount={items.length}
							name={formData.name}
							onNameChange={(name) => setFormData({ ...formData, name })}
							subTypes={Object.entries(FOUNDATION_TYPE_INFO).map(([key, info]) => ({
								value: key,
								label: info.nameAr,
							}))}
							selectedSubType={formData.type}
							onSubTypeChange={(type) => setFormData({ ...formData, type: type as FoundationType })}
							quantity={formData.quantity}
							onQuantityChange={(quantity) => setFormData({ ...formData, quantity })}
							concreteType={formData.concreteType}
							onConcreteTypeChange={(concreteType) => setFormData({ ...formData, concreteType })}
							showQuantity={formData.type === "isolated" || formData.type === "combined"}
						/>

						{/* الأبعاد - للقاعدة المعزولة والمشتركة */}
						{(formData.type === "isolated" || formData.type === "combined") && (
							<DimensionsCard
								title="أبعاد القاعدة"
								dimensions={[
									{ key: "length", label: "الطول", value: formData.length, unit: "م", step: 0.1 },
									{ key: "width", label: "العرض", value: formData.width, unit: "م", step: 0.1 },
									{ key: "height", label: "الارتفاع", value: formData.height, unit: "م", step: 0.1 },
								]}
								onDimensionChange={(key, value) => setFormData({ ...formData, [key]: value })}
								calculatedVolume={formData.length * formData.width * formData.height * formData.quantity}
							/>
						)}

						{/* الأبعاد - للقاعدة الشريطية */}
						{formData.type === "strip" && (
							<DimensionsCard
								title="أبعاد القاعدة الشريطية"
								dimensions={[
									{ key: "stripLength", label: "الطول الكلي", value: formData.segments[0]?.length || 0, unit: "م", step: 0.1 },
									{ key: "width", label: "العرض", value: formData.width, unit: "م", step: 0.1 },
									{ key: "height", label: "الارتفاع", value: formData.height, unit: "م", step: 0.1 },
								]}
								onDimensionChange={(key, value) => {
									if (key === "stripLength") {
										setFormData({ ...formData, segments: [{ length: value }] });
									} else {
										setFormData({ ...formData, [key]: value });
									}
								}}
								calculatedVolume={(formData.segments[0]?.length || 0) * formData.width * formData.height}
							/>
						)}

						{/* الأبعاد - للبشة */}
						{formData.type === "raft" && (
							<DimensionsCard
								title="أبعاد اللبشة"
								dimensions={[
									{ key: "length", label: "الطول", value: formData.length, unit: "م", step: 0.1 },
									{ key: "width", label: "العرض", value: formData.width, unit: "م", step: 0.1 },
									{ key: "thickness", label: "السماكة", value: formData.thickness, unit: "م", step: 0.1 },
								]}
								onDimensionChange={(key, value) => setFormData({ ...formData, [key]: value })}
								calculatedVolume={formData.length * formData.width * formData.thickness}
							/>
						)}

						{/* حديد التسليح - للقاعدة المعزولة والمشتركة */}
						{(formData.type === "isolated" || formData.type === "combined") && (
							<div className="border-t pt-4 space-y-4">
								<h4 className="font-medium flex items-center gap-2">
									<span className="w-2 h-2 rounded-full bg-primary" />
									تسليح القاعدة
								</h4>

								{/* الفرش السفلي */}
								<div className="space-y-3">
									<h5 className="text-sm font-medium text-blue-700">الشبكة السفلية (الفرش)</h5>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<RebarMeshInput
											title="الفرش السفلي"
											direction="الاتجاه القصير"
											diameter={formData.bottomShortDiameter}
											onDiameterChange={(d) => setFormData({ ...formData, bottomShortDiameter: d })}
											barsPerMeter={formData.bottomShortBarsPerMeter}
											onBarsPerMeterChange={(n) => setFormData({ ...formData, bottomShortBarsPerMeter: n })}
											colorScheme="blue"
											availableDiameters={REBAR_DIAMETERS.filter(d => d >= 12)}
											availableBarsPerMeter={[4, 5, 6, 7, 8]}
										/>
										<RebarMeshInput
											title="الفرش السفلي"
											direction="الاتجاه الطويل"
											diameter={formData.bottomLongDiameter}
											onDiameterChange={(d) => setFormData({ ...formData, bottomLongDiameter: d })}
											barsPerMeter={formData.bottomLongBarsPerMeter}
											onBarsPerMeterChange={(n) => setFormData({ ...formData, bottomLongBarsPerMeter: n })}
											colorScheme="blue"
											availableDiameters={REBAR_DIAMETERS.filter(d => d >= 12)}
											availableBarsPerMeter={[4, 5, 6, 7, 8]}
										/>
									</div>
								</div>

								{/* الغطاء العلوي */}
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<input
											type="checkbox"
											id="hasTopMesh"
											checked={formData.hasTopShort && formData.hasTopLong}
											onChange={(e) =>
												setFormData({
													...formData,
													hasTopShort: e.target.checked,
													hasTopLong: e.target.checked,
												})
											}
											className="rounded border-green-500"
										/>
										<Label htmlFor="hasTopMesh" className="text-sm font-medium text-green-700">
											الشبكة العلوية (الغطاء)
										</Label>
									</div>
									{(formData.hasTopShort || formData.hasTopLong) && (
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
											<RebarMeshInput
												title="الغطاء العلوي"
												direction="الاتجاه القصير"
												diameter={formData.topShortDiameter}
												onDiameterChange={(d) => setFormData({ ...formData, topShortDiameter: d })}
												barsPerMeter={formData.topShortBarsPerMeter}
												onBarsPerMeterChange={(n) => setFormData({ ...formData, topShortBarsPerMeter: n })}
												colorScheme="green"
												availableDiameters={REBAR_DIAMETERS.filter(d => d >= 10 && d <= 16)}
												availableBarsPerMeter={[3, 4, 5, 6]}
											/>
											<RebarMeshInput
												title="الغطاء العلوي"
												direction="الاتجاه الطويل"
												diameter={formData.topLongDiameter}
												onDiameterChange={(d) => setFormData({ ...formData, topLongDiameter: d })}
												barsPerMeter={formData.topLongBarsPerMeter}
												onBarsPerMeterChange={(n) => setFormData({ ...formData, topLongBarsPerMeter: n })}
												colorScheme="green"
												availableDiameters={REBAR_DIAMETERS.filter(d => d >= 10 && d <= 16)}
												availableBarsPerMeter={[3, 4, 5, 6]}
											/>
										</div>
									)}
								</div>
							</div>
						)}

						{/* حديد التسليح - للقاعدة الشريطية */}
						{formData.type === "strip" && (
							<div className="border-t pt-4 space-y-4">
								<h4 className="font-medium flex items-center gap-2">
									<span className="w-2 h-2 rounded-full bg-primary" />
									تسليح القاعدة الشريطية
								</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<RebarBarsInput
										title="الحديد الطولي الرئيسي"
										diameter={formData.bottomMainDiameter}
										onDiameterChange={(d) => setFormData({ ...formData, bottomMainDiameter: d })}
										barsCount={formData.bottomMainCount}
										onBarsCountChange={(n) => setFormData({ ...formData, bottomMainCount: n })}
										colorScheme="blue"
										availableDiameters={REBAR_DIAMETERS.filter(d => d >= 14)}
										availableBarsCount={[4, 5, 6, 8, 10]}
									/>
									<StirrupsInput
										diameter={formData.stirrupDiameter}
										onDiameterChange={(d) => setFormData({ ...formData, stirrupDiameter: d })}
										spacing={formData.stirrupSpacing}
										onSpacingChange={(s) => setFormData({ ...formData, stirrupSpacing: s })}
										availableDiameters={REBAR_DIAMETERS.filter(d => d <= 12)}
										availableSpacings={[150, 200, 250, 300]}
									/>
								</div>
							</div>
						)}

						{/* حديد التسليح - للبشة */}
						{formData.type === "raft" && (
							<div className="border-t pt-4 space-y-4">
								<h4 className="font-medium flex items-center gap-2">
									<span className="w-2 h-2 rounded-full bg-primary" />
									تسليح اللبشة
								</h4>

								{/* الشبكة السفلية */}
								<div className="space-y-3">
									<h5 className="text-sm font-medium text-blue-700">الشبكة السفلية</h5>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<RebarMeshInput
											title="الشبكة السفلية"
											direction="اتجاه X"
											diameter={formData.bottomXDiameter}
											onDiameterChange={(d) => setFormData({ ...formData, bottomXDiameter: d })}
											barsPerMeter={formData.bottomXBarsPerMeter}
											onBarsPerMeterChange={(n) => setFormData({ ...formData, bottomXBarsPerMeter: n })}
											colorScheme="blue"
											availableDiameters={REBAR_DIAMETERS.filter(d => d >= 14)}
											availableBarsPerMeter={[4, 5, 6, 7, 8]}
										/>
										<RebarMeshInput
											title="الشبكة السفلية"
											direction="اتجاه Y"
											diameter={formData.bottomYDiameter}
											onDiameterChange={(d) => setFormData({ ...formData, bottomYDiameter: d })}
											barsPerMeter={formData.bottomYBarsPerMeter}
											onBarsPerMeterChange={(n) => setFormData({ ...formData, bottomYBarsPerMeter: n })}
											colorScheme="blue"
											availableDiameters={REBAR_DIAMETERS.filter(d => d >= 14)}
											availableBarsPerMeter={[4, 5, 6, 7, 8]}
										/>
									</div>
								</div>

								{/* الشبكة العلوية */}
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<input
											type="checkbox"
											id="hasTopMeshRaft"
											checked={formData.hasTopMesh}
											onChange={(e) =>
												setFormData({ ...formData, hasTopMesh: e.target.checked })
											}
											className="rounded border-green-500"
										/>
										<Label htmlFor="hasTopMeshRaft" className="text-sm font-medium text-green-700">
											الشبكة العلوية
										</Label>
									</div>
									{formData.hasTopMesh && (
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
											<RebarMeshInput
												title="الشبكة العلوية"
												direction="اتجاه X"
												diameter={formData.topXDiameter}
												onDiameterChange={(d) => setFormData({ ...formData, topXDiameter: d })}
												barsPerMeter={formData.topXBarsPerMeter}
												onBarsPerMeterChange={(n) => setFormData({ ...formData, topXBarsPerMeter: n })}
												colorScheme="green"
												availableDiameters={REBAR_DIAMETERS.filter(d => d >= 12 && d <= 18)}
												availableBarsPerMeter={[3, 4, 5, 6]}
											/>
											<RebarMeshInput
												title="الشبكة العلوية"
												direction="اتجاه Y"
												diameter={formData.topYDiameter}
												onDiameterChange={(d) => setFormData({ ...formData, topYDiameter: d })}
												barsPerMeter={formData.topYBarsPerMeter}
												onBarsPerMeterChange={(n) => setFormData({ ...formData, topYBarsPerMeter: n })}
												colorScheme="green"
												availableDiameters={REBAR_DIAMETERS.filter(d => d >= 12 && d <= 18)}
												availableBarsPerMeter={[3, 4, 5, 6]}
											/>
										</div>
									)}
								</div>
							</div>
						)}

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
									cuttingDetails={calculations.rebarDetails.map((detail) => ({
										description: detail.direction,
										diameter: detail.diameter,
										barLength: detail.barLength,
										barCount: detail.totalBars,
										stocksNeeded: detail.stocksNeeded,
										weight: detail.grossWeight,
										grossWeight: detail.grossWeight,
										wastePercentage: detail.wastePercentage,
									}))}
									waste={'waste' in calculations ? calculations.waste : undefined}
									showCuttingDetails={showCuttingDetails}
									onToggleCuttingDetails={setShowCuttingDetails}
								/>
							</div>
						)}

						{/* أزرار الحفظ والإلغاء */}
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => { setIsAdding(false); setEditingItemId(null); resetForm(); }}>
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

			{/* ملخص العناصر */}
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
