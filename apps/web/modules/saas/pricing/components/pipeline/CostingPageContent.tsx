"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { StudyEditorSkeleton } from "@saas/shared/components/skeletons";
import { CostingTable } from "./CostingTable";
import { CostingSummary } from "./CostingSummary";
import { StageApprovalButton } from "./StageApprovalButton";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface CostingPageContentProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function CostingPageContent({
	organizationId,
	organizationSlug,
	studyId,
}: CostingPageContentProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

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

	// ─── Fetch costing items ───
	const { data: costingItems = [], isLoading: itemsLoading } = useQuery(
		orpc.pricing.studies.costing.getItems.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	// ─── Generate mutation ───
	const generateMutation = useMutation(
		orpc.pricing.studies.costing.generate.mutationOptions({
			onSuccess: (data: any) => {
				if (data.generated > 0) {
					toast.success(`تم توليد ${data.generated} بند للتسعير`);
				} else {
					toast.info(data.message || "البنود موجودة مسبقاً");
				}
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "costing"]],
				});
			},
			onError: (e: any) => toast.error(e.message || "حدث خطأ"),
		}),
	);

	const handleGenerate = () => {
		(generateMutation as any).mutate({ organizationId, studyId });
	};

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

	const stages = (stagesData as any)?.stages ?? {
		quantities: "DRAFT" as const,
		specs: "NOT_STARTED" as const,
		costing: "NOT_STARTED" as const,
		pricing: "NOT_STARTED" as const,
		quotation: "NOT_STARTED" as const,
	};

	const canApprove = (stagesData as any)?.canApprove ?? {
		quantities: true,
		specs: true,
		costing: true,
		pricing: true,
		quotation: true,
	};

	const hasItems = (costingItems as unknown[]).length > 0;

	return (
		<div className="space-y-4" dir="rtl">
			{/* Title */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-bold">
						{(study as any).name || t("pricing.pipeline.costing")}
					</h1>
					<p className="text-sm text-muted-foreground">
						{t("pricing.pipeline.costing")} — {t("pricing.pipeline.costingDesc")}
					</p>
				</div>

				<div className="flex items-center gap-2">
					{!hasItems && (
						<Button
							onClick={handleGenerate}
							disabled={generateMutation.isPending}
							className="gap-1.5"
						>
							{generateMutation.isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Sparkles className="h-4 w-4" />
							)}
							{t("pricing.pipeline.costingGenerate")}
						</Button>
					)}
					{hasItems && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleGenerate}
							disabled={generateMutation.isPending}
							className="gap-1.5"
						>
							<RefreshCw className={`h-3.5 w-3.5 ${generateMutation.isPending ? "animate-spin" : ""}`} />
							{t("pricing.pipeline.costingRegenerate")}
						</Button>
					)}
				</div>
			</div>

			{/* Items Table */}
			{itemsLoading ? (
				<StudyEditorSkeleton />
			) : hasItems ? (
				<CostingTable
					organizationId={organizationId}
					items={costingItems as any[]}
				/>
			) : (
				<div className="rounded-xl border p-12 text-center text-muted-foreground">
					<Sparkles className="h-10 w-10 mx-auto mb-4 opacity-30" />
					<p className="font-medium text-lg mb-2">
						{t("pricing.pipeline.costingEmpty")}
					</p>
					<p className="text-sm mb-4">
						{t("pricing.pipeline.costingEmptyDesc")}
					</p>
					<Button
						onClick={handleGenerate}
						disabled={generateMutation.isPending}
						className="gap-1.5"
					>
						{generateMutation.isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Sparkles className="h-4 w-4" />
						)}
						{t("pricing.pipeline.costingGenerate")}
					</Button>
				</div>
			)}

			{/* Summary */}
			{hasItems && (
				<CostingSummary
					organizationId={organizationId}
					studyId={studyId}
				/>
			)}

			{/* Approval Button */}
			<div className="flex justify-end pt-4 border-t">
				<StageApprovalButton
					organizationId={organizationId}
					organizationSlug={organizationSlug}
					studyId={studyId}
					stage="costing"
					status={stages.costing}
					canReopen
					canApprove={canApprove.costing}
				/>
			</div>
		</div>
	);
}
