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
	calculateCombinedFoundation,
	calculateStripFoundation,
	calculateRaftFoundation,
	type IsolatedFoundationResult,
	type CombinedFootingResult,
	type StripFoundationResult,
	type RaftFoundationResult,
} from "../../../lib/structural-calculations";
import type { IsolatedFoundationInput, CombinedFoundationInput, StripFoundationInput, RaftFoundationInput } from "../../../types/foundations";
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
	specs?: { concreteType: string; steelGrade: string };
}

type FoundationType = "isolated" | "combined" | "strip" | "raft";

interface FormData {
	name: string;
	type: FoundationType;
	quantity: number;
	length: number;
	width: number;
	height: number;
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
	// حقول مشتركة للمنفصلة والمشتركة
	foundationCoverBottom: number;
	foundationCoverTop: number;
	foundationCoverSide: number;
	foundationHasLeanConcrete: boolean;
	foundationLeanConcreteThickness: number;
	foundationHasColumnDowels: boolean;
	foundationDowelBarsPerColumn: number;
	foundationDowelDiameter: number;
	foundationDowelDevLength: number;
	// خاص بالمشتركة
	combinedColumnCount: number;
	combinedColumnSpacing: number;
	// للقواعد الشريطية
	stripLength: number;
	segments: Array<{ length: number }>; // backward compat
	bottomMainCount: number;
	bottomMainDiameter: number;
	hasBottomSecondary: boolean;
	bottomSecondaryCount: number;
	bottomSecondaryDiameter: number;
	hasTopMain: boolean;
	topMainCount: number;
	topMainDiameter: number;
	hasStirrup: boolean;
	stirrupDiameter: number;
	stirrupSpacing: number;
	// شريطية — mesh mode
	stripBottomMeshXDiameter: number;
	stripBottomMeshXBarsPerMeter: number;
	stripBottomMeshYDiameter: number;
	stripBottomMeshYBarsPerMeter: number;
	stripHasTopMesh: boolean;
	stripTopMeshXDiameter: number;
	stripTopMeshXBarsPerMeter: number;
	stripTopMeshYDiameter: number;
	stripTopMeshYBarsPerMeter: number;
	// شريطية — إعدادات متقدمة
	stripCoverBottom: number;
	stripCoverTop: number;
	stripCoverSide: number;
	stripHasLeanConcrete: boolean;
	stripLeanConcreteThickness: number;
	stripHasColumnDowels: boolean;
	stripColumnDowelCount: number;
	stripColumnDowelBarsPerColumn: number;
	stripColumnDowelDiameter: number;
	stripColumnDowelDevLength: number;
	stripHasIntersectionDeduction: boolean;
	stripIntersectionCount: number;
	stripIntersectingStripWidth: number;
	stripHasChairBars: boolean;
	stripChairBarsDiameter: number;
	stripChairBarsSpacingX: number;
	stripChairBarsSpacingY: number;
	stripLapSpliceMethod: '40d' | '50d' | '60d' | 'custom';
	stripCustomLapLength: number;
	stripShowAdvanced: boolean;
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
	// إعدادات اللبشة المتقدمة
	coverBottom: number;
	coverTop: number;
	coverSide: number;
	hasLeanConcrete: boolean;
	leanConcreteThickness: number;
	hasEdgeBeams: boolean;
	edgeBeamWidth: number;
	edgeBeamDepth: number;
	lapSpliceMethod: '40d' | '50d' | '60d' | 'custom';
	customLapLength: number;
	hasChairBars: boolean;
	chairBarsDiameter: number;
	chairBarsSpacingX: number;
	chairBarsSpacingY: number;
	columnDowelMode: 'none' | 'manual';
	columnDowelCount: number;
	columnDowelBarsPerColumn: number;
	columnDowelDiameter: number;
	columnDowelDevLength: number;
}

const FOUNDATION_TYPE_INFO: Record<FoundationType, { nameAr: string; description: string }> = {
	isolated: { nameAr: "قاعدة معزولة", description: "قاعدة منفصلة لعمود واحد" },
	combined: { nameAr: "قاعدة مشتركة", description: "قاعدة لعدة أعمدة" },
	strip: { nameAr: "قاعدة شريطية", description: "قاعدة شريطية متصلة" },
	raft: { nameAr: "لبشة", description: "قاعدة حصيرية كاملة" },
};

type CalculationResult = IsolatedFoundationResult | CombinedFootingResult | StripFoundationResult | RaftFoundationResult;

export function FoundationsSection({
	studyId,
	organizationId,
	items,
	onSave,
	onUpdate,
	specs,
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
		// حقول المنفصلة والمشتركة
		foundationCoverBottom: 0.075,
		foundationCoverTop: 0.05,
		foundationCoverSide: 0.05,
		foundationHasLeanConcrete: false,
		foundationLeanConcreteThickness: 0.10,
		foundationHasColumnDowels: false,
		foundationDowelBarsPerColumn: 4,
		foundationDowelDiameter: 16,
		foundationDowelDevLength: 0.60,
		// مشتركة
		combinedColumnCount: 2,
		combinedColumnSpacing: 0,
		// شريطية
		stripLength: 10,
		segments: [{ length: 10 }],
		bottomMainCount: 6,
		bottomMainDiameter: 16,
		hasBottomSecondary: false,
		bottomSecondaryCount: 4,
		bottomSecondaryDiameter: 12,
		hasTopMain: false,
		topMainCount: 4,
		topMainDiameter: 12,
		hasStirrup: true,
		stirrupDiameter: 10,
		stirrupSpacing: 200,
		// شريطية — mesh mode
		stripBottomMeshXDiameter: 16,
		stripBottomMeshXBarsPerMeter: 5,
		stripBottomMeshYDiameter: 16,
		stripBottomMeshYBarsPerMeter: 5,
		stripHasTopMesh: false,
		stripTopMeshXDiameter: 12,
		stripTopMeshXBarsPerMeter: 4,
		stripTopMeshYDiameter: 12,
		stripTopMeshYBarsPerMeter: 4,
		// شريطية — إعدادات متقدمة
		stripCoverBottom: 0.075,
		stripCoverTop: 0.05,
		stripCoverSide: 0.05,
		stripHasLeanConcrete: false,
		stripLeanConcreteThickness: 0.10,
		stripHasColumnDowels: false,
		stripColumnDowelCount: 0,
		stripColumnDowelBarsPerColumn: 4,
		stripColumnDowelDiameter: 16,
		stripColumnDowelDevLength: 0.80,
		stripHasIntersectionDeduction: false,
		stripIntersectionCount: 0,
		stripIntersectingStripWidth: 0.45,
		stripHasChairBars: false,
		stripChairBarsDiameter: 10,
		stripChairBarsSpacingX: 1.0,
		stripChairBarsSpacingY: 1.0,
		stripLapSpliceMethod: '40d' as const,
		stripCustomLapLength: 0.8,
		stripShowAdvanced: false,
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
		// إعدادات اللبشة المتقدمة
		coverBottom: 0.075,
		coverTop: 0.075,
		coverSide: 0.075,
		hasLeanConcrete: true,
		leanConcreteThickness: 0.10,
		hasEdgeBeams: false,
		edgeBeamWidth: 0.3,
		edgeBeamDepth: 0.3,
		lapSpliceMethod: '40d',
		customLapLength: 0.8,
		hasChairBars: false,
		chairBarsDiameter: 10,
		chairBarsSpacingX: 1.0,
		chairBarsSpacingY: 1.0,
		columnDowelMode: 'none',
		columnDowelCount: 0,
		columnDowelBarsPerColumn: 4,
		columnDowelDiameter: 16,
		columnDowelDevLength: 0.8,
	});

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
				// mesh mode fields
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
		setFormData({
			name: "",
			type: "isolated",
			quantity: 1,
			length: 0,
			width: 0,
			height: 0.6,
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
			foundationCoverBottom: 0.075,
			foundationCoverTop: 0.05,
			foundationCoverSide: 0.05,
			foundationHasLeanConcrete: false,
			foundationLeanConcreteThickness: 0.10,
			foundationHasColumnDowels: false,
			foundationDowelBarsPerColumn: 4,
			foundationDowelDiameter: 16,
			foundationDowelDevLength: 0.60,
			combinedColumnCount: 2,
			combinedColumnSpacing: 0,
			stripLength: 10,
			segments: [{ length: 10 }],
			bottomMainCount: 6,
			bottomMainDiameter: 16,
			hasBottomSecondary: false,
			bottomSecondaryCount: 4,
			bottomSecondaryDiameter: 12,
			hasTopMain: false,
			topMainCount: 4,
			topMainDiameter: 12,
			hasStirrup: true,
			stirrupDiameter: 10,
			stirrupSpacing: 200,
			stripBottomMeshXDiameter: 16,
			stripBottomMeshXBarsPerMeter: 5,
			stripBottomMeshYDiameter: 16,
			stripBottomMeshYBarsPerMeter: 5,
			stripHasTopMesh: false,
			stripTopMeshXDiameter: 12,
			stripTopMeshXBarsPerMeter: 4,
			stripTopMeshYDiameter: 12,
			stripTopMeshYBarsPerMeter: 4,
			stripCoverBottom: 0.075,
			stripCoverTop: 0.05,
			stripCoverSide: 0.05,
			stripHasLeanConcrete: false,
			stripLeanConcreteThickness: 0.10,
			stripHasColumnDowels: false,
			stripColumnDowelCount: 0,
			stripColumnDowelBarsPerColumn: 4,
			stripColumnDowelDiameter: 16,
			stripColumnDowelDevLength: 0.80,
			stripHasIntersectionDeduction: false,
			stripIntersectionCount: 0,
			stripIntersectingStripWidth: 0.45,
			stripHasChairBars: false,
			stripChairBarsDiameter: 10,
			stripChairBarsSpacingX: 1.0,
			stripChairBarsSpacingY: 1.0,
			stripLapSpliceMethod: '40d',
			stripCustomLapLength: 0.8,
			stripShowAdvanced: false,
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
			coverBottom: 0.075,
			coverTop: 0.075,
			coverSide: 0.075,
			hasLeanConcrete: true,
			leanConcreteThickness: 0.10,
			hasEdgeBeams: false,
			edgeBeamWidth: 0.3,
			edgeBeamDepth: 0.3,
			lapSpliceMethod: '40d',
			customLapLength: 0.8,
			hasChairBars: false,
			chairBarsDiameter: 10,
			chairBarsSpacingX: 1.0,
			chairBarsSpacingY: 1.0,
			columnDowelMode: 'none',
			columnDowelCount: 0,
			columnDowelBarsPerColumn: 4,
			columnDowelDiameter: 16,
			columnDowelDevLength: 0.8,
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
					segmentLength: formData.stripLength, // backward compat
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
			(updateMutation as any).mutate({ ...itemData, id: editingItemId, costStudyId: studyId });
		} else {
			(createMutation as any).mutate(itemData);
		}
	};

	const handleDelete = (id: string) => {
		if (confirm(t("pricing.studies.messages.confirmDelete"))) {
			(deleteMutation as any).mutate({ id, organizationId, costStudyId: studyId });
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
														cover: item.dimensions?.cover || 0.075,
														hookLength: item.dimensions?.hookLength || 0.10,
														bottomShortDiameter: item.dimensions?.bottomShortDiameter || 16,
														bottomShortBarsPerMeter: item.dimensions?.bottomShortBarsPerMeter || 5,
														bottomLongDiameter: item.dimensions?.bottomLongDiameter || 16,
														bottomLongBarsPerMeter: item.dimensions?.bottomLongBarsPerMeter || 5,
														hasTopShort: item.dimensions?.hasTopShort !== undefined ? !!item.dimensions.hasTopShort : true,
														topShortDiameter: item.dimensions?.topShortDiameter || 12,
														topShortBarsPerMeter: item.dimensions?.topShortBarsPerMeter || 4,
														hasTopLong: item.dimensions?.hasTopLong !== undefined ? !!item.dimensions.hasTopLong : true,
														topLongDiameter: item.dimensions?.topLongDiameter || 12,
														topLongBarsPerMeter: item.dimensions?.topLongBarsPerMeter || 4,
														foundationCoverBottom: item.dimensions?.foundationCoverBottom || 0.075,
														foundationCoverTop: item.dimensions?.foundationCoverTop || 0.05,
														foundationCoverSide: item.dimensions?.foundationCoverSide || 0.05,
														foundationHasLeanConcrete: item.dimensions?.foundationHasLeanConcrete !== undefined ? !!item.dimensions.foundationHasLeanConcrete : false,
														foundationLeanConcreteThickness: item.dimensions?.foundationLeanConcreteThickness || 0.10,
														foundationHasColumnDowels: item.dimensions?.foundationHasColumnDowels !== undefined ? !!item.dimensions.foundationHasColumnDowels : false,
														foundationDowelBarsPerColumn: item.dimensions?.foundationDowelBarsPerColumn || 4,
														foundationDowelDiameter: item.dimensions?.foundationDowelDiameter || 16,
														foundationDowelDevLength: item.dimensions?.foundationDowelDevLength || 0.60,
														combinedColumnCount: item.dimensions?.combinedColumnCount || 2,
														combinedColumnSpacing: item.dimensions?.combinedColumnSpacing || 0,
														stripLength: item.dimensions?.stripLength || item.dimensions?.segmentLength || 10,
														segments: [{ length: item.dimensions?.stripLength || item.dimensions?.segmentLength || 10 }],
														bottomMainCount: item.dimensions?.bottomMainCount || 6,
														bottomMainDiameter: item.dimensions?.bottomMainDiameter || 16,
														hasBottomSecondary: item.dimensions?.hasBottomSecondary !== undefined ? !!item.dimensions.hasBottomSecondary : false,
														bottomSecondaryCount: item.dimensions?.bottomSecondaryCount || 4,
														bottomSecondaryDiameter: item.dimensions?.bottomSecondaryDiameter || 12,
														hasTopMain: item.dimensions?.hasTopMain !== undefined ? !!item.dimensions.hasTopMain : false,
														topMainCount: item.dimensions?.topMainCount || 4,
														topMainDiameter: item.dimensions?.topMainDiameter || 12,
														hasStirrup: item.dimensions?.hasStirrup !== undefined ? !!item.dimensions.hasStirrup : true,
														stirrupDiameter: item.dimensions?.stirrupDiameter || 10,
														stirrupSpacing: item.dimensions?.stirrupSpacing || 200,
														stripBottomMeshXDiameter: item.dimensions?.stripBottomMeshXDiameter || 16,
														stripBottomMeshXBarsPerMeter: item.dimensions?.stripBottomMeshXBarsPerMeter || 5,
														stripBottomMeshYDiameter: item.dimensions?.stripBottomMeshYDiameter || 16,
														stripBottomMeshYBarsPerMeter: item.dimensions?.stripBottomMeshYBarsPerMeter || 5,
														stripHasTopMesh: item.dimensions?.stripHasTopMesh !== undefined ? !!item.dimensions.stripHasTopMesh : false,
														stripTopMeshXDiameter: item.dimensions?.stripTopMeshXDiameter || 12,
														stripTopMeshXBarsPerMeter: item.dimensions?.stripTopMeshXBarsPerMeter || 4,
														stripTopMeshYDiameter: item.dimensions?.stripTopMeshYDiameter || 12,
														stripTopMeshYBarsPerMeter: item.dimensions?.stripTopMeshYBarsPerMeter || 4,
														stripCoverBottom: item.dimensions?.stripCoverBottom || 0.075,
														stripCoverTop: item.dimensions?.stripCoverTop || 0.05,
														stripCoverSide: item.dimensions?.stripCoverSide || 0.05,
														stripHasLeanConcrete: item.dimensions?.stripHasLeanConcrete !== undefined ? !!item.dimensions.stripHasLeanConcrete : false,
														stripLeanConcreteThickness: item.dimensions?.stripLeanConcreteThickness || 0.10,
														stripHasColumnDowels: item.dimensions?.stripHasColumnDowels !== undefined ? !!item.dimensions.stripHasColumnDowels : false,
														stripColumnDowelCount: item.dimensions?.stripColumnDowelCount || 0,
														stripColumnDowelBarsPerColumn: item.dimensions?.stripColumnDowelBarsPerColumn || 4,
														stripColumnDowelDiameter: item.dimensions?.stripColumnDowelDiameter || 16,
														stripColumnDowelDevLength: item.dimensions?.stripColumnDowelDevLength || 0.80,
														stripHasIntersectionDeduction: item.dimensions?.stripHasIntersectionDeduction !== undefined ? !!item.dimensions.stripHasIntersectionDeduction : false,
														stripIntersectionCount: item.dimensions?.stripIntersectionCount || 0,
														stripIntersectingStripWidth: item.dimensions?.stripIntersectingStripWidth || 0.45,
														stripHasChairBars: item.dimensions?.stripHasChairBars !== undefined ? !!item.dimensions.stripHasChairBars : false,
														stripChairBarsDiameter: item.dimensions?.stripChairBarsDiameter || 10,
														stripChairBarsSpacingX: item.dimensions?.stripChairBarsSpacingX || 1.0,
														stripChairBarsSpacingY: item.dimensions?.stripChairBarsSpacingY || 1.0,
														stripLapSpliceMethod: (String(item.dimensions?.stripLapSpliceMethod || '40d') as FormData['stripLapSpliceMethod']),
														stripCustomLapLength: item.dimensions?.stripCustomLapLength || 0.8,
														stripShowAdvanced: false,
														thickness: item.dimensions?.thickness || 0.6,
														bottomXDiameter: item.dimensions?.bottomXDiameter || 16,
														bottomXBarsPerMeter: item.dimensions?.bottomXBarsPerMeter || 5,
														bottomYDiameter: item.dimensions?.bottomYDiameter || 16,
														bottomYBarsPerMeter: item.dimensions?.bottomYBarsPerMeter || 5,
														hasTopMesh: item.dimensions?.hasTopMesh !== undefined ? !!item.dimensions.hasTopMesh : true,
														topXDiameter: item.dimensions?.topXDiameter || 12,
														topXBarsPerMeter: item.dimensions?.topXBarsPerMeter || 4,
														topYDiameter: item.dimensions?.topYDiameter || 12,
														topYBarsPerMeter: item.dimensions?.topYBarsPerMeter || 4,
														coverBottom: item.dimensions?.coverBottom || 0.075,
														coverTop: item.dimensions?.coverTop || 0.075,
														coverSide: item.dimensions?.coverSide || 0.075,
														hasLeanConcrete: item.dimensions?.hasLeanConcrete !== undefined ? !!item.dimensions.hasLeanConcrete : true,
														leanConcreteThickness: item.dimensions?.leanConcreteThickness || 0.10,
														hasEdgeBeams: item.dimensions?.hasEdgeBeams !== undefined ? !!item.dimensions.hasEdgeBeams : false,
														edgeBeamWidth: item.dimensions?.edgeBeamWidth || 0.3,
														edgeBeamDepth: item.dimensions?.edgeBeamDepth || 0.3,
														lapSpliceMethod: (String(item.dimensions?.lapSpliceMethod || '40d') as FormData['lapSpliceMethod']),
														customLapLength: item.dimensions?.customLapLength || 0.8,
														hasChairBars: item.dimensions?.hasChairBars !== undefined ? !!item.dimensions.hasChairBars : false,
														chairBarsDiameter: item.dimensions?.chairBarsDiameter || 10,
														chairBarsSpacingX: item.dimensions?.chairBarsSpacingX || 1.0,
														chairBarsSpacingY: item.dimensions?.chairBarsSpacingY || 1.0,
														columnDowelMode: (String(item.dimensions?.columnDowelMode || 'none') as FormData['columnDowelMode']),
														columnDowelCount: item.dimensions?.columnDowelCount || 0,
														columnDowelBarsPerColumn: item.dimensions?.columnDowelBarsPerColumn || 4,
														columnDowelDiameter: item.dimensions?.columnDowelDiameter || 16,
														columnDowelDevLength: item.dimensions?.columnDowelDevLength || 0.8,
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
							showConcreteType={false}
							showQuantity={formData.type === "isolated" || formData.type === "combined" || formData.type === "strip"}
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

						{/* معلومات الأعمدة - للمشتركة فقط */}
						{formData.type === "combined" && (
							<div className="border rounded-lg p-3 space-y-3 bg-blue-50/50">
								<h5 className="text-sm font-medium text-blue-700">
									{t("pricing.studies.structural.combined.columnInfo")}
								</h5>
								<div className="grid grid-cols-2 gap-3 max-w-sm">
									<div>
										<Label className="text-xs">{t("pricing.studies.structural.combined.columnCount")}</Label>
										<Input
											type="number"
											value={formData.combinedColumnCount}
											onChange={(e: any) => setFormData({ ...formData, combinedColumnCount: parseInt(e.target.value) || 2 })}
											min={2}
											max={6}
											className="h-8"
										/>
									</div>
									<div>
										<Label className="text-xs">{t("pricing.studies.structural.combined.columnSpacing")} (م)</Label>
										<Input
											type="number"
											value={formData.combinedColumnSpacing}
											onChange={(e: any) => setFormData({ ...formData, combinedColumnSpacing: parseFloat(e.target.value) || 0 })}
											step={0.1}
											min={0}
											className="h-8"
										/>
									</div>
								</div>
								<p className="text-xs text-muted-foreground">
									{t("pricing.studies.structural.combined.columnNote")}
								</p>
							</div>
						)}

						{/* الأبعاد - للقاعدة الشريطية */}
						{formData.type === "strip" && (
							<>
								<DimensionsCard
									title="أبعاد القاعدة الشريطية"
									dimensions={[
										{ key: "stripLength", label: "الطول الكلي", value: formData.stripLength, unit: "م", step: 0.1 },
										{ key: "width", label: "العرض", value: formData.width, unit: "م", step: 0.05 },
										{ key: "height", label: "الارتفاع", value: formData.height, unit: "م", step: 0.1 },
									]}
									onDimensionChange={(key, value) => {
										if (key === "stripLength") {
											setFormData({ ...formData, stripLength: value, segments: [{ length: value }] });
										} else {
											setFormData({ ...formData, [key]: value });
										}
									}}
									calculatedVolume={formData.stripLength * formData.width * formData.height * formData.quantity}
								/>
								<div className="flex items-center gap-2">
									<Badge variant={formData.width <= 0.8 ? "default" : "secondary"}>
										{formData.width <= 0.8
											? t("pricing.studies.structural.strip.rebarMode.stirrups")
											: t("pricing.studies.structural.strip.rebarMode.mesh")
										}
									</Badge>
									<span className="text-xs text-muted-foreground">
										{formData.width <= 0.8
											? t("pricing.studies.structural.strip.stirrupsMode")
											: t("pricing.studies.structural.strip.meshMode")
										}
										{" "}({formData.width <= 0.8 ? "≤80cm" : ">80cm"})
									</span>
								</div>
							</>
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
											disabled={formData.type === "combined"}
											onChange={(e: any) =>
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
										{formData.type === "combined" && (
											<span className="text-xs text-muted-foreground ms-2">
												{t("pricing.studies.structural.combined.topMeshRequired")}
											</span>
										)}
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

						{/* إعدادات متقدمة للقاعدة المعزولة والمشتركة */}
						{(formData.type === "isolated" || formData.type === "combined") && (
							<div className="border-t pt-4 space-y-4">
								{/* الأغطية الخرسانية */}
								<div className="space-y-3">
									<h5 className="text-sm font-medium text-purple-700">
										{t("pricing.studies.structural.covers.label")}
									</h5>
									<div className="grid grid-cols-3 gap-3">
										<div>
											<Label className="text-xs">{t("pricing.studies.structural.covers.bottom")} (سم)</Label>
											<Input
												type="number"
												value={formData.foundationCoverBottom * 100}
												onChange={(e: any) => setFormData({ ...formData, foundationCoverBottom: parseFloat(e.target.value) / 100 || 0 })}
												step={0.5}
												min={3}
												max={15}
												className="h-8"
											/>
										</div>
										<div>
											<Label className="text-xs">{t("pricing.studies.structural.covers.top")} (سم)</Label>
											<Input
												type="number"
												value={formData.foundationCoverTop * 100}
												onChange={(e: any) => setFormData({ ...formData, foundationCoverTop: parseFloat(e.target.value) / 100 || 0 })}
												step={0.5}
												min={3}
												max={15}
												className="h-8"
											/>
										</div>
										<div>
											<Label className="text-xs">{t("pricing.studies.structural.covers.side")} (سم)</Label>
											<Input
												type="number"
												value={formData.foundationCoverSide * 100}
												onChange={(e: any) => setFormData({ ...formData, foundationCoverSide: parseFloat(e.target.value) / 100 || 0 })}
												step={0.5}
												min={3}
												max={15}
												className="h-8"
											/>
										</div>
									</div>
								</div>

								{/* خرسانة النظافة */}
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<input
											type="checkbox"
											id="foundationHasLeanConcrete"
											checked={formData.foundationHasLeanConcrete}
											onChange={(e: any) => setFormData({ ...formData, foundationHasLeanConcrete: e.target.checked })}
											className="rounded border-gray-500"
										/>
										<Label htmlFor="foundationHasLeanConcrete" className="text-sm font-medium text-gray-700">
											{t("pricing.studies.structural.leanConcrete.label")}
										</Label>
									</div>
									{formData.foundationHasLeanConcrete && (
										<div className="w-48">
											<Label className="text-xs">{t("pricing.studies.structural.leanConcrete.thickness")} (سم)</Label>
											<Input
												type="number"
												value={formData.foundationLeanConcreteThickness * 100}
												onChange={(e: any) => setFormData({ ...formData, foundationLeanConcreteThickness: parseFloat(e.target.value) / 100 || 0 })}
												step={1}
												min={5}
												max={20}
												className="h-8"
											/>
										</div>
									)}
								</div>

								{/* أسياخ انتظار الأعمدة */}
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<input
											type="checkbox"
											id="foundationHasColumnDowels"
											checked={formData.foundationHasColumnDowels}
											onChange={(e: any) => setFormData({ ...formData, foundationHasColumnDowels: e.target.checked })}
											className="rounded border-teal-500"
										/>
										<Label htmlFor="foundationHasColumnDowels" className="text-sm font-medium text-teal-700">
											{t("pricing.studies.structural.columnDowels.label")}
										</Label>
									</div>
									{formData.foundationHasColumnDowels && (
										<>
											<div className="grid grid-cols-3 gap-3 max-w-lg">
												<div>
													<Label className="text-xs">{t("pricing.studies.structural.columnDowels.barsPerColumn")}</Label>
													<Select
														value={String(formData.foundationDowelBarsPerColumn)}
														onValueChange={(v: any) => setFormData({ ...formData, foundationDowelBarsPerColumn: parseInt(v) })}
													>
														<SelectTrigger className="h-8">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															{[4, 6, 8, 10, 12].map(n => (
																<SelectItem key={n} value={String(n)}>{n}</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
												<div>
													<Label className="text-xs">{t("pricing.studies.structural.columnDowels.diameter")} (مم)</Label>
													<Select
														value={String(formData.foundationDowelDiameter)}
														onValueChange={(v: any) => setFormData({ ...formData, foundationDowelDiameter: parseInt(v) })}
													>
														<SelectTrigger className="h-8">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															{REBAR_DIAMETERS.filter(d => d >= 12).map(d => (
																<SelectItem key={d} value={String(d)}>Φ{d}</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
												<div>
													<Label className="text-xs">{t("pricing.studies.structural.columnDowels.developmentLength")} (م)</Label>
													<Input
														type="number"
														value={formData.foundationDowelDevLength}
														onChange={(e: any) => setFormData({ ...formData, foundationDowelDevLength: parseFloat(e.target.value) || 0 })}
														step={0.1}
														min={0.3}
														max={2}
														className="h-8"
													/>
												</div>
											</div>
											<p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
												{t("pricing.studies.structural.columnDowels.total", {
													columns: formData.type === "combined" ? formData.combinedColumnCount : 1,
													bars: formData.foundationDowelBarsPerColumn,
													total: (formData.type === "combined" ? formData.combinedColumnCount : 1) * formData.foundationDowelBarsPerColumn,
												})}
												{" "}Φ{formData.foundationDowelDiameter}
											</p>
										</>
									)}
								</div>
							</div>
						)}

						{/* حديد التسليح - للقاعدة الشريطية */}
						{formData.type === "strip" && formData.width <= 0.8 && (
							<div className="border-t pt-4 space-y-4">
								<h4 className="font-medium flex items-center gap-2">
									<span className="w-2 h-2 rounded-full bg-primary" />
									تسليح القاعدة الشريطية — {t("pricing.studies.structural.strip.rebarMode.stirrups")}
								</h4>

								{/* الحديد الطولي السفلي الرئيسي */}
								<div className="space-y-3">
									<h5 className="text-sm font-medium text-blue-700">الحديد الطولي الرئيسي (سفلي)</h5>
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
									</div>
								</div>

								{/* الحديد السفلي الثانوي (اختياري) */}
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<input
											type="checkbox"
											id="hasBottomSecondary"
											checked={formData.hasBottomSecondary}
											onChange={(e: any) => setFormData({ ...formData, hasBottomSecondary: e.target.checked })}
											className="rounded border-blue-500"
										/>
										<Label htmlFor="hasBottomSecondary" className="text-sm font-medium text-blue-600">
											{t("pricing.studies.structural.strip.bottomSecondary")}
										</Label>
									</div>
									{formData.hasBottomSecondary && (
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
											<RebarBarsInput
												title={t("pricing.studies.structural.strip.bottomSecondary")}
												diameter={formData.bottomSecondaryDiameter}
												onDiameterChange={(d) => setFormData({ ...formData, bottomSecondaryDiameter: d })}
												barsCount={formData.bottomSecondaryCount}
												onBarsCountChange={(n) => setFormData({ ...formData, bottomSecondaryCount: n })}
												colorScheme="blue"
												availableDiameters={REBAR_DIAMETERS.filter(d => d >= 10)}
												availableBarsCount={[2, 3, 4, 5, 6]}
											/>
										</div>
									)}
								</div>

								{/* الحديد العلوي (اختياري) */}
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<input
											type="checkbox"
											id="hasTopMain"
											checked={formData.hasTopMain}
											onChange={(e: any) => setFormData({ ...formData, hasTopMain: e.target.checked })}
											className="rounded border-green-500"
										/>
										<Label htmlFor="hasTopMain" className="text-sm font-medium text-green-700">
											{t("pricing.studies.structural.strip.topBars")}
										</Label>
									</div>
									{formData.hasTopMain && (
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
											<RebarBarsInput
												title={t("pricing.studies.structural.strip.topBars")}
												diameter={formData.topMainDiameter}
												onDiameterChange={(d) => setFormData({ ...formData, topMainDiameter: d })}
												barsCount={formData.topMainCount}
												onBarsCountChange={(n) => setFormData({ ...formData, topMainCount: n })}
												colorScheme="green"
												availableDiameters={REBAR_DIAMETERS.filter(d => d >= 10)}
												availableBarsCount={[2, 3, 4, 5, 6]}
											/>
										</div>
									)}
								</div>

								{/* الكانات */}
								<div className="space-y-3">
									<h5 className="text-sm font-medium text-orange-700">الكانات</h5>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
							</div>
						)}

						{/* حديد التسليح - للقاعدة الشريطية — وضع الشبكة */}
						{formData.type === "strip" && formData.width > 0.8 && (
							<div className="border-t pt-4 space-y-4">
								<h4 className="font-medium flex items-center gap-2">
									<span className="w-2 h-2 rounded-full bg-primary" />
									تسليح القاعدة الشريطية — {t("pricing.studies.structural.strip.rebarMode.mesh")}
								</h4>

								{/* الشبكة السفلية */}
								<div className="space-y-3">
									<h5 className="text-sm font-medium text-blue-700">{t("pricing.studies.structural.strip.bottomMesh")}</h5>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<RebarMeshInput
											title={t("pricing.studies.structural.strip.bottomMesh")}
											direction="اتجاه X"
											diameter={formData.stripBottomMeshXDiameter}
											onDiameterChange={(d) => setFormData({ ...formData, stripBottomMeshXDiameter: d })}
											barsPerMeter={formData.stripBottomMeshXBarsPerMeter}
											onBarsPerMeterChange={(n) => setFormData({ ...formData, stripBottomMeshXBarsPerMeter: n })}
											colorScheme="blue"
											availableDiameters={REBAR_DIAMETERS.filter(d => d >= 14)}
											availableBarsPerMeter={[4, 5, 6, 7, 8]}
										/>
										<RebarMeshInput
											title={t("pricing.studies.structural.strip.bottomMesh")}
											direction="اتجاه Y"
											diameter={formData.stripBottomMeshYDiameter}
											onDiameterChange={(d) => setFormData({ ...formData, stripBottomMeshYDiameter: d })}
											barsPerMeter={formData.stripBottomMeshYBarsPerMeter}
											onBarsPerMeterChange={(n) => setFormData({ ...formData, stripBottomMeshYBarsPerMeter: n })}
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
											id="stripHasTopMesh"
											checked={formData.stripHasTopMesh}
											onChange={(e: any) => setFormData({ ...formData, stripHasTopMesh: e.target.checked })}
											className="rounded border-green-500"
										/>
										<Label htmlFor="stripHasTopMesh" className="text-sm font-medium text-green-700">
											{t("pricing.studies.structural.strip.topMesh")}
										</Label>
									</div>
									{formData.stripHasTopMesh && (
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
											<RebarMeshInput
												title={t("pricing.studies.structural.strip.topMesh")}
												direction="اتجاه X"
												diameter={formData.stripTopMeshXDiameter}
												onDiameterChange={(d) => setFormData({ ...formData, stripTopMeshXDiameter: d })}
												barsPerMeter={formData.stripTopMeshXBarsPerMeter}
												onBarsPerMeterChange={(n) => setFormData({ ...formData, stripTopMeshXBarsPerMeter: n })}
												colorScheme="green"
												availableDiameters={REBAR_DIAMETERS.filter(d => d >= 12 && d <= 18)}
												availableBarsPerMeter={[3, 4, 5, 6]}
											/>
											<RebarMeshInput
												title={t("pricing.studies.structural.strip.topMesh")}
												direction="اتجاه Y"
												diameter={formData.stripTopMeshYDiameter}
												onDiameterChange={(d) => setFormData({ ...formData, stripTopMeshYDiameter: d })}
												barsPerMeter={formData.stripTopMeshYBarsPerMeter}
												onBarsPerMeterChange={(n) => setFormData({ ...formData, stripTopMeshYBarsPerMeter: n })}
												colorScheme="green"
												availableDiameters={REBAR_DIAMETERS.filter(d => d >= 12 && d <= 18)}
												availableBarsPerMeter={[3, 4, 5, 6]}
											/>
										</div>
									)}
								</div>

								{/* وصلة التراكب */}
								<div className="space-y-3">
									<h5 className="text-sm font-medium text-orange-700">{t("pricing.studies.structural.raft.lapSplice")}</h5>
									<div className="flex items-center gap-3">
										<div className="w-48">
											<Label className="text-xs">{t("pricing.studies.structural.raft.lapSpliceMethod")}</Label>
											<Select
												value={formData.stripLapSpliceMethod}
												onValueChange={(v: any) => setFormData({ ...formData, stripLapSpliceMethod: v })}
											>
												<SelectTrigger className="h-8">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="40d">40d</SelectItem>
													<SelectItem value="50d">50d</SelectItem>
													<SelectItem value="60d">60d</SelectItem>
													<SelectItem value="custom">{t("pricing.studies.structural.raft.lapSpliceCustom")}</SelectItem>
												</SelectContent>
											</Select>
										</div>
										{formData.stripLapSpliceMethod === 'custom' && (
											<div className="w-36">
												<Label className="text-xs">{t("pricing.studies.structural.raft.lapSpliceCustom")} (م)</Label>
												<Input
													type="number"
													value={formData.stripCustomLapLength}
													onChange={(e: any) => setFormData({ ...formData, stripCustomLapLength: parseFloat(e.target.value) || 0 })}
													step={0.05}
													min={0.3}
													max={3}
													className="h-8"
												/>
											</div>
										)}
									</div>
									{formData.stripLength > 12 ? (
										<p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
											{t("pricing.studies.structural.raft.lapSpliceNote")}
										</p>
									) : null}
								</div>
							</div>
						)}

						{/* إعدادات متقدمة — القاعدة الشريطية */}
						{formData.type === "strip" && (
							<div className="border-t pt-4 space-y-4">
								<button
									type="button"
									className="flex items-center gap-2 text-sm font-medium text-purple-700 hover:text-purple-900"
									onClick={() => setFormData({ ...formData, stripShowAdvanced: !formData.stripShowAdvanced })}
								>
									<span className={`transition-transform ${formData.stripShowAdvanced ? 'rotate-90' : ''}`}>&#9654;</span>
									{t("pricing.studies.structural.strip.advancedSettings")}
								</button>

								{formData.stripShowAdvanced && (
									<div className="space-y-4 ps-2 border-s-2 border-purple-200">
										{/* الأغطية الخرسانية */}
										<div className="space-y-3">
											<h5 className="text-sm font-medium text-purple-700">{t("pricing.studies.structural.covers.label")}</h5>
											<div className="grid grid-cols-3 gap-3">
												<div>
													<Label className="text-xs">{t("pricing.studies.structural.covers.bottom")} (سم)</Label>
													<Input
														type="number"
														value={formData.stripCoverBottom * 100}
														onChange={(e: any) => setFormData({ ...formData, stripCoverBottom: parseFloat(e.target.value) / 100 || 0 })}
														step={0.5}
														min={3}
														max={15}
														className="h-8"
													/>
												</div>
												<div>
													<Label className="text-xs">{t("pricing.studies.structural.covers.top")} (سم)</Label>
													<Input
														type="number"
														value={formData.stripCoverTop * 100}
														onChange={(e: any) => setFormData({ ...formData, stripCoverTop: parseFloat(e.target.value) / 100 || 0 })}
														step={0.5}
														min={3}
														max={15}
														className="h-8"
													/>
												</div>
												<div>
													<Label className="text-xs">{t("pricing.studies.structural.covers.side")} (سم)</Label>
													<Input
														type="number"
														value={formData.stripCoverSide * 100}
														onChange={(e: any) => setFormData({ ...formData, stripCoverSide: parseFloat(e.target.value) / 100 || 0 })}
														step={0.5}
														min={3}
														max={15}
														className="h-8"
													/>
												</div>
											</div>
										</div>

										{/* خرسانة النظافة */}
										<div className="space-y-3">
											<div className="flex items-center gap-2">
												<input
													type="checkbox"
													id="stripHasLeanConcrete"
													checked={formData.stripHasLeanConcrete}
													onChange={(e: any) => setFormData({ ...formData, stripHasLeanConcrete: e.target.checked })}
													className="rounded border-gray-500"
												/>
												<Label htmlFor="stripHasLeanConcrete" className="text-sm font-medium text-gray-700">
													{t("pricing.studies.structural.leanConcrete.label")}
												</Label>
											</div>
											{formData.stripHasLeanConcrete && (
												<div className="w-48">
													<Label className="text-xs">{t("pricing.studies.structural.leanConcrete.thickness")} (سم)</Label>
													<Input
														type="number"
														value={formData.stripLeanConcreteThickness * 100}
														onChange={(e: any) => setFormData({ ...formData, stripLeanConcreteThickness: parseFloat(e.target.value) / 100 || 0 })}
														step={1}
														min={5}
														max={20}
														className="h-8"
													/>
												</div>
											)}
										</div>

										{/* خصم التقاطعات */}
										<div className="space-y-3">
											<div className="flex items-center gap-2">
												<input
													type="checkbox"
													id="stripHasIntersectionDeduction"
													checked={formData.stripHasIntersectionDeduction}
													onChange={(e: any) => setFormData({ ...formData, stripHasIntersectionDeduction: e.target.checked })}
													className="rounded border-amber-500"
												/>
												<Label htmlFor="stripHasIntersectionDeduction" className="text-sm font-medium text-amber-700">
													{t("pricing.studies.structural.strip.intersectionDeduction")}
												</Label>
											</div>
											{formData.stripHasIntersectionDeduction && (
												<>
													<div className="grid grid-cols-2 gap-3 max-w-sm">
														<div>
															<Label className="text-xs">{t("pricing.studies.structural.strip.intersectionCount")}</Label>
															<Input
																type="number"
																value={formData.stripIntersectionCount}
																onChange={(e: any) => setFormData({ ...formData, stripIntersectionCount: parseInt(e.target.value) || 0 })}
																min={0}
																max={50}
																className="h-8"
															/>
														</div>
														<div>
															<Label className="text-xs">{t("pricing.studies.structural.strip.intersectingWidth")} (م)</Label>
															<Input
																type="number"
																value={formData.stripIntersectingStripWidth}
																onChange={(e: any) => setFormData({ ...formData, stripIntersectingStripWidth: parseFloat(e.target.value) || 0 })}
																step={0.05}
																min={0.2}
																max={2}
																className="h-8"
															/>
														</div>
													</div>
													<p className="text-xs text-muted-foreground bg-amber-50 p-2 rounded">
														{t("pricing.studies.structural.strip.intersectionNote")}
													</p>
												</>
											)}
										</div>

										{/* أسياخ انتظار الأعمدة */}
										<div className="space-y-3">
											<div className="flex items-center gap-2">
												<input
													type="checkbox"
													id="stripHasColumnDowels"
													checked={formData.stripHasColumnDowels}
													onChange={(e: any) => setFormData({ ...formData, stripHasColumnDowels: e.target.checked })}
													className="rounded border-teal-500"
												/>
												<Label htmlFor="stripHasColumnDowels" className="text-sm font-medium text-teal-700">
													{t("pricing.studies.structural.columnDowels.label")}
												</Label>
											</div>
											{formData.stripHasColumnDowels && (
												<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
													<div>
														<Label className="text-xs">{t("pricing.studies.structural.raft.columnCount")}</Label>
														<Input
															type="number"
															value={formData.stripColumnDowelCount}
															onChange={(e: any) => setFormData({ ...formData, stripColumnDowelCount: parseInt(e.target.value) || 0 })}
															min={0}
															className="h-8"
														/>
													</div>
													<div>
														<Label className="text-xs">{t("pricing.studies.structural.raft.barsPerColumn")}</Label>
														<Select
															value={String(formData.stripColumnDowelBarsPerColumn)}
															onValueChange={(v: any) => setFormData({ ...formData, stripColumnDowelBarsPerColumn: parseInt(v) })}
														>
															<SelectTrigger className="h-8">
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																{[4, 6, 8, 10, 12].map(n => (
																	<SelectItem key={n} value={String(n)}>{n}</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>
													<div>
														<Label className="text-xs">Φ (مم)</Label>
														<Select
															value={String(formData.stripColumnDowelDiameter)}
															onValueChange={(v: any) => setFormData({ ...formData, stripColumnDowelDiameter: parseInt(v) })}
														>
															<SelectTrigger className="h-8">
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																{REBAR_DIAMETERS.filter(d => d >= 12).map(d => (
																	<SelectItem key={d} value={String(d)}>Φ{d}</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>
													<div>
														<Label className="text-xs">{t("pricing.studies.structural.raft.developmentLength")} (م)</Label>
														<Input
															type="number"
															value={formData.stripColumnDowelDevLength}
															onChange={(e: any) => setFormData({ ...formData, stripColumnDowelDevLength: parseFloat(e.target.value) || 0 })}
															step={0.1}
															min={0.3}
															max={2}
															className="h-8"
														/>
													</div>
												</div>
											)}
										</div>

										{/* كراسي حديد — mesh mode only */}
										{formData.width > 0.8 && (
											<div className="space-y-3">
												<div className="flex items-center gap-2">
													<input
														type="checkbox"
														id="stripHasChairBars"
														checked={formData.stripHasChairBars}
														onChange={(e: any) => setFormData({ ...formData, stripHasChairBars: e.target.checked })}
														className="rounded border-gray-500"
													/>
													<Label htmlFor="stripHasChairBars" className="text-sm font-medium text-gray-700">
														{t("pricing.studies.structural.raft.chairBars")}
													</Label>
												</div>
												{formData.stripHasChairBars && (
													<div className="grid grid-cols-3 gap-3 max-w-lg">
														<div>
															<Label className="text-xs">{t("pricing.studies.structural.raft.chairDiameter")} (مم)</Label>
															<Select
																value={String(formData.stripChairBarsDiameter)}
																onValueChange={(v: any) => setFormData({ ...formData, stripChairBarsDiameter: parseInt(v) })}
															>
																<SelectTrigger className="h-8">
																	<SelectValue />
																</SelectTrigger>
																<SelectContent>
																	{REBAR_DIAMETERS.filter(d => d >= 8 && d <= 14).map(d => (
																		<SelectItem key={d} value={String(d)}>Φ{d}</SelectItem>
																	))}
																</SelectContent>
															</Select>
														</div>
														<div>
															<Label className="text-xs">{t("pricing.studies.structural.raft.chairSpacing")} X (م)</Label>
															<Input
																type="number"
																value={formData.stripChairBarsSpacingX}
																onChange={(e: any) => setFormData({ ...formData, stripChairBarsSpacingX: parseFloat(e.target.value) || 0 })}
																step={0.1}
																min={0.5}
																max={2}
																className="h-8"
															/>
														</div>
														<div>
															<Label className="text-xs">{t("pricing.studies.structural.raft.chairSpacing")} Y (م)</Label>
															<Input
																type="number"
																value={formData.stripChairBarsSpacingY}
																onChange={(e: any) => setFormData({ ...formData, stripChairBarsSpacingY: parseFloat(e.target.value) || 0 })}
																step={0.1}
																min={0.5}
																max={2}
																className="h-8"
															/>
														</div>
													</div>
												)}
											</div>
										)}
									</div>
								)}
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
											onChange={(e: any) =>
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

						{/* إعدادات اللبشة المتقدمة */}
						{formData.type === "raft" && (
							<div className="border-t pt-4 space-y-4">
								{/* الأغطية الخرسانية */}
								<div className="space-y-3">
									<h5 className="text-sm font-medium text-purple-700">{t("pricing.studies.structural.raft.covers")}</h5>
									<div className="grid grid-cols-3 gap-3">
										<div>
											<Label className="text-xs">{t("pricing.studies.structural.raft.coverBottom")} (سم)</Label>
											<Input
												type="number"
												value={formData.coverBottom * 100}
												onChange={(e: any) => setFormData({ ...formData, coverBottom: parseFloat(e.target.value) / 100 || 0 })}
												step={0.5}
												min={3}
												max={15}
												className="h-8"
											/>
										</div>
										<div>
											<Label className="text-xs">{t("pricing.studies.structural.raft.coverTop")} (سم)</Label>
											<Input
												type="number"
												value={formData.coverTop * 100}
												onChange={(e: any) => setFormData({ ...formData, coverTop: parseFloat(e.target.value) / 100 || 0 })}
												step={0.5}
												min={3}
												max={15}
												className="h-8"
											/>
										</div>
										<div>
											<Label className="text-xs">{t("pricing.studies.structural.raft.coverSide")} (سم)</Label>
											<Input
												type="number"
												value={formData.coverSide * 100}
												onChange={(e: any) => setFormData({ ...formData, coverSide: parseFloat(e.target.value) / 100 || 0 })}
												step={0.5}
												min={3}
												max={15}
												className="h-8"
											/>
										</div>
									</div>
								</div>

								{/* خرسانة النظافة */}
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<input
											type="checkbox"
											id="hasLeanConcrete"
											checked={formData.hasLeanConcrete}
											onChange={(e: any) => setFormData({ ...formData, hasLeanConcrete: e.target.checked })}
											className="rounded border-gray-500"
										/>
										<Label htmlFor="hasLeanConcrete" className="text-sm font-medium text-gray-700">
											{t("pricing.studies.structural.raft.leanConcrete")}
										</Label>
									</div>
									{formData.hasLeanConcrete && (
										<div className="w-48">
											<Label className="text-xs">{t("pricing.studies.structural.raft.leanConcreteThickness")} (سم)</Label>
											<Input
												type="number"
												value={formData.leanConcreteThickness * 100}
												onChange={(e: any) => setFormData({ ...formData, leanConcreteThickness: parseFloat(e.target.value) / 100 || 0 })}
												step={1}
												min={5}
												max={20}
												className="h-8"
											/>
										</div>
									)}
								</div>

								{/* تسميك الحواف */}
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<input
											type="checkbox"
											id="hasEdgeBeams"
											checked={formData.hasEdgeBeams}
											onChange={(e: any) => setFormData({ ...formData, hasEdgeBeams: e.target.checked })}
											className="rounded border-gray-500"
										/>
										<Label htmlFor="hasEdgeBeams" className="text-sm font-medium text-gray-700">
											{t("pricing.studies.structural.raft.edgeBeams")}
										</Label>
									</div>
									{formData.hasEdgeBeams && (
										<div className="grid grid-cols-2 gap-3 max-w-sm">
											<div>
												<Label className="text-xs">{t("pricing.studies.structural.raft.edgeBeamWidth")} (م)</Label>
												<Input
													type="number"
													value={formData.edgeBeamWidth}
													onChange={(e: any) => setFormData({ ...formData, edgeBeamWidth: parseFloat(e.target.value) || 0 })}
													step={0.05}
													min={0.2}
													max={0.6}
													className="h-8"
												/>
											</div>
											<div>
												<Label className="text-xs">{t("pricing.studies.structural.raft.edgeBeamDepth")} (م)</Label>
												<Input
													type="number"
													value={formData.edgeBeamDepth}
													onChange={(e: any) => setFormData({ ...formData, edgeBeamDepth: parseFloat(e.target.value) || 0 })}
													step={0.05}
													min={0.1}
													max={0.5}
													className="h-8"
												/>
											</div>
										</div>
									)}
								</div>

								{/* وصلة التراكب */}
								<div className="space-y-3">
									<h5 className="text-sm font-medium text-orange-700">{t("pricing.studies.structural.raft.lapSplice")}</h5>
									<div className="flex items-center gap-3">
										<div className="w-48">
											<Label className="text-xs">{t("pricing.studies.structural.raft.lapSpliceMethod")}</Label>
											<Select
												value={formData.lapSpliceMethod}
												onValueChange={(v: any) => setFormData({ ...formData, lapSpliceMethod: v })}
											>
												<SelectTrigger className="h-8">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="40d">40d</SelectItem>
													<SelectItem value="50d">50d</SelectItem>
													<SelectItem value="60d">60d</SelectItem>
													<SelectItem value="custom">{t("pricing.studies.structural.raft.lapSpliceCustom")}</SelectItem>
												</SelectContent>
											</Select>
										</div>
										{formData.lapSpliceMethod === 'custom' && (
											<div className="w-36">
												<Label className="text-xs">{t("pricing.studies.structural.raft.lapSpliceCustom")} (م)</Label>
												<Input
													type="number"
													value={formData.customLapLength}
													onChange={(e: any) => setFormData({ ...formData, customLapLength: parseFloat(e.target.value) || 0 })}
													step={0.05}
													min={0.3}
													max={3}
													className="h-8"
												/>
											</div>
										)}
									</div>
									{formData.length > 12 || formData.width > 12 ? (
										<p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
											⚠ {t("pricing.studies.structural.raft.lapSpliceNote")}
										</p>
									) : null}
								</div>

								{/* كراسي حديد */}
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<input
											type="checkbox"
											id="hasChairBars"
											checked={formData.hasChairBars}
											onChange={(e: any) => setFormData({ ...formData, hasChairBars: e.target.checked })}
											className="rounded border-gray-500"
										/>
										<Label htmlFor="hasChairBars" className="text-sm font-medium text-gray-700">
											{t("pricing.studies.structural.raft.chairBars")}
										</Label>
									</div>
									{formData.hasChairBars && (
										<div className="grid grid-cols-3 gap-3 max-w-lg">
											<div>
												<Label className="text-xs">{t("pricing.studies.structural.raft.chairDiameter")} (مم)</Label>
												<Select
													value={String(formData.chairBarsDiameter)}
													onValueChange={(v: any) => setFormData({ ...formData, chairBarsDiameter: parseInt(v) })}
												>
													<SelectTrigger className="h-8">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{REBAR_DIAMETERS.filter(d => d >= 8 && d <= 14).map(d => (
															<SelectItem key={d} value={String(d)}>Φ{d}</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div>
												<Label className="text-xs">{t("pricing.studies.structural.raft.chairSpacing")} X (م)</Label>
												<Input
													type="number"
													value={formData.chairBarsSpacingX}
													onChange={(e: any) => setFormData({ ...formData, chairBarsSpacingX: parseFloat(e.target.value) || 0 })}
													step={0.1}
													min={0.5}
													max={2}
													className="h-8"
												/>
											</div>
											<div>
												<Label className="text-xs">{t("pricing.studies.structural.raft.chairSpacing")} Y (م)</Label>
												<Input
													type="number"
													value={formData.chairBarsSpacingY}
													onChange={(e: any) => setFormData({ ...formData, chairBarsSpacingY: parseFloat(e.target.value) || 0 })}
													step={0.1}
													min={0.5}
													max={2}
													className="h-8"
												/>
											</div>
										</div>
									)}
								</div>

								{/* أسياخ انتظار الأعمدة */}
								<div className="space-y-3">
									<h5 className="text-sm font-medium text-teal-700">{t("pricing.studies.structural.raft.columnDowels")}</h5>
									<div className="w-48">
										<Select
											value={formData.columnDowelMode}
											onValueChange={(v: any) => setFormData({ ...formData, columnDowelMode: v })}
										>
											<SelectTrigger className="h-8">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="none">{t("pricing.studies.structural.raft.columnDowelNone")}</SelectItem>
												<SelectItem value="manual">{t("pricing.studies.structural.raft.columnDowelManual")}</SelectItem>
											</SelectContent>
										</Select>
									</div>
									{formData.columnDowelMode === 'manual' && (
										<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
											<div>
												<Label className="text-xs">{t("pricing.studies.structural.raft.columnCount")}</Label>
												<Input
													type="number"
													value={formData.columnDowelCount}
													onChange={(e: any) => setFormData({ ...formData, columnDowelCount: parseInt(e.target.value) || 0 })}
													min={0}
													className="h-8"
												/>
											</div>
											<div>
												<Label className="text-xs">{t("pricing.studies.structural.raft.barsPerColumn")}</Label>
												<Select
													value={String(formData.columnDowelBarsPerColumn)}
													onValueChange={(v: any) => setFormData({ ...formData, columnDowelBarsPerColumn: parseInt(v) })}
												>
													<SelectTrigger className="h-8">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{[4, 6, 8, 10, 12].map(n => (
															<SelectItem key={n} value={String(n)}>{n}</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div>
												<Label className="text-xs">Φ (مم)</Label>
												<Select
													value={String(formData.columnDowelDiameter)}
													onValueChange={(v: any) => setFormData({ ...formData, columnDowelDiameter: parseInt(v) })}
												>
													<SelectTrigger className="h-8">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{REBAR_DIAMETERS.filter(d => d >= 12).map(d => (
															<SelectItem key={d} value={String(d)}>Φ{d}</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div>
												<Label className="text-xs">{t("pricing.studies.structural.raft.developmentLength")} (م)</Label>
												<Input
													type="number"
													value={formData.columnDowelDevLength}
													onChange={(e: any) => setFormData({ ...formData, columnDowelDevLength: parseFloat(e.target.value) || 0 })}
													step={0.1}
													min={0.3}
													max={2}
													className="h-8"
												/>
											</div>
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
