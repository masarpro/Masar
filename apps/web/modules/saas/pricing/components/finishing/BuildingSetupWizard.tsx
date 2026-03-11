"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import {
	ArrowLeft,
	ArrowRight,
	Check,
	Loader2,
	SkipForward,
	Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { SmartBuildingConfig } from "../../lib/smart-building-types";
import { deriveAllQuantities } from "../../lib/derivation-engine";
import { BuildingStructureStep } from "./wizard/BuildingStructureStep";
import { FloorDetailsStep } from "./wizard/FloorDetailsStep";
import { ExteriorStep } from "./wizard/ExteriorStep";
import { ReviewStep } from "./wizard/ReviewStep";

import type { SavedFinishingItem } from "../../lib/merge-quantities";
import type { CascadeChange } from "./CascadeNotification";

interface BuildingSetupWizardProps {
	organizationId: string;
	studyId: string;
	initialConfig?: SmartBuildingConfig | null;
	savedItems?: SavedFinishingItem[];
	onComplete: (cascadeInfo?: { changes: CascadeChange[]; skippedManualCount: number }) => void;
	onSkip: () => void;
}

const STEPS = [
	{ key: "step1", icon: "1" },
	{ key: "step2", icon: "2" },
	{ key: "step3", icon: "3" },
	{ key: "step4", icon: "4" },
] as const;

export function BuildingSetupWizard({
	organizationId,
	studyId,
	initialConfig,
	savedItems,
	onComplete,
	onSkip,
}: BuildingSetupWizardProps) {
	const tw = useTranslations("pricing.studies.finishing.wizard");
	const tLink = useTranslations("pricing.studies.finishing.linking");
	const tConfig = useTranslations("pricing.studies.finishing.buildingConfig");
	const queryClient = useQueryClient();

	const [step, setStep] = useState(initialConfig?.setupStep ?? 0);
	const [config, setConfig] = useState<SmartBuildingConfig>(
		initialConfig ?? {
			totalLandArea: 0,
			buildingPerimeter: 0,
			floors: [],
		},
	);

	// ── Save mutation (auto-save per step) ──

	const saveMutation = useMutation(
		orpc.pricing.studies.buildingConfig.update.mutationOptions({
			onSuccess: (data: any) => {
				const count =
					(data as { cascadeUpdatedCount?: number })
						.cascadeUpdatedCount ?? 0;
				if (count > 0) {
					toast.success(tLink("autoUpdatedCount", { count }));
				}
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies"]],
				});
			},
			onError: () => {
				toast.error(tConfig("saveError"));
			},
		}),
	);

	const saveConfig = useCallback(
		(cfg: SmartBuildingConfig, stepIdx: number) => {
			(saveMutation as any).mutate({
				organizationId,
				costStudyId: studyId,
				buildingConfig: {
					...cfg,
					setupStep: stepIdx,
					isComplete: false,
				},
			});
		},
		[organizationId, studyId, saveMutation],
	);

	// ── Batch create mutation (for final generation) ──

	const batchCreateMutation = useMutation(
		orpc.pricing.studies.finishingItem.createBatch.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies"]],
				});
			},
		}),
	);

	// ── Navigation ──

	const goNext = useCallback(() => {
		if (step < 3) {
			const nextStep = step + 1;
			setStep(nextStep);
			saveConfig(config, nextStep);
		}
	}, [step, config, saveConfig]);

	const goPrev = useCallback(() => {
		if (step > 0) {
			setStep(step - 1);
		}
	}, [step]);

	const goToStep = useCallback(
		(idx: number) => {
			if (idx <= step) {
				setStep(idx);
			}
		},
		[step],
	);

	// ── Update mutation (for re-edit cascade) ──

	const updateMutation = useMutation(
		orpc.pricing.studies.finishingItem.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies"]],
				});
			},
		}),
	);

	// ── Generate quantities ──

	const handleGenerate = useCallback(async () => {
		const finalConfig: SmartBuildingConfig = {
			...config,
			setupStep: 4,
			isComplete: true,
		};

		// Save final config
		(saveMutation as any).mutate(
			{
				organizationId,
				costStudyId: studyId,
				buildingConfig: finalConfig,
			},
			{
				onSuccess: () => {
					// Derive quantities
					const derived = deriveAllQuantities(finalConfig);
					const enabledItems = derived.filter((d) => d.isEnabled);

					// Re-edit mode: items already exist
					const isReEdit = savedItems && savedItems.length > 0;

					if (isReEdit) {
						const cascadeResults: CascadeChange[] = [];
						let skippedManual = 0;

						// Match derived items with saved items and update
						for (const d of enabledItems) {
							const matchKey = buildMatchKey(d);
							const savedItem = savedItems.find(
								(s) => buildSavedMatchKey(s) === matchKey,
							);

							if (!savedItem) continue;

							const savedQty =
								savedItem.area ??
								savedItem.length ??
								savedItem.quantity ??
								0;
							const isManual =
								savedItem.dataSource === "manual";

							if (
								Math.abs(savedQty - d.quantity) < 0.01
							)
								continue; // No change

							if (isManual) {
								skippedManual++;
								cascadeResults.push({
									itemKey: d.categoryKey,
									itemName: getCategoryName(
										d.categoryKey,
									),
									oldQuantity: savedQty,
									newQuantity: d.quantity,
									unit: d.unit,
									isManual: true,
								});
							} else {
								// Update the saved item
								(updateMutation as any).mutate({
									organizationId,
									costStudyId: studyId,
									id: savedItem.id,
									area:
										d.unit === "m2"
											? d.quantity
											: undefined,
									length:
										d.unit === "m"
											? d.quantity
											: undefined,
									quantity:
										d.unit !== "m2" &&
										d.unit !== "m"
											? d.quantity
											: undefined,
									wastagePercent:
										d.wastagePercent,
									dataSource: d.dataSource,
								});
								cascadeResults.push({
									itemKey: d.categoryKey,
									itemName: getCategoryName(
										d.categoryKey,
									),
									oldQuantity: savedQty,
									newQuantity: d.quantity,
									unit: d.unit,
									isManual: false,
								});
							}
						}

						// Create items that didn't exist before
						const newItems = enabledItems.filter((d) => {
							const matchKey = buildMatchKey(d);
							return !savedItems.some(
								(s) =>
									buildSavedMatchKey(s) === matchKey,
							);
						});

						if (newItems.length > 0) {
							const items = newItems.map((d) => ({
								category: mapCategoryKey(
									d.categoryKey,
								),
								subCategory: d.subCategory,
								name: getCategoryName(d.categoryKey),
								floorId: d.floorId,
								floorName: d.floorName,
								area:
									d.unit === "m2"
										? d.quantity
										: undefined,
								length:
									d.unit === "m"
										? d.quantity
										: undefined,
								quantity:
									d.unit !== "m2" && d.unit !== "m"
										? d.quantity
										: undefined,
								unit: d.unit,
								wastagePercent: d.wastagePercent,
								materialPrice: 0,
								laborPrice: 0,
								materialCost: 0,
								laborCost: 0,
								totalCost: 0,
								dataSource: d.dataSource,
								sourceFormula:
									d.calculationBreakdown?.formula,
								isEnabled: d.isEnabled,
								sortOrder: 0,
								groupKey: d.groupKey,
								scope: d.scope,
							}));
							(batchCreateMutation as any).mutate({
								organizationId,
								costStudyId: studyId,
								items,
							});
						}

						const autoUpdated = cascadeResults.filter(
							(c) => !c.isManual,
						).length;
						toast.success(
							autoUpdated > 0
								? `تم تحديث ${autoUpdated} بنود`
								: tw("willGenerate", {
										count: enabledItems.length,
									}),
						);

						onComplete(
							cascadeResults.length > 0
								? {
										changes: cascadeResults,
										skippedManualCount: skippedManual,
									}
								: undefined,
						);
						return;
					}

					// First-time mode: create all items
					if (enabledItems.length === 0) {
						onComplete();
						return;
					}

					// Convert to finishing items and batch create
					const items = enabledItems.map((d) => ({
						category: mapCategoryKey(d.categoryKey),
						subCategory: d.subCategory,
						name: getCategoryName(d.categoryKey),
						floorId: d.floorId,
						floorName: d.floorName,
						area:
							d.unit === "m2" ? d.quantity : undefined,
						length:
							d.unit === "m" ? d.quantity : undefined,
						quantity:
							d.unit !== "m2" && d.unit !== "m"
								? d.quantity
								: undefined,
						unit: d.unit,
						wastagePercent: d.wastagePercent,
						materialPrice: 0,
						laborPrice: 0,
						materialCost: 0,
						laborCost: 0,
						totalCost: 0,
						dataSource: d.dataSource,
						sourceFormula:
							d.calculationBreakdown?.formula,
						isEnabled: d.isEnabled,
						sortOrder: 0,
						groupKey: d.groupKey,
						scope: d.scope,
					}));

					(batchCreateMutation as any).mutate(
						{
							organizationId,
							costStudyId: studyId,
							items,
						},
						{
							onSuccess: () => {
								toast.success(
									tw("willGenerate", {
										count: items.length,
									}),
								);
								onComplete();
							},
							onError: () => {
								toast.error("فشل إنشاء البنود");
								onComplete();
							},
						},
					);
				},
			},
		);
	}, [
		config,
		organizationId,
		studyId,
		savedItems,
		saveMutation,
		batchCreateMutation,
		updateMutation,
		onComplete,
		tw,
	]);

	const isGenerating =
		saveMutation.isPending || batchCreateMutation.isPending;

	const stepTitles = [
		tw("step1Title"),
		tw("step2Title"),
		tw("step3Title"),
		tw("step4Title"),
	];

	return (
		<div className="max-w-3xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-bold">{tw("title")}</h1>
				<Button
					variant="ghost"
					size="sm"
					onClick={onSkip}
					className="text-muted-foreground text-sm"
				>
					<SkipForward className="h-4 w-4 me-1.5" />
					{tw("skip")}
				</Button>
			</div>

			{/* Stepper — numbered circles with connecting lines */}
			<div className="flex items-center gap-0">
				{STEPS.map((s, idx) => {
					const isActive = idx === step;
					const isDone = idx < step;
					return (
						<div key={s.key} className="flex items-center flex-1 last:flex-initial">
							<button
								type="button"
								className="flex flex-col items-center gap-1.5"
								onClick={() => goToStep(idx)}
								disabled={idx > step}
							>
								<span
									className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
										isDone
											? "bg-primary text-primary-foreground shadow-sm"
											: isActive
												? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-sm"
												: "bg-muted text-muted-foreground"
									}`}
								>
									{isDone ? (
										<Check className="h-4 w-4" />
									) : (
										idx + 1
									)}
								</span>
								<span className={`hidden sm:block text-xs font-medium text-center ${
									isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
								}`}>
									{stepTitles[idx]}
								</span>
							</button>
							{idx < STEPS.length - 1 && (
								<div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-200 ${
									idx < step ? "bg-primary" : "bg-muted"
								}`} />
							)}
						</div>
					);
				})}
			</div>

			{/* Step Content */}
			<Card className="rounded-xl shadow-sm">
				<CardContent className="p-6">
					<h2 className="text-lg font-semibold mb-5">
						{stepTitles[step]}
					</h2>

					{step === 0 && (
						<BuildingStructureStep
							config={config}
							onChange={setConfig}
						/>
					)}
					{step === 1 && (
						<FloorDetailsStep
							config={config}
							onChange={setConfig}
						/>
					)}
					{step === 2 && (
						<ExteriorStep
							config={config}
							onChange={setConfig}
						/>
					)}
					{step === 3 && <ReviewStep config={config} />}
				</CardContent>
			</Card>

			{/* Navigation */}
			<div className="flex items-center justify-between">
				<div>
					{step > 0 && (
						<Button variant="outline" className="rounded-lg" onClick={goPrev}>
							<ArrowRight className="h-4 w-4 me-1.5" />
							{tw("previous")}
						</Button>
					)}
				</div>
				<div className="flex gap-2">
					{step === 1 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={goNext}
							className="text-muted-foreground text-sm"
						>
							{tw("skipDetails")}
						</Button>
					)}
					{step === 2 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={goNext}
							className="text-muted-foreground text-sm"
						>
							{tw("skipDetails")}
						</Button>
					)}
					{step < 3 ? (
						<Button className="rounded-lg" onClick={goNext}>
							{tw("next")}
							<ArrowLeft className="h-4 w-4 ms-1.5" />
						</Button>
					) : (
						<Button
							className="rounded-lg"
							onClick={handleGenerate}
							disabled={isGenerating}
						>
							{isGenerating ? (
								<Loader2 className="h-4 w-4 me-1.5 animate-spin" />
							) : (
								<Sparkles className="h-4 w-4 me-1.5" />
							)}
							{tw("generate")}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

// ── Helpers ──

function mapCategoryKey(key: string): string {
	const base = key.replace(/_[a-z0-9-]+$/, "");
	const MAP: Record<string, string> = {
		waterproofing_foundations: "FINISHING_WATERPROOFING",
		waterproofing_bathrooms: "FINISHING_WATERPROOFING",
		waterproofing_roof: "FINISHING_WATERPROOFING",
		thermal_walls: "FINISHING_THERMAL_INSULATION",
		thermal_roof: "FINISHING_THERMAL_INSULATION",
		internal_plaster: "FINISHING_INTERNAL_PLASTER",
		external_plaster: "FINISHING_EXTERNAL_PLASTER",
		interior_paint: "FINISHING_INTERIOR_PAINT",
		facade_paint: "FINISHING_FACADE_PAINT",
		boundary_paint: "FINISHING_BOUNDARY_PAINT",
		flooring: "FINISHING_FLOOR_TILES",
		wall_tiles_bathroom: "FINISHING_WALL_TILES",
		wall_tiles_kitchen: "FINISHING_WALL_TILES",
		false_ceiling: "FINISHING_FALSE_CEILING",
		interior_doors: "FINISHING_INTERIOR_DOORS",
		exterior_doors: "FINISHING_EXTERIOR_DOORS",
		windows: "FINISHING_WINDOWS",
		bathroom_fixtures: "FINISHING_BATHROOMS",
		vanities: "FINISHING_MARBLE_VANITIES",
		kitchen_cabinets: "FINISHING_KITCHEN",
		internal_stairs: "FINISHING_INTERNAL_STAIRS",
		external_stairs: "FINISHING_EXTERNAL_STAIRS",
		railings: "FINISHING_RAILINGS",
		stone_facade: "FINISHING_STONE_FACADE",
		facade_decor: "FINISHING_FACADE_DECOR",
		yard_paving: "FINISHING_YARD_PAVING",
		fence_gates: "FINISHING_FENCE_GATES",
		landscaping: "FINISHING_LANDSCAPING",
		roof_finishing: "FINISHING_ROOF",
		interior_decor: "FINISHING_INTERIOR_DECOR",
	};
	return MAP[base] ?? MAP[key] ?? key;
}

function getCategoryName(key: string): string {
	const NAMES: Record<string, string> = {
		waterproofing_foundations: "عزل مائي — أساسات",
		waterproofing_roof: "عزل مائي — سطح",
		thermal_walls: "عزل حراري — جدران",
		thermal_roof: "عزل حراري — سطح",
		external_plaster: "لياسة خارجية",
		facade_paint: "دهان واجهات",
		boundary_paint: "دهان سور",
		interior_doors: "أبواب داخلية",
		exterior_doors: "أبواب خارجية",
		windows: "نوافذ ألمنيوم",
		bathroom_fixtures: "تجهيز حمامات",
		vanities: "مغاسل ورخاميات",
		kitchen_cabinets: "خزائن مطبخ",
		internal_stairs: "تكسية درج داخلي",
		external_stairs: "تكسية درج خارجي",
		railings: "درابزين وحواجز",
		stone_facade: "تكسيات واجهات",
		facade_decor: "زخارف واجهات",
		yard_paving: "أرضيات حوش",
		fence_gates: "بوابات سور",
		landscaping: "تنسيق حدائق",
		roof_finishing: "تشطيبات سطح",
		interior_decor: "ديكورات داخلية",
	};

	// Handle floor-specific keys
	if (key.startsWith("waterproofing_bathrooms_"))
		return "عزل مائي — حمامات";
	if (key.startsWith("internal_plaster_")) return "لياسة داخلية";
	if (key.startsWith("interior_paint_")) return "دهان داخلي";
	if (key.startsWith("flooring_")) return "أرضيات";
	if (key.startsWith("wall_tiles_bathroom_"))
		return "تكسيات جدران حمامات";
	if (key.startsWith("wall_tiles_kitchen_"))
		return "سبلاش باك مطبخ";
	if (key.startsWith("false_ceiling_")) return "أسقف مستعارة";

	return NAMES[key] ?? key;
}

function buildMatchKey(d: {
	categoryKey: string;
	floorId?: string;
	scope: string;
}): string {
	return `${mapCategoryKey(d.categoryKey)}__${d.floorId ?? ""}__${d.scope}`;
}

function buildSavedMatchKey(s: {
	category: string;
	floorId?: string | null;
	scope?: string | null;
}): string {
	return `${s.category}__${s.floorId ?? ""}__${s.scope ?? ""}`;
}
