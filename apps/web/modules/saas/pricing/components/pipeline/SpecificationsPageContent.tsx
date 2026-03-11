"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Building2, PaintBucket, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { StudyEditorSkeleton } from "@saas/shared/components/skeletons";
import type { SmartBuildingConfig } from "../../lib/smart-building-types";
import type { SavedFinishingItem, MergedQuantityItem } from "../../lib/merge-quantities";
import { mergeQuantities } from "../../lib/merge-quantities";
import { deriveAllQuantities } from "../../lib/derivation-engine";
import { InlineSpecEditor } from "../specifications/InlineSpecEditor";
import { StructuralSpecs } from "./StructuralSpecs";
import { StageApprovalButton } from "./StageApprovalButton";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface SpecificationsPageContentProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function SpecificationsPageContent({
	organizationId,
	organizationSlug,
	studyId,
}: SpecificationsPageContentProps) {
	const t = useTranslations();
	const [activeTab, setActiveTab] = useState("structural");

	// ─── Fetch stages ───
	const { data: stagesData, isLoading: stagesLoading } = useQuery(
		orpc.pricing.studies.stages.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	// ─── Fetch study ───
	const { data: study, isLoading: studyLoading } = useQuery(
		orpc.pricing.studies.getById.queryOptions({
			input: { id: studyId, organizationId },
		}),
	);

	const { data: finishingItems = [] } = useQuery(
		orpc.pricing.studies.getFinishingItems.queryOptions({
			input: { costStudyId: studyId, organizationId },
		}),
	);

	// ─── Derive finishing items for spec editor ───
	const smartConfig = study?.buildingConfig as SmartBuildingConfig | null;

	const savedFinishingItems: SavedFinishingItem[] = useMemo(() => {
		if (!finishingItems.length) return [];
		return finishingItems.map((item) => ({
			id: item.id,
			category: item.category,
			subCategory: item.subCategory,
			name: item.name,
			floorId: item.floorId,
			floorName: item.floorName,
			area: item.area != null ? Number(item.area) : null,
			quantity: item.quantity != null ? Number(item.quantity) : null,
			length: item.length != null ? Number(item.length) : null,
			unit: item.unit,
			wastagePercent: item.wastagePercent != null ? Number(item.wastagePercent) : null,
			materialPrice: item.materialPrice != null ? Number(item.materialPrice) : null,
			laborPrice: item.laborPrice != null ? Number(item.laborPrice) : null,
			materialCost: null,
			laborCost: null,
			totalCost: Number(item.totalCost),
			dataSource: item.dataSource,
			sourceFormula: item.sourceFormula,
			isEnabled: item.isEnabled,
			groupKey: item.groupKey,
			scope: item.scope,
			sortOrder: item.sortOrder,
			calculationData: item.calculationData as Record<string, unknown> | null,
			specData: item.specData ?? undefined,
		}));
	}, [finishingItems]);

	const mergedItems: MergedQuantityItem[] = useMemo(() => {
		if (!smartConfig?.floors?.length) return [];
		try {
			const derived = deriveAllQuantities(smartConfig);
			return mergeQuantities(derived, savedFinishingItems);
		} catch {
			return [];
		}
	}, [smartConfig, savedFinishingItems]);

	// ─── Mutations ───
	const queryClient = useQueryClient();

	const updateSpecMutation = useMutation(
		orpc.pricing.studies.finishingItem.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies"]],
				});
			},
		}),
	);

	const handleSaveSpec = useCallback(
		(key: string, spec: import("../../lib/specs/spec-types").ItemSpecification) => {
			const item = mergedItems.find((i) => i.key === key);
			if (!item?.isSaved || !item.savedId) return;

			const specDescription = `${spec.specTypeLabel}${
				spec.options?.brand ? ` — ${spec.options.brand}` : ""
			}`;
			updateSpecMutation.mutate({
				organizationId,
				costStudyId: studyId,
				id: item.savedId,
				specData: spec,
				qualityLevel: (spec.options?.qualityLevel as string) ?? undefined,
				brand: (spec.options?.brand as string) ?? undefined,
				specifications: specDescription,
			});
		},
		[mergedItems, organizationId, studyId, updateSpecMutation],
	);

	// ─── Loading ───
	if (stagesLoading || studyLoading) {
		return <StudyEditorSkeleton />;
	}

	if (!study) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">{t("pricing.studies.notFound")}</p>
			</div>
		);
	}

	const stages = stagesData?.stages ?? {
		quantities: "DRAFT" as const,
		specs: "NOT_STARTED" as const,
		costing: "NOT_STARTED" as const,
		pricing: "NOT_STARTED" as const,
		quotation: "NOT_STARTED" as const,
	};

	const canApprove = stagesData?.canApprove ?? {
		quantities: true,
		specs: true,
		costing: true,
		pricing: true,
		quotation: true,
	};

	return (
		<div className="space-y-4" dir="rtl">
			{/* Title */}
			<div>
				<h1 className="text-xl font-bold">
					{study.name || t("pricing.pipeline.specifications")}
				</h1>
				<p className="text-sm text-muted-foreground">
					{t("pricing.pipeline.specifications")} — {t("pricing.pipeline.specsDesc")}
				</p>
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
				<TabsList className="w-full justify-start">
					<TabsTrigger value="structural" className="gap-1.5">
						<Building2 className="h-3.5 w-3.5" />
						{t("pricing.pipeline.tabStructural")}
					</TabsTrigger>
					<TabsTrigger value="finishing" className="gap-1.5">
						<PaintBucket className="h-3.5 w-3.5" />
						{t("pricing.pipeline.tabFinishing")}
					</TabsTrigger>
					<TabsTrigger value="mep" className="gap-1.5">
						<Wrench className="h-3.5 w-3.5" />
						{t("pricing.pipeline.tabMep")}
					</TabsTrigger>
				</TabsList>

				{/* Structural Specs */}
				<TabsContent value="structural" className="mt-4">
					<StructuralSpecs
						organizationId={organizationId}
						studyId={studyId}
					/>
				</TabsContent>

				{/* Finishing Specs - Inline Editor */}
				<TabsContent value="finishing" className="mt-4 space-y-4">
					<h3 className="text-lg font-semibold">
						{t("pricing.pipeline.specsFinishingTitle")}
					</h3>

					{mergedItems.length > 0 ? (
						<InlineSpecEditor
							items={mergedItems}
							onSaveSpec={handleSaveSpec}
							isSaving={updateSpecMutation.isPending}
						/>
					) : (
						<div className="rounded-xl border p-8 text-center text-muted-foreground">
							<p>{t("pricing.pipeline.specsNoFinishingItems")}</p>
						</div>
					)}
				</TabsContent>

				{/* MEP Specs - simplified */}
				<TabsContent value="mep" className="mt-4">
					<div className="rounded-xl border p-8 text-center text-muted-foreground">
						<Wrench className="h-8 w-8 mx-auto mb-3 opacity-40" />
						<p className="font-medium">{t("pricing.pipeline.specsMepTitle")}</p>
						<p className="text-sm mt-1">
							{t("pricing.pipeline.specsMepDesc")}
						</p>
					</div>
				</TabsContent>
			</Tabs>

			{/* Approval Button */}
			<div className="flex justify-end pt-4 border-t">
				<StageApprovalButton
					organizationId={organizationId}
					organizationSlug={organizationSlug}
					studyId={studyId}
					stage="specs"
					status={stages.specs}
					canReopen
					canApprove={canApprove.specs}
				/>
			</div>
		</div>
	);
}
