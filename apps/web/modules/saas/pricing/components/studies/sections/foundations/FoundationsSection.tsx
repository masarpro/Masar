"use client";

import { useState, useMemo, useEffect } from "react";
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
	Copy,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { toast } from "sonner";
import {
	calculateIsolatedFoundation,
	calculateCombinedFoundation,
	calculateStripFoundation,
	calculateRaftFoundation,
} from "../../../../lib/structural-calculations";
import type { IsolatedFoundationInput, CombinedFoundationInput, StripFoundationInput, RaftFoundationInput } from "../../../../types/foundations";
import { formatNumber, ELEMENT_PREFIXES } from "../../../../lib/utils";
import { REBAR_DIAMETERS } from "../../../../constants/prices";
import {
	ElementHeaderRow,
	CalculationResultsPanel,
} from "../../shared";
import type { StructuralItemCreateInput, StructuralItemUpdateInput, StructuralItemDeleteInput } from "../../../../types/structural-mutation";
import {
	type FoundationsSectionProps,
	type FoundationType,
	type FormData,
	type CalculationResult,
	type FoundationFieldsProps,
	FOUNDATION_TYPE_INFO,
	getDefaultFormData,
	populateFormFromItem,
} from "./types";
import { IsolatedCombinedFields } from "./forms/IsolatedCombinedFields";
import { StripFields } from "./forms/StripFields";
import { RaftFields } from "./forms/RaftFields";

export function FoundationsSection({
	studyId,
	organizationId,
	items,
	onSave,
	onUpdate,
	specs,
	buildingConfig,
}: FoundationsSectionProps) {
	const t = useTranslations();
	const [isAdding, setIsAdding] = useState(false);
	const [editingItemId, setEditingItemId] = useState<string | null>(null);
	const [showCuttingDetails, setShowCuttingDetails] = useState(false);

	const [formData, setFormData] = useState<FormData>(() => getDefaultFormData(buildingConfig));

	// عند تغيير النوع للمشتركة — الشبكة العلوية إجبارية
	useEffect(() => {
		if (formData.type === "combined") {
			setFormData(prev => ({ ...prev, hasTopShort: true, hasTopLong: true }));
		}
	}, [formData.type]);

	// حساب النتائج بناءً على نوع القاعدة
	const calculations = useMemo((): CalculationResult | null => {
		if (formData.type === "isolated") {
			if (formData.length <= 0 || formData.width <= 0 || formData.height <= 0) return null;

			const input: IsolatedFoundationInput = {
				quantity: formData.quantity,
				length: formData.length,
				width: formData.width,
				height: formData.height,
				cover: formData.cover,
				hookLength: formData.hookLength,
				coverBottom: formData.foundationCoverBottom,
				coverTop: formData.foundationCoverTop,
				coverSide: formData.foundationCoverSide,
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
				hasLeanConcrete: formData.foundationHasLeanConcrete,
				leanConcreteThickness: formData.foundationLeanConcreteThickness,
				hasColumnDowels: formData.foundationHasColumnDowels,
				columnDowels: formData.foundationHasColumnDowels ? {
					barsPerColumn: formData.foundationDowelBarsPerColumn,
					diameter: formData.foundationDowelDiameter,
					developmentLength: formData.foundationDowelDevLength,
				} : undefined,
				concreteType: specs?.concreteType || "C30",
			};

			return calculateIsolatedFoundation(input);
		}

		if (formData.type === "combined") {
			if (formData.length <= 0 || formData.width <= 0 || formData.height <= 0) return null;

			const input: CombinedFoundationInput = {
				quantity: formData.quantity,
				length: formData.length,
				width: formData.width,
				height: formData.height,
				cover: formData.cover,
				hookLength: formData.hookLength,
				coverBottom: formData.foundationCoverBottom,
				coverTop: formData.foundationCoverTop,
				coverSide: formData.foundationCoverSide,
				columnCount: formData.combinedColumnCount,
				columnSpacing: formData.combinedColumnSpacing,
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
				hasLeanConcrete: formData.foundationHasLeanConcrete,
				leanConcreteThickness: formData.foundationLeanConcreteThickness,
				hasColumnDowels: formData.foundationHasColumnDowels,
				columnDowels: formData.foundationHasColumnDowels ? {
					barsPerColumn: formData.foundationDowelBarsPerColumn,
					diameter: formData.foundationDowelDiameter,
					developmentLength: formData.foundationDowelDevLength,
				} : undefined,
				concreteType: specs?.concreteType || "C30",
			};

			return calculateCombinedFoundation(input);
		}

		if (formData.type === "strip") {
			const stripLen = formData.stripLength || (formData.segments[0]?.length || 0);
			if (formData.width <= 0 || formData.height <= 0 || stripLen <= 0) return null;

			const stripMode = formData.width <= 0.8 ? 'stirrups' : 'mesh';

			const input: StripFoundationInput = {
				length: stripLen,
				width: formData.width,
				height: formData.height,
				quantity: formData.quantity,
				hookLength: formData.hookLength,
				coverBottom: formData.stripCoverBottom,
				coverTop: formData.stripCoverTop,
				coverSide: formData.stripCoverSide,
				hasLeanConcrete: formData.stripHasLeanConcrete,
				leanConcreteThickness: formData.stripLeanConcreteThickness,
				bottomMain: {
					count: formData.bottomMainCount,
					diameter: formData.bottomMainDiameter,
				},
				bottomSecondary: formData.hasBottomSecondary ? {
					count: formData.bottomSecondaryCount,
					diameter: formData.bottomSecondaryDiameter,
				} : undefined,
				topMain: formData.hasTopMain ? {
					count: formData.topMainCount,
					diameter: formData.topMainDiameter,
				} : undefined,
				stirrups: (stripMode === 'stirrups' && formData.hasStirrup) ? {
					diameter: formData.stirrupDiameter,
					spacing: formData.stirrupSpacing / 1000,
				} : undefined,
				bottomMeshX: stripMode === 'mesh' ? {
					diameter: formData.stripBottomMeshXDiameter,
					barsPerMeter: formData.stripBottomMeshXBarsPerMeter,
				} : undefined,
				bottomMeshY: stripMode === 'mesh' ? {
					diameter: formData.stripBottomMeshYDiameter,
					barsPerMeter: formData.stripBottomMeshYBarsPerMeter,
				} : undefined,
				topMeshX: (stripMode === 'mesh' && formData.stripHasTopMesh) ? {
					diameter: formData.stripTopMeshXDiameter,
					barsPerMeter: formData.stripTopMeshXBarsPerMeter,
				} : undefined,
				topMeshY: (stripMode === 'mesh' && formData.stripHasTopMesh) ? {
					diameter: formData.stripTopMeshYDiameter,
					barsPerMeter: formData.stripTopMeshYBarsPerMeter,
				} : undefined,
				lapSpliceMethod: stripMode === 'mesh' ? formData.stripLapSpliceMethod : '40d',
				customLapLength: formData.stripLapSpliceMethod === 'custom' ? formData.stripCustomLapLength : undefined,
				hasChairBars: stripMode === 'mesh' ? formData.stripHasChairBars : false,
				chairBars: (stripMode === 'mesh' && formData.stripHasChairBars) ? {
					diameter: formData.stripChairBarsDiameter,
					spacingX: formData.stripChairBarsSpacingX,
					spacingY: formData.stripChairBarsSpacingY,
				} : undefined,
				hasColumnDowels: formData.stripHasColumnDowels,
				columnDowels: formData.stripHasColumnDowels && formData.stripColumnDowelCount > 0 ? {
					count: formData.stripColumnDowelCount,
					barsPerColumn: formData.stripColumnDowelBarsPerColumn,
					diameter: formData.stripColumnDowelDiameter,
					developmentLength: formData.stripColumnDowelDevLength,
				} : undefined,
				hasIntersectionDeduction: formData.stripHasIntersectionDeduction,
				intersectionCount: formData.stripIntersectionCount,
				intersectingStripWidth: formData.stripIntersectingStripWidth,
				concreteType: specs?.concreteType || "C30",
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
				hookLength: formData.hookLength,
				coverBottom: formData.coverBottom,
				coverTop: formData.coverTop,
				coverSide: formData.coverSide,
				hasLeanConcrete: formData.hasLeanConcrete,
				leanConcreteThickness: formData.leanConcreteThickness,
				hasEdgeBeams: formData.hasEdgeBeams,
				edgeBeamWidth: formData.edgeBeamWidth,
				edgeBeamDepth: formData.edgeBeamDepth,
				lapSpliceMethod: formData.lapSpliceMethod,
				customLapLength: formData.lapSpliceMethod === 'custom' ? formData.customLapLength : undefined,
				hasChairBars: formData.hasChairBars,
				chairBars: formData.hasChairBars ? {
					diameter: formData.chairBarsDiameter,
					spacingX: formData.chairBarsSpacingX,
					spacingY: formData.chairBarsSpacingY,
				} : undefined,
				columnDowels: formData.columnDowelMode === 'manual' && formData.columnDowelCount > 0 ? {
					count: formData.columnDowelCount,
					barsPerColumn: formData.columnDowelBarsPerColumn,
					diameter: formData.columnDowelDiameter,
					developmentLength: formData.columnDowelDevLength,
				} : undefined,
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
				concreteType: specs?.concreteType || "C30",
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
		setFormData(getDefaultFormData());
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
				cover: formData.cover,
				hookLength: formData.hookLength,
				foundationType: formData.type,
				// للقاعدة المعزولة والمشتركة
				...(( formData.type === "isolated" || formData.type === "combined") && {
					bottomShortDiameter: formData.bottomShortDiameter,
					bottomShortBarsPerMeter: formData.bottomShortBarsPerMeter,
					bottomLongDiameter: formData.bottomLongDiameter,
					bottomLongBarsPerMeter: formData.bottomLongBarsPerMeter,
					hasTopShort: formData.hasTopShort ? 1 : 0,
					topShortDiameter: formData.topShortDiameter,
					topShortBarsPerMeter: formData.topShortBarsPerMeter,
					hasTopLong: formData.hasTopLong ? 1 : 0,
					topLongDiameter: formData.topLongDiameter,
					topLongBarsPerMeter: formData.topLongBarsPerMeter,
					foundationCoverBottom: formData.foundationCoverBottom,
					foundationCoverTop: formData.foundationCoverTop,
					foundationCoverSide: formData.foundationCoverSide,
					foundationHasLeanConcrete: formData.foundationHasLeanConcrete ? 1 : 0,
					foundationLeanConcreteThickness: formData.foundationLeanConcreteThickness,
					foundationHasColumnDowels: formData.foundationHasColumnDowels ? 1 : 0,
					foundationDowelBarsPerColumn: formData.foundationDowelBarsPerColumn,
					foundationDowelDiameter: formData.foundationDowelDiameter,
					foundationDowelDevLength: formData.foundationDowelDevLength,
					...(formData.type === "combined" && {
						combinedColumnCount: formData.combinedColumnCount,
						combinedColumnSpacing: formData.combinedColumnSpacing,
					}),
				}),
				// للقاعدة الشريطية
				...(formData.type === "strip" && {
					stripLength: formData.stripLength,
					segmentLength: formData.stripLength,
					bottomMainCount: formData.bottomMainCount,
					bottomMainDiameter: formData.bottomMainDiameter,
					hasBottomSecondary: formData.hasBottomSecondary ? 1 : 0,
					bottomSecondaryCount: formData.bottomSecondaryCount,
					bottomSecondaryDiameter: formData.bottomSecondaryDiameter,
					hasTopMain: formData.hasTopMain ? 1 : 0,
					topMainCount: formData.topMainCount,
					topMainDiameter: formData.topMainDiameter,
					hasStirrup: formData.hasStirrup ? 1 : 0,
					stirrupDiameter: formData.stirrupDiameter,
					stirrupSpacing: formData.stirrupSpacing,
					stripBottomMeshXDiameter: formData.stripBottomMeshXDiameter,
					stripBottomMeshXBarsPerMeter: formData.stripBottomMeshXBarsPerMeter,
					stripBottomMeshYDiameter: formData.stripBottomMeshYDiameter,
					stripBottomMeshYBarsPerMeter: formData.stripBottomMeshYBarsPerMeter,
					stripHasTopMesh: formData.stripHasTopMesh ? 1 : 0,
					stripTopMeshXDiameter: formData.stripTopMeshXDiameter,
					stripTopMeshXBarsPerMeter: formData.stripTopMeshXBarsPerMeter,
					stripTopMeshYDiameter: formData.stripTopMeshYDiameter,
					stripTopMeshYBarsPerMeter: formData.stripTopMeshYBarsPerMeter,
					stripCoverBottom: formData.stripCoverBottom,
					stripCoverTop: formData.stripCoverTop,
					stripCoverSide: formData.stripCoverSide,
					stripHasLeanConcrete: formData.stripHasLeanConcrete ? 1 : 0,
					stripLeanConcreteThickness: formData.stripLeanConcreteThickness,
					stripHasColumnDowels: formData.stripHasColumnDowels ? 1 : 0,
					stripColumnDowelCount: formData.stripColumnDowelCount,
					stripColumnDowelBarsPerColumn: formData.stripColumnDowelBarsPerColumn,
					stripColumnDowelDiameter: formData.stripColumnDowelDiameter,
					stripColumnDowelDevLength: formData.stripColumnDowelDevLength,
					stripHasIntersectionDeduction: formData.stripHasIntersectionDeduction ? 1 : 0,
					stripIntersectionCount: formData.stripIntersectionCount,
					stripIntersectingStripWidth: formData.stripIntersectingStripWidth,
					stripHasChairBars: formData.stripHasChairBars ? 1 : 0,
					stripChairBarsDiameter: formData.stripChairBarsDiameter,
					stripChairBarsSpacingX: formData.stripChairBarsSpacingX,
					stripChairBarsSpacingY: formData.stripChairBarsSpacingY,
					stripLapSpliceMethod: formData.stripLapSpliceMethod,
					stripCustomLapLength: formData.stripCustomLapLength,
				}),
				// للبشة
				...(formData.type === "raft" && {
					thickness: formData.thickness,
					bottomXDiameter: formData.bottomXDiameter,
					bottomXBarsPerMeter: formData.bottomXBarsPerMeter,
					bottomYDiameter: formData.bottomYDiameter,
					bottomYBarsPerMeter: formData.bottomYBarsPerMeter,
					hasTopMesh: formData.hasTopMesh ? 1 : 0,
					topXDiameter: formData.topXDiameter,
					topXBarsPerMeter: formData.topXBarsPerMeter,
					topYDiameter: formData.topYDiameter,
					topYBarsPerMeter: formData.topYBarsPerMeter,
					coverBottom: formData.coverBottom,
					coverTop: formData.coverTop,
					coverSide: formData.coverSide,
					hasLeanConcrete: formData.hasLeanConcrete ? 1 : 0,
					leanConcreteThickness: formData.leanConcreteThickness,
					hasEdgeBeams: formData.hasEdgeBeams ? 1 : 0,
					edgeBeamWidth: formData.edgeBeamWidth,
					edgeBeamDepth: formData.edgeBeamDepth,
					lapSpliceMethod: formData.lapSpliceMethod,
					customLapLength: formData.customLapLength,
					hasChairBars: formData.hasChairBars ? 1 : 0,
					chairBarsDiameter: formData.chairBarsDiameter,
					chairBarsSpacingX: formData.chairBarsSpacingX,
					chairBarsSpacingY: formData.chairBarsSpacingY,
					columnDowelMode: formData.columnDowelMode,
					columnDowelCount: formData.columnDowelCount,
					columnDowelBarsPerColumn: formData.columnDowelBarsPerColumn,
					columnDowelDiameter: formData.columnDowelDiameter,
					columnDowelDevLength: formData.columnDowelDevLength,
				}),
			},
			concreteVolume: calculations.concreteVolume,
			concreteType: specs?.concreteType || "C30",
			steelWeight: calculations.totals.grossWeight,
			steelRatio: calculations.concreteVolume > 0
				? calculations.totals.grossWeight / calculations.concreteVolume
				: 0,
			materialCost: calculations.costs.concrete + calculations.costs.rebar,
			laborCost: calculations.costs.labor,
			totalCost: calculations.costs.total,
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

	const fieldProps: FoundationFieldsProps = {
		formData,
		setFormData,
		calculations,
		showCuttingDetails,
		setShowCuttingDetails,
		specs,
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
													setFormData(populateFormFromItem(item));
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
													const populated = populateFormFromItem(item);
													setFormData({ ...populated, name: `${populated.name} - نسخة` });
												}}
												title="نسخ القاعدة"
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
								{editingItemId ? t("pricing.studies.structural.editItem") : t("pricing.studies.structural.addItem")}
							</h4>
							<Button variant="ghost" size="icon" onClick={() => { setIsAdding(false); setEditingItemId(null); resetForm(); }}>
								<X className="h-4 w-4" />
							</Button>
						</div>

						{/* البيانات الأساسية */}
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
							showConcreteType={false}
							showQuantity={formData.type === "isolated" || formData.type === "combined" || formData.type === "strip"}
						/>

						{/* التبديل حسب نوع القاعدة */}
						{(formData.type === "isolated" || formData.type === "combined") && (
							<IsolatedCombinedFields {...fieldProps} />
						)}
						{formData.type === "strip" && <StripFields {...fieldProps} />}
						{formData.type === "raft" && <RaftFields {...fieldProps} />}

						{/* نتائج الحساب */}
						{calculations && (
							<div className="bg-muted/50 rounded-lg p-4 space-y-4">
								<div className="flex items-center gap-2 mb-3">
									<Calculator className="h-5 w-5 text-primary" />
									<h4 className="font-medium">{t("pricing.studies.calculations.results")}</h4>
								</div>

								{/* عرض خرسانة النظافة إن وجدت */}
								{'leanConcreteVolume' in calculations && calculations.leanConcreteVolume != null && calculations.leanConcreteVolume > 0 && (
									<div className="text-sm bg-amber-50 border border-amber-200 rounded p-2">
										<span className="text-muted-foreground">{t("pricing.studies.structural.leanConcrete.label")}: </span>
										<span className="font-medium">{formatNumber(calculations.leanConcreteVolume)} م³</span>
									</div>
								)}

								{/* عرض خصم التقاطعات — strip only */}
								{'intersectionDeduction' in calculations && calculations.intersectionDeduction != null && calculations.intersectionDeduction > 0 && (
									<div className="text-sm bg-orange-50 border border-orange-200 rounded p-2">
										<span className="text-muted-foreground">{t("pricing.studies.structural.strip.intersectionDeduction")}: </span>
										<span className="font-medium text-orange-700">-{formatNumber(calculations.intersectionDeduction)} م³</span>
										<span className="text-xs text-muted-foreground ms-2">
											({formData.stripIntersectionCount} × {formatNumber(formData.stripIntersectingStripWidth)}×{formatNumber(formData.width)}×{formatNumber(formData.height)}
											{formData.quantity > 1 ? `×${formData.quantity}` : ''})
										</span>
									</div>
								)}

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
					className="w-full bg-primary/10 text-primary border-2 border-dashed border-primary/40 hover:bg-primary/20 hover:border-primary/60 transition-all"
					onClick={() => setIsAdding(true)}
				>
					<Plus className="h-5 w-5 ml-2" />
					<span className="font-semibold">{t("pricing.studies.structural.addItem")}</span>
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
