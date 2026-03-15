"use client";

import { useState, useMemo } from "react";
import { Button } from "@ui/components/button";
import { Label } from "@ui/components/label";
import { Badge } from "@ui/components/badge";
import { Card, CardContent } from "@ui/components/card";
import {
	Save,
	X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { toast } from "sonner";
import {
	calculateSolidSlab,
	calculateFlatSlab,
	calculateRibbedSlab,
	calculateHollowCoreDetailed,
	calculateBandedBeamSlab,
	getRebarWeightPerMeter,
	type EnhancedSlabResult,
} from "../../../../lib/structural-calculations";
import type {
	SolidSlab,
	FlatSlab,
	RibbedSlab,
	HollowCoreSlab,
	BandedBeamSlab,
} from "../../../../types/slabs";
import type { StructuralItemCreateInput, StructuralItemUpdateInput } from "../../../../types/structural-mutation";
import { ELEMENT_PREFIXES } from "../../../../lib/utils";
import { SLAB_TYPE_INFO } from "../../../../constants/slabs";
import { ElementHeaderRow } from "../../shared";
import { computeBeamCalc } from "./helpers";
import {
	getDefaultFormData,
	getDefaultBandedBeamTemplate,
	type FormData,
	type SlabTypeKey,
	type SlabBeamDef,
	type BandedBeamTemplateDef,
	type SlabFormProps,
	type SlabTypeFieldsProps,
} from "./types";
import { SolidSlabFields } from "./forms/SolidSlabFields";
import { RibbedSlabFields } from "./forms/RibbedSlabFields";
import { FlatSlabFields } from "./forms/FlatSlabFields";
import { HollowCoreSlabFields } from "./forms/HollowCoreSlabFields";
import { BandedBeamSlabFields } from "./forms/BandedBeamSlabFields";

export function SlabForm({
	floorLabel,
	floorSlabArea,
	editingItem,
	onSave,
	onCancel,
	studyId,
	organizationId,
	specs,
	allItems,
	onDataSaved,
	onDataUpdated,
}: SlabFormProps) {
	const t = useTranslations();

	// توليد اسم السقف تلقائياً حسب الدور
	const getSlabFloorAutoName = (floor: string): string => {
		let baseName: string;
		if (floor === "ميزانين") {
			baseName = "سقف دور الميزانين";
		} else {
			baseName = `سقف الدور ال${floor}`;
		}

		const sameFloorCount = allItems.filter(
			(item) =>
				String(item.dimensions?.floor || "") === floor &&
				item.id !== editingItem?.id,
		).length;

		if (sameFloorCount > 0) {
			return `${baseName} ${sameFloorCount + 1}`;
		}
		return baseName;
	};

	const [formData, setFormData] = useState<FormData>(() => {
		if (editingItem) {
			return {
				...getDefaultFormData(),
				name: editingItem.name,
				slabType: (editingItem.subCategory as SlabTypeKey) || "solid",
				floor: floorLabel,
				quantity: editingItem.quantity,
				length: editingItem.dimensions?.length || 0,
				width: editingItem.dimensions?.width || 0,
				thickness: editingItem.dimensions?.thickness || 15,
				cover: editingItem.dimensions?.cover || 0.025,
				bottomMainDiameter: editingItem.dimensions?.bottomMainDiameter || 12,
				bottomMainBarsPerMeter: editingItem.dimensions?.bottomMainBarsPerMeter || 7,
				bottomSecondaryDiameter: editingItem.dimensions?.bottomSecondaryDiameter || 10,
				bottomSecondaryBarsPerMeter: editingItem.dimensions?.bottomSecondaryBarsPerMeter || 5,
				hasTopMesh: !!(editingItem.dimensions?.hasTopMesh),
				topMainDiameter: editingItem.dimensions?.topMainDiameter || 10,
				topMainBarsPerMeter: editingItem.dimensions?.topMainBarsPerMeter || 5,
				topSecondaryDiameter: editingItem.dimensions?.topSecondaryDiameter || 8,
				topSecondaryBarsPerMeter: editingItem.dimensions?.topSecondaryBarsPerMeter || 4,
				ribWidth: editingItem.dimensions?.ribWidth || 15,
				ribSpacing: editingItem.dimensions?.ribSpacing || 52,
				blockHeight: editingItem.dimensions?.blockHeight || 20,
				toppingThickness: editingItem.dimensions?.toppingThickness || 5,
				ribBottomBars: editingItem.dimensions?.ribBottomBars || 2,
				ribBarDiameter: editingItem.dimensions?.ribBarDiameter || 12,
				ribTopBars: editingItem.dimensions?.ribTopBars || 2,
				ribTopBarDiameter: editingItem.dimensions?.ribTopBarDiameter || 10,
				hasRibStirrup: editingItem.dimensions?.hasRibStirrup !== undefined ? !!(editingItem.dimensions.hasRibStirrup) : true,
				ribStirrupDiameter: editingItem.dimensions?.ribStirrupDiameter || 8,
				ribStirrupSpacing: editingItem.dimensions?.ribStirrupSpacing || 200,
				panelWidth: editingItem.dimensions?.panelWidth || 1.2,
				panelThickness: editingItem.dimensions?.panelThickness || 20,
				hasDropPanels: !!(editingItem.dimensions?.hasDropPanels),
				dropPanelLength: editingItem.dimensions?.dropPanelLength || 2,
				dropPanelWidth: editingItem.dimensions?.dropPanelWidth || 2,
				dropPanelDepth: editingItem.dimensions?.dropPanelDepth || 0.1,
				dropPanelCount: editingItem.dimensions?.dropPanelCount || 4,
				bandedBeamWidth: editingItem.dimensions?.bandedBeamWidth || 1.2,
				bandedBeamDepth: editingItem.dimensions?.bandedBeamDepth || 0.4,
				bandedBeamCount: editingItem.dimensions?.bandedBeamCount || 4,
			};
		}
		return { ...getDefaultFormData(), floor: floorLabel, name: getSlabFloorAutoName(floorLabel) };
	});

	const [showCuttingDetails, setShowCuttingDetails] = useState(false);
	const [showFormwork, setShowFormwork] = useState(false);
	const [showBeamCutting, setShowBeamCutting] = useState(false);

	// كمرات السقف الصلب
	const [slabBeams, setSlabBeams] = useState<SlabBeamDef[]>([]);
	const [expandedBeamIds, setExpandedBeamIds] = useState<string[]>([]);

	// نماذج الكمرات العريضة
	const [bandedBeamTemplates, setBandedBeamTemplates] = useState<BandedBeamTemplateDef[]>(() => {
		if (editingItem?.dimensions?.bandedBeamTemplates) {
			try {
				return JSON.parse(editingItem.dimensions.bandedBeamTemplates as unknown as string);
			} catch { return []; }
		}
		return [];
	});
	const [expandedBandedIds, setExpandedBandedIds] = useState<string[]>([]);

	const resetForm = () => {
		setFormData(getDefaultFormData());
		setSlabBeams([]);
		setExpandedBeamIds([]);
		setBandedBeamTemplates([]);
		setExpandedBandedIds([]);
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
							topping: formData.bottomSecondaryBarsPerMeter > 0 ? {
								mesh: {
									xDirection: {
										diameter: formData.bottomSecondaryDiameter,
										spacing: 1 / formData.bottomSecondaryBarsPerMeter,
									},
									yDirection: {
										diameter: formData.bottomSecondaryDiameter,
										spacing: 1 / formData.bottomSecondaryBarsPerMeter,
									},
								},
							} : {},
						},
					};
					return calculateRibbedSlab(input);
				}

				case "flat": {
					const hasRebarData = formData.bottomMainDiameter > 0 && formData.bottomMainBarsPerMeter > 0;

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
									length: formData.dropPanelLength,
									width: formData.dropPanelWidth,
									depth: formData.dropPanelDepth,
									extraThickness: formData.dropPanelDepth,
									count: formData.dropPanelCount,
								}
							: undefined,
						columnGrid: {
							xSpacing: [6],
							ySpacing: [6],
							columnSize: { width: 0.5, depth: 0.5 },
						},
						hasDropPanels: formData.hasDropPanels,
						hasCapitals: false,
						reinforcement: hasRebarData
							? {
									inputMethod: "grid" as const,
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
								}
							: { inputMethod: "ratio" as const },
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
					return calculateHollowCoreDetailed(input, formData.panelThickness);
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
						bands: bandedBeamTemplates.length > 0
							? bandedBeamTemplates.map(t => ({
								id: t.id,
								name: t.name,
								direction: "x" as const,
								dimensions: { width: t.width, depth: t.depth, length: t.length },
								reinforcement: {
									top: { continuous: { count: t.topContCount, diameter: t.topContDiameter } },
									bottom: {
										continuous: { count: t.bottomContCount, diameter: t.bottomContDiameter },
										...(t.bottomAddEnabled && t.bottomAddCount > 0 ? {
											additional: { count: t.bottomAddCount, diameter: t.bottomAddDiameter },
										} : {}),
									},
									stirrups: {
										diameter: t.stirrupDiameter,
										spacingAtQuarter: t.stirrupSpacingQuarter / 100,
										spacingAtMid: t.stirrupSpacingMid / 100,
										legs: t.stirrupLegs,
									},
								},
								quantity: t.quantity,
							}))
							: Array.from(
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
										top: { continuous: { count: 2, diameter: 16 } },
										bottom: { continuous: { count: 3, diameter: 16 } },
										stirrups: { diameter: 10, spacingAtQuarter: 0.07, spacingAtMid: 0.12, legs: 2 },
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
							...(formData.hasTopMesh ? {
								top: {
									enabled: true,
									xDirection: {
										diameter: formData.topMainDiameter,
										spacing: 1 / formData.topMainBarsPerMeter,
										length: formData.width,
									},
									yDirection: {
										diameter: formData.topSecondaryDiameter,
										spacing: 1 / formData.topSecondaryBarsPerMeter,
										length: formData.length,
									},
								},
							} : {}),
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
	}, [formData, bandedBeamTemplates]);

	// ═══ اتجاه الحديد حسب نوع السقف ═══
	const mainDirection = calculations?.structuralType === 'ONE_WAY'
		? t('pricing.studies.structural.shortSpanDirection')
		: t('pricing.studies.structural.longSpanDirection');
	const secondaryDirection = calculations?.structuralType === 'ONE_WAY'
		? t('pricing.studies.structural.longSpanDirection')
		: t('pricing.studies.structural.shortSpanDirection');
	const mainLabel = calculations?.structuralType === 'ONE_WAY'
		? t('pricing.studies.structural.mainRebar')
		: t('pricing.studies.structural.mainRebar');
	const secondaryLabel = calculations?.structuralType === 'ONE_WAY'
		? t('pricing.studies.structural.distributionRebar')
		: t('pricing.studies.structural.secondaryRebar');

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
				resetForm();
				onDataSaved();
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
				resetForm();
				onDataUpdated();
				onSave();
			},
			onError: () => {
				toast.error(t("pricing.studies.messages.itemUpdateError"));
			},
		}),
	);

	const handleSubmit = async () => {
		if (!formData.name || !formData.slabType || !calculations) return;

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
				floor: floorLabel,
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
					toppingThickness: formData.toppingThickness,
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
				// بيانات نماذج الكمرات العريضة
				...(formData.slabType === "banded_beam" && bandedBeamTemplates.length > 0 && {
					bandedBeamTemplates: JSON.stringify(bandedBeamTemplates),
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

		if (editingItem) {
			(updateMutation.mutate as (data: StructuralItemUpdateInput) => void)({
				...itemData,
				id: editingItem.id,
				costStudyId: studyId,
			});
		} else {
			(createMutation.mutate as (data: StructuralItemCreateInput) => void)(itemData);
		}
	};

	// ═══ Props مشتركة لمكونات الأنواع ═══
	const fieldProps: SlabTypeFieldsProps = {
		formData,
		setFormData,
		calculations,
		specs,
		slabBeams,
		setSlabBeams,
		expandedBeamIds,
		setExpandedBeamIds,
		beamsCalcs,
		bandedBeamTemplates,
		setBandedBeamTemplates,
		expandedBandedIds,
		setExpandedBandedIds,
		showCuttingDetails,
		setShowCuttingDetails,
		showFormwork,
		setShowFormwork,
		showBeamCutting,
		setShowBeamCutting,
		combinedTotals,
		mainDirection,
		secondaryDirection,
		mainLabel,
		secondaryLabel,
	};

	return (
		<Card className="border-dashed border-2 border-primary/50">
			<CardContent className="p-4 space-y-4">
				<div className="flex items-center justify-between">
					<h4 className="font-medium">
						{editingItem
							? t("pricing.studies.structural.editItem")
							: t("pricing.studies.structural.addItem")}
					</h4>
					<Button
						variant="ghost"
						size="icon"
						onClick={onCancel}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>

				{/* البيانات الأساسية */}
				<div className="flex flex-wrap items-end gap-3">
					<div className="flex-1">
						<ElementHeaderRow
							autoNamePrefix={ELEMENT_PREFIXES.slabs}
							existingCount={allItems.length}
							skipAutoName={true}
							namePlaceholder="اسم السقف"
							name={formData.name}
							onNameChange={(name) => setFormData((prev) => ({ ...prev, name }))}
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
							rightSlot={
								<div className="space-y-1">
									<Label className="text-xs mb-1 block">
										الدور
									</Label>
									<div className="flex items-center gap-2">
										<Badge variant="secondary">{floorLabel}</Badge>
										{floorSlabArea != null && floorSlabArea > 0 && (
											<Badge variant="outline" className="text-xs">
												مساحة السقف من الإعدادات: {floorSlabArea} م²
											</Badge>
										)}
									</div>
								</div>
							}
						/>
					</div>
				</div>

				{/* رسالة اختيار النوع */}
				{!formData.slabType && (
					<div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
						<p className="text-sm font-medium">
							يرجى اختيار نوع السقف للمتابعة
						</p>
					</div>
				)}

				{/* التبديل حسب نوع السقف */}
				{formData.slabType === "solid" && <SolidSlabFields {...fieldProps} />}
				{formData.slabType === "ribbed" && <RibbedSlabFields {...fieldProps} />}
				{formData.slabType === "flat" && <FlatSlabFields {...fieldProps} />}
				{formData.slabType === "hollow_core" && <HollowCoreSlabFields {...fieldProps} />}
				{formData.slabType === "banded_beam" && <BandedBeamSlabFields {...fieldProps} />}

				{/* أزرار الحفظ والإلغاء */}
				<div className="flex justify-end gap-2">
					<Button
						variant="outline"
						onClick={onCancel}
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
							!calculations
						}
					>
						<Save className="h-4 w-4 ml-2" />
						{editingItem
							? t("pricing.studies.structural.updateItem")
							: t("pricing.studies.structural.saveItem")}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
