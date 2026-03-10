"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Building2, PaintBucket, Wrench, FileEdit } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { StudyEditorSkeleton } from "@saas/shared/components/skeletons";
import { StructuralItemsEditor } from "../studies/StructuralItemsEditor";
import { FinishingItemsEditor } from "../studies/FinishingItemsEditor";
import { MEPItemsEditor } from "../studies/MEPItemsEditor";
import { PipelineBar } from "./PipelineBar";
import { ManualItemsTable } from "./ManualItemsTable";
import { QuantitiesSummary } from "./QuantitiesSummary";
import { StageApprovalButton } from "./StageApprovalButton";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface QuantitiesPageContentProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
	initialTab?: string;
}

const TAB_MAP: Record<string, string> = {
	structural: "structural",
	finishing: "finishing",
	mep: "mep",
	manual: "manual",
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function QuantitiesPageContent({
	organizationId,
	organizationSlug,
	studyId,
	initialTab,
}: QuantitiesPageContentProps) {
	const t = useTranslations();
	const router = useRouter();
	const searchParams = useSearchParams();

	const currentTab = searchParams.get("tab") || initialTab || "structural";

	// ─── Fetch stages ───
	const { data: stagesData, isLoading: stagesLoading } = useQuery(
		orpc.pricing.studies.stages.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	// ─── Fetch study for basic info ───
	const { data: study, isLoading: studyLoading } = useQuery(
		orpc.pricing.studies.getById.queryOptions({
			input: { id: studyId, organizationId },
		}),
	);

	const handleTabChange = useCallback(
		(tab: string) => {
			const url = new URL(window.location.href);
			url.searchParams.set("tab", tab);
			router.replace(url.pathname + url.search, { scroll: false });
		},
		[router],
	);

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

	const studyType = stagesData?.studyType ?? "FULL_PROJECT";

	return (
		<div className="space-y-4" dir="rtl">
			{/* Pipeline Bar */}
			<PipelineBar
				studyId={studyId}
				organizationSlug={organizationSlug}
				currentStage="quantities"
				stages={stages}
				studyType={studyType}
			/>

			{/* Study Name */}
			<div>
				<h1 className="text-xl font-bold">{study.name || t("pricing.pipeline.quantities")}</h1>
				<p className="text-sm text-muted-foreground">
					{t("pricing.pipeline.quantities")} — {t("pricing.pipeline.quantitiesDesc")}
				</p>
			</div>

			{/* Tabs */}
			<Tabs
				value={currentTab}
				onValueChange={handleTabChange}
				dir="rtl"
			>
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
					<TabsTrigger value="manual" className="gap-1.5">
						<FileEdit className="h-3.5 w-3.5" />
						{t("pricing.pipeline.tabManual")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="structural" className="mt-4">
					<StructuralItemsEditor
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						studyId={studyId}
					/>
				</TabsContent>

				<TabsContent value="finishing" className="mt-4">
					<FinishingItemsEditor
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						studyId={studyId}
					/>
				</TabsContent>

				<TabsContent value="mep" className="mt-4">
					<MEPItemsEditor
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						studyId={studyId}
					/>
				</TabsContent>

				<TabsContent value="manual" className="mt-4">
					<ManualItemsTable
						organizationId={organizationId}
						studyId={studyId}
					/>
				</TabsContent>
			</Tabs>

			{/* Summary */}
			<QuantitiesSummary
				organizationId={organizationId}
				studyId={studyId}
			/>

			{/* Approval Button */}
			<div className="flex justify-end pt-4 border-t">
				<StageApprovalButton
					organizationId={organizationId}
					organizationSlug={organizationSlug}
					studyId={studyId}
					stage="quantities"
					status={stages.quantities}
					canReopen
				/>
			</div>
		</div>
	);
}
