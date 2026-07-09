"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { createDefaultConfig } from "../../types/structural-building-config";

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

	// Wizard display logic:
	// - Auto-show ONLY on first creation (no saved building config AND no items yet).
	// - After the user saves or skips, a config is persisted so it never
	//   auto-reappears — it can only be reopened via the edit button below.
	const shouldShowWizard =
		showWizard === true ||
		(showWizard === null &&
			!buildingConfig &&
			structuralItems.length === 0);

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
					onSkip={async () => {
						// Persist a dismissal marker (incomplete config) so the
						// wizard does not reappear on every subsequent open.
						if (!buildingConfig) {
							await saveBuildingConfig(createDefaultConfig());
						}
						setShowWizard(false);
					}}
					isSaving={isSaving}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Summary Stats */}
			<SummaryStatsCards structural={structuralStats} />

			{/* Building Config Bar (complete) or a persistent setup prompt
			    (skipped/incomplete) so the building can always be edited later */}
			{isConfigComplete && enabledFloors.length > 0 ? (
				<StructuralBuildingConfigBar
					floors={enabledFloors}
					onEdit={() => setShowWizard(true)}
					buildingConfig={buildingConfig}
				/>
			) : (
				<button
					type="button"
					onClick={() => setShowWizard(true)}
					className="flex w-full items-center gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-2.5 text-start transition-colors hover:bg-muted/40"
				>
					<Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
					<span className="flex-1 text-sm text-muted-foreground">
						لم يتم إعداد بيانات المبنى الإنشائي
					</span>
					<span className="text-sm font-medium text-primary">
						إعداد المبنى
					</span>
				</button>
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
