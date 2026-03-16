"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Plus, Save, Trash2, Pencil, X, ChevronDown, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { toast } from "sonner";
import { cn } from "@ui/lib";

import { calculateOtherStructural } from "../../../../lib/other-structural-calculations";
import { ELEMENT_CATALOG, ELEMENT_DEFAULTS } from "../../../../constants/other-structural";
import type {
	OtherStructuralInput,
	OtherStructuralResult,
	OtherStructuralElementType,
} from "../../../../types/other-structural";
import { formatNumber } from "../../../../lib/utils";
import { ElementTypePicker } from "./ElementTypePicker";
import { ElementResultCard } from "./ElementResultCard";
import { ElementFormWrapper } from "./forms/ElementFormWrapper";
import type { StructuralFloorConfig, StructuralBuildingConfig } from "../../../../types/structural-building-config";

interface OtherStructuralSectionProps {
	studyId: string;
	organizationId: string;
	items: Array<{
		id: string;
		name: string;
		dimensions: Record<string, any>;
		concreteVolume: number;
		steelWeight: number;
		totalCost: number;
		subCategory?: string | null;
	}>;
	allItems?: any[];
	onSave: () => void;
	onUpdate: () => void;
	specs?: { concreteType: string; steelGrade: string };
	buildingFloors?: StructuralFloorConfig[];
	buildingConfig?: StructuralBuildingConfig | null;
}

// بيانات عنصر محلي مع النتائج
interface LocalElement {
	input: OtherStructuralInput;
	result: OtherStructuralResult | null;
	savedItemId?: string; // إذا تم حفظه في الخادم
}

function createDefaultInput(type: OtherStructuralElementType): OtherStructuralInput {
	const catalog = ELEMENT_CATALOG.find(c => c.type === type);
	const base = { id: crypto.randomUUID(), elementType: type, name: catalog?.name_ar ?? type, quantity: 1 };

	switch (type) {
		case 'SEPTIC_TANK': {
			const d = ELEMENT_DEFAULTS.SEPTIC_TANK;
			return { ...base, elementType: 'SEPTIC_TANK', tankType: d.tankType, length: 4, width: 2, depth: d.depth, wallType: d.wallType, wallThickness: d.wallThickness, baseThickness: d.baseThickness, slabThickness: d.slabThickness };
		}
		case 'WATER_TANK_GROUND': {
			const d = ELEMENT_DEFAULTS.WATER_TANK_GROUND;
			return { ...base, elementType: 'WATER_TANK_GROUND', shape: d.shape, length: 3, width: 2, depth: d.depth, wallThickness: d.wallThickness, baseThickness: d.baseThickness, slabThickness: d.slabThickness, isDivided: d.isDivided };
		}
		case 'WATER_TANK_ELEVATED': {
			const d = ELEMENT_DEFAULTS.WATER_TANK_ELEVATED;
			return { ...base, elementType: 'WATER_TANK_ELEVATED', shape: d.shape, length: 2, width: 2, depth: d.depth, wallThickness: d.wallThickness, baseThickness: d.baseThickness, slabThickness: d.slabThickness };
		}
		case 'ELEVATOR_PIT': {
			const d = ELEMENT_DEFAULTS.ELEVATOR_PIT;
			return { ...base, elementType: 'ELEVATOR_PIT', elevatorType: d.elevatorType, pitWidth: d.pitWidth, pitLength: d.pitLength, pitHoleDepth: d.pitHoleDepth, numberOfStops: d.numberOfStops, floorHeight: d.floorHeight, wallThickness: d.wallThickness, pitSlabThickness: d.pitSlabThickness, overTravel: d.overTravel, hasMachineRoom: d.hasMachineRoom, machineRoomHeight: d.machineRoomHeight };
		}
		case 'RETAINING_WALL': {
			const d = ELEMENT_DEFAULTS.RETAINING_WALL;
			return { ...base, elementType: 'RETAINING_WALL', wallType: d.wallType, length: 10, height: 3, stemThickness: d.stemThickness, baseWidth: 0, baseThickness: d.baseThickness };
		}
		case 'BOUNDARY_WALL': {
			const d = ELEMENT_DEFAULTS.BOUNDARY_WALL;
			return { ...base, elementType: 'BOUNDARY_WALL', wallType: d.wallType, length: 50, height: d.height, thickness: d.thickness, hasRCColumns: d.hasRCColumns, columnSpacing: d.columnSpacing, hasFoundation: d.hasFoundation, foundationWidth: d.foundationWidth, foundationDepth: d.foundationDepth };
		}
		case 'RAMP': {
			const d = ELEMENT_DEFAULTS.RAMP;
			return { ...base, elementType: 'RAMP', rampType: d.rampType, length: 10, width: 4, thickness: d.thickness, hasWalls: d.hasWalls, wallHeight: d.wallHeight, wallThickness: d.wallThickness };
		}
		case 'DOME': {
			const d = ELEMENT_DEFAULTS.DOME;
			return { ...base, elementType: 'DOME', domeType: d.domeType, diameter: 8, riseHeight: 4, shellThicknessTop: d.shellThicknessTop, shellThicknessBottom: d.shellThicknessBottom, hasRingBeam: d.hasRingBeam, ringBeamWidth: d.ringBeamWidth, ringBeamDepth: d.ringBeamDepth, hasDrum: d.hasDrum, hasSupportColumns: d.hasSupportColumns };
		}
		case 'MINARET': {
			const d = ELEMENT_DEFAULTS.MINARET;
			return { ...base, elementType: 'MINARET', shape: d.shape, style: d.style, totalHeight: 20, outerDiameter: d.outerDiameter, wallThickness: d.wallThickness, hasBalcony: d.hasBalcony, balconyCount: d.balconyCount, balconyProjection: d.balconyProjection, topType: d.topType };
		}
		case 'CONCRETE_DECOR':
			return { ...base, elementType: 'CONCRETE_DECOR', items: [] };
		case 'CUSTOM_ELEMENT':
			return { ...base, elementType: 'CUSTOM_ELEMENT', concreteVolumeRC: 0, concreteVolumePlain: 0, steelWeight: 0, formworkArea: 0, waterproofingArea: 0, excavationVolume: 0, blockCount: 0 };
	}
}

export function OtherStructuralSection({
	studyId,
	organizationId,
	items,
	onSave,
	onUpdate,
}: OtherStructuralSectionProps) {
	const t = useTranslations("pricing.studies.structural.otherStructural");
	const tS = useTranslations("pricing.studies.structural");

	const [elements, setElements] = useState<LocalElement[]>(() =>
		items
			.filter(item => item.subCategory === "otherStructural" || (item.dimensions as any)?.elementType)
			.map(item => {
				const inputData = item.dimensions as unknown as OtherStructuralInput;
				let result: OtherStructuralResult | null = null;
				try { result = calculateOtherStructural(inputData); } catch { /* skip */ }
				return { input: inputData, result, savedItemId: item.id };
			}),
	);

	const [showPicker, setShowPicker] = useState(false);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

	// mutation لحفظ العنصر
	const createMutation = useMutation(
		orpc.pricing.studies.structuralItem.create.mutationOptions(),
	);
	const deleteMutation = useMutation(
		orpc.pricing.studies.structuralItem.delete.mutationOptions(),
	);

	const handleAddElement = useCallback((type: OtherStructuralElementType) => {
		const input = createDefaultInput(type);
		let result: OtherStructuralResult | null = null;
		try { result = calculateOtherStructural(input); } catch { /* skip */ }
		setElements(prev => [...prev, { input, result }]);
		setEditingIndex(elements.length);
		setShowPicker(false);
	}, [elements.length]);

	const handleUpdateInput = useCallback((index: number, newInput: OtherStructuralInput) => {
		setElements(prev => {
			const next = [...prev];
			let result: OtherStructuralResult | null = null;
			try { result = calculateOtherStructural(newInput); } catch { /* skip */ }
			next[index] = { ...next[index], input: newInput, result };
			return next;
		});
	}, []);

	const handleSaveElement = useCallback(async (index: number) => {
		const el = elements[index];
		if (!el.result) return;

		try {
			await (createMutation.mutateAsync as (data: any) => Promise<unknown>)({
				organizationId,
				costStudyId: studyId,
				category: "otherStructural",
				subCategory: "otherStructural",
				name: el.input.name,
				dimensions: el.input as any,
				quantity: el.result.quantity,
				unit: "مجموعة",
				concreteVolume: el.result.totalConcreteRC + el.result.totalConcretePlain,
				steelWeight: el.result.totalSteelWeight,
				totalCost: 0,
			});
			toast.success(t("messages.saved"));
			setEditingIndex(null);
			onSave();
			onUpdate();
		} catch {
			toast.error(t("messages.saveError"));
		}
	}, [elements, createMutation, organizationId, studyId, t, onSave, onUpdate]);

	const handleDeleteElement = useCallback(async (index: number) => {
		const el = elements[index];
		if (el.savedItemId) {
			try {
				await (deleteMutation.mutateAsync as (data: any) => Promise<unknown>)({
					organizationId, costStudyId: studyId, id: el.savedItemId,
				});
			} catch { /* continue locally */ }
		}
		setElements(prev => prev.filter((_, i) => i !== index));
		if (editingIndex === index) setEditingIndex(null);
		onUpdate();
	}, [elements, deleteMutation, organizationId, studyId, editingIndex, onUpdate]);

	const toggleExpand = (index: number) => {
		setExpandedCards(prev => {
			const next = new Set(prev);
			if (next.has(index)) next.delete(index);
			else next.add(index);
			return next;
		});
	};

	const getCatalogInfo = (type: OtherStructuralElementType) =>
		ELEMENT_CATALOG.find(c => c.type === type);

	return (
		<div className="space-y-4">
			{/* قائمة العناصر المُضافة */}
			{elements.map((el, index) => {
				const catalog = getCatalogInfo(el.input.elementType);
				const isEditing = editingIndex === index;
				const isExpanded = expandedCards.has(index);

				return (
					<Card key={el.input.id} className={cn(
						"transition-all",
						isEditing && "ring-2 ring-primary/50",
					)}>
						<CardHeader
							className="cursor-pointer p-3"
							onClick={() => !isEditing && toggleExpand(index)}
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span className="text-xl">{catalog?.icon}</span>
									<div>
										<div className="font-medium text-sm">
											{el.input.name}
											{el.input.quantity > 1 && (
												<span className="text-muted-foreground ms-1">×{el.input.quantity}</span>
											)}
										</div>
										{el.result && (
											<div className="text-xs text-muted-foreground">
												{el.result.concreteVolumeRC > 0 && `RC: ${formatNumber(el.result.totalConcreteRC)} م³`}
												{el.result.steelWeight > 0 && ` | حديد: ${formatNumber(el.result.totalSteelWeight)} كجم`}
											</div>
										)}
									</div>
								</div>
								<div className="flex items-center gap-1">
									{!isEditing && (
										<>
											<Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingIndex(index); }}>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteElement(index); }}>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</>
									)}
									{!isEditing && (isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />)}
								</div>
							</div>
						</CardHeader>

						{(isEditing || isExpanded) && (
							<CardContent className="p-3 pt-0 space-y-4">
								{isEditing && (
									<>
										{/* اسم العنصر */}
										<div className="max-w-xs">
											<Label>{tS("itemName")}</Label>
											<Input
												value={el.input.name}
												onChange={(e) => handleUpdateInput(index, { ...el.input, name: e.target.value })}
											/>
										</div>

										{/* نموذج العنصر */}
										<ElementFormWrapper
											elementType={el.input.elementType}
											data={el.input}
											onChange={(data) => handleUpdateInput(index, data)}
										/>

										{/* أزرار الحفظ/الإلغاء */}
										<div className="flex gap-2">
											<Button size="sm" onClick={() => handleSaveElement(index)} disabled={createMutation.isPending}>
												<Save className="h-4 w-4 me-1" />
												{tS("saveItem")}
											</Button>
											<Button variant="outline" size="sm" onClick={() => setEditingIndex(null)}>
												<X className="h-4 w-4 me-1" />
												{t("actions.cancel")}
											</Button>
										</div>
									</>
								)}

								{/* بطاقة النتائج */}
								{el.result && <ElementResultCard result={el.result} />}
							</CardContent>
						)}
					</Card>
				);
			})}

			{/* زر إضافة عنصر */}
			<Button variant="outline" className="w-full gap-2" onClick={() => setShowPicker(true)}>
				<Plus className="h-4 w-4" />
				{t("actions.addElement")}
			</Button>

			{/* Dialog اختيار نوع العنصر */}
			<Dialog open={showPicker} onOpenChange={setShowPicker}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>{t("actions.selectElementType")}</DialogTitle>
					</DialogHeader>
					<ElementTypePicker onSelect={handleAddElement} />
				</DialogContent>
			</Dialog>
		</div>
	);
}
