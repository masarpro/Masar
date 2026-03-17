"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { SummaryStatsCards } from "./SummaryStatsCards";
import { StructuralAccordion } from "./StructuralAccordion";
import dynamic from "next/dynamic";
const BOQSummaryTable = dynamic(
	() =>
		import("./BOQSummaryTable").then((m) => ({
			default: m.BOQSummaryTable,
		})),
	{
		ssr: false,
		loading: () => (
			<div className="space-y-3 p-4 border rounded-lg animate-pulse">
				<div className="h-8 bg-muted rounded w-1/3" />
				<div className="h-64 bg-muted rounded" />
			</div>
		),
	},
);
import { StructuralBuildingWizard } from "./StructuralBuildingWizard";
import { StructuralBuildingConfigBar } from "./StructuralBuildingConfigBar";
import { StudyEditorSkeleton } from "@saas/shared/components/skeletons";
import { useStructuralBuildingConfig } from "../../hooks/useStructuralBuildingConfig";

interface StructuralItemsEditorProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

export function StructuralItemsEditor({
	organizationId,
	organizationSlug,
	studyId,
}: StructuralItemsEditorProps) {
	const t = useTranslations();
	const [showWizard, setShowWizard] = useState<boolean | null>(null);

	const { data: study, isLoading: studyLoading } = useQuery<any>(
		orpc.pricing.studies.getById.queryOptions({
			input: {
				id: studyId,
				organizationId,
			},
		}),
	);

	const { data: structuralItems = [], refetch } = useQuery<any>(
		orpc.pricing.studies.getStructuralItems.queryOptions({
			input: {
				costStudyId: studyId,
				organizationId,
			},
		}),
	);

	const {
		buildingConfig,
		isConfigComplete,
		enabledFloors,
		saveBuildingConfig,
		isSaving,
	} = useStructuralBuildingConfig({ organizationId, studyId });

	if (studyLoading) {
		return <StudyEditorSkeleton />;
	}

	if (!study) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">{t("pricing.studies.notFound")}</p>
			</div>
		);
	}

	// Calculate summary stats
	const structuralStats = {
		concrete: structuralItems.reduce(
			(sum: any, item: any) => sum + (item.concreteVolume || 0),
			0
		),
		rebar: structuralItems.reduce(
			(sum: any, item: any) => sum + (item.steelWeight || 0),
			0
		),
		blocks: structuralItems
			.filter((item: any) => item.category === "blocks")
			.reduce((sum: any, item: any) => sum + (item.quantity || 0), 0),
		formwork: structuralItems
			.filter((item: any) => item.category !== "blocks" && item.category !== "plainConcrete")
			.reduce((sum: any, item: any) => {
				const dims = (item.dimensions as Record<string, number>) || {};
				return sum + (dims.formworkArea || 0);
			}, 0),
	};

	// Wizard display logic (same pattern as FinishingItemsEditor)
	const shouldShowWizard =
		showWizard === true ||
		(showWizard === null && !isConfigComplete && !buildingConfig?.floors?.length);

	if (shouldShowWizard) {
		return (
			<div className="space-y-6">
				<SummaryStatsCards structural={structuralStats} />
				<StructuralBuildingWizard
					initialConfig={buildingConfig}
					onSave={async (config) => {
						await saveBuildingConfig(config);
						setShowWizard(false);
					}}
					onSkip={() => setShowWizard(false)}
					isSaving={isSaving}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Summary Stats */}
			<SummaryStatsCards structural={structuralStats} />

			{/* Building Config Bar */}
			{isConfigComplete && enabledFloors.length > 0 && (
				<StructuralBuildingConfigBar
					floors={enabledFloors}
					onEdit={() => setShowWizard(true)}
					buildingConfig={buildingConfig}
				/>
			)}

			{/* Structural Items Accordion */}
			<div className="space-y-4">
				<StructuralAccordion
					studyId={studyId}
					organizationId={organizationId}
					items={structuralItems.map((item: any) => ({
						id: item.id,
						category: item.category,
						name: item.name,
						quantity: item.quantity,
						dimensions: (item.dimensions as Record<string, number>) || {},
						concreteVolume: item.concreteVolume || 0,
						steelWeight: item.steelWeight || 0,
						totalCost: item.totalCost || 0,
						subCategory: item.subCategory,
					}))}
					onUpdate={refetch}
					buildingFloors={isConfigComplete ? enabledFloors : undefined}
					buildingConfig={isConfigComplete ? buildingConfig : undefined}
				/>
			</div>

			{/* BOQ Summary Table */}
			{structuralItems.length > 0 && (
				<BOQSummaryTable
					items={structuralItems.map((item: any) => ({
						id: item.id,
						category: item.category,
						subCategory: item.subCategory,
						name: item.name,
						quantity: item.quantity,
						dimensions: (item.dimensions as Record<string, number>) || {},
						concreteVolume: item.concreteVolume || 0,
						steelWeight: item.steelWeight || 0,
						totalCost: item.totalCost || 0,
					}))}
					studyId={studyId}
					organizationId={organizationId}
					studyName={(study as any)?.name}
					enabledFloors={isConfigComplete ? enabledFloors.map((f) => ({
						id: f.id,
						label: f.label,
						icon: f.icon,
						sortOrder: f.sortOrder,
					})) : undefined}
				/>
			)}
		</div>
	);
}
