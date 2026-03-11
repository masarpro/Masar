"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { StudyEditorSkeleton } from "@saas/shared/components/skeletons";
import { MarkupMethodSelector } from "./MarkupMethodSelector";
import { UniformMarkupForm } from "./UniformMarkupForm";
import { SectionMarkupForm } from "./SectionMarkupForm";
import { ProfitAnalysis } from "./ProfitAnalysis";
import { LumpSumAnalysis } from "./LumpSumAnalysis";
import { StageApprovalButton } from "./StageApprovalButton";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface SellingPricePageContentProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function SellingPricePageContent({
	organizationId,
	organizationSlug,
	studyId,
}: SellingPricePageContentProps) {
	const t = useTranslations();

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

	// ─── Fetch markup settings ───
	const { data: markupSettings, isLoading: markupLoading } = useQuery(
		orpc.pricing.studies.markup.getSettings.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	// ─── Fetch profit analysis ───
	const { data: profitAnalysis, isLoading: profitLoading } = useQuery(
		orpc.pricing.studies.markup.getProfitAnalysis.queryOptions({
			input: { organizationId, studyId },
		}),
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

	const studyType = stagesData?.studyType ?? "FULL_PROJECT";
	const method = markupSettings?.method ?? "uniform";
	const isLumpSum = studyType === "LUMP_SUM_ANALYSIS";

	return (
		<div className="space-y-4" dir="rtl">
			{/* Title */}
			<div>
				<h1 className="text-xl font-bold">
					{study.name || t("pricing.pipeline.sellingPrice")}
				</h1>
				<p className="text-sm text-muted-foreground">
					{t("pricing.pipeline.sellingPrice")} — {t("pricing.pipeline.sellingPriceDesc")}
				</p>
			</div>

			{/* Lump Sum Analysis (replaces markup forms for LUMP_SUM_ANALYSIS) */}
			{isLumpSum ? (
				<LumpSumAnalysis
					profitAnalysis={profitAnalysis}
					isLoading={profitLoading}
				/>
			) : (
				<>
					{/* Markup Method Selector */}
					<MarkupMethodSelector
						organizationId={organizationId}
						studyId={studyId}
						currentMethod={method}
					/>

					{/* Markup Forms */}
					{method === "uniform" ? (
						<UniformMarkupForm
							organizationId={organizationId}
							studyId={studyId}
							settings={markupSettings?.uniformSettings}
							isLoading={markupLoading}
						/>
					) : (
						<SectionMarkupForm
							organizationId={organizationId}
							studyId={studyId}
							sectionMarkups={markupSettings?.sectionMarkups ?? []}
							profitAnalysis={profitAnalysis}
							isLoading={markupLoading || profitLoading}
						/>
					)}
				</>
			)}

			{/* Profit Analysis - always shown */}
			<ProfitAnalysis
				profitAnalysis={profitAnalysis}
				isLoading={profitLoading}
				isLumpSum={isLumpSum}
			/>

			{/* Approval Button */}
			<div className="flex justify-end pt-4 border-t">
				<StageApprovalButton
					organizationId={organizationId}
					organizationSlug={organizationSlug}
					studyId={studyId}
					stage="pricing"
					status={stages.pricing}
					canReopen
					canApprove={canApprove.pricing}
				/>
			</div>
		</div>
	);
}
