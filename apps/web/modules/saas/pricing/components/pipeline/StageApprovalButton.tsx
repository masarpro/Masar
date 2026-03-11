"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type StageStatus = "NOT_STARTED" | "DRAFT" | "IN_REVIEW" | "APPROVED";
type StageName = "quantities" | "specs" | "costing" | "pricing" | "quotation";

interface StageApprovalButtonProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
	stage: StageName;
	status: StageStatus;
	canReopen?: boolean;
	canApprove?: boolean;
	className?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const STAGE_ORDER: StageName[] = ["quantities", "specs", "costing", "pricing", "quotation"];

const STAGE_PATHS: Record<StageName, string> = {
	quantities: "quantities",
	specs: "specifications",
	costing: "costing",
	pricing: "selling-price",
	quotation: "quotation",
};

const STAGE_LABEL_KEYS: Record<StageName, string> = {
	quantities: "pricing.pipeline.quantities",
	specs: "pricing.pipeline.specifications",
	costing: "pricing.pipeline.costing",
	pricing: "pricing.pipeline.sellingPrice",
	quotation: "pricing.pipeline.quotation",
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function StageApprovalButton({
	organizationId,
	organizationSlug,
	studyId,
	stage,
	status,
	canReopen = false,
	canApprove = true,
	className,
}: StageApprovalButtonProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const stageIndex = STAGE_ORDER.indexOf(stage);
	const nextStage = stageIndex < STAGE_ORDER.length - 1 ? STAGE_ORDER[stageIndex + 1] : null;

	const invalidateStages = () => {
		queryClient.invalidateQueries({
			queryKey: [["pricing", "studies", "stages"]],
		});
		queryClient.invalidateQueries({
			queryKey: [["pricing", "studies", "studyStages"]],
		});
		queryClient.invalidateQueries({
			queryKey: [["pricing", "studies"]],
		});
	};

	const approveMutation = useMutation(
		orpc.pricing.studies.stages.approve.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.pipeline.approved"));
				invalidateStages();
				// Navigate to next stage
				if (nextStage) {
					const nextPath = STAGE_PATHS[nextStage];
					router.push(
						`/app/${organizationSlug}/pricing/studies/${studyId}/${nextPath}`,
					);
				}
			},
			onError: (error) => {
				toast.error(error.message || "حدث خطأ");
			},
		}),
	);

	const reopenMutation = useMutation(
		orpc.pricing.studies.stages.reopen.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.pipeline.reopen"));
				invalidateStages();
			},
			onError: (error) => {
				toast.error(error.message || "حدث خطأ");
			},
		}),
	);

	const handleApprove = () => {
		approveMutation.mutate({
			organizationId,
			studyId,
			stage,
		});
	};

	const handleReopen = () => {
		reopenMutation.mutate({
			organizationId,
			studyId,
			stage,
		});
	};

	const isLoading = approveMutation.isPending || reopenMutation.isPending;
	const stageLabel = t(STAGE_LABEL_KEYS[stage]);
	const nextStageLabel = nextStage ? t(STAGE_LABEL_KEYS[nextStage]) : "";

	if (status === "APPROVED") {
		return (
			<div className={cn("flex items-center gap-3", className)} dir="rtl">
				<Button variant="outline" disabled className="gap-2">
					<CheckCircle2 className="h-4 w-4 text-emerald-600" />
					{t("pricing.pipeline.approved")}
				</Button>
				{canReopen && (
					<Button
						variant="ghost"
						size="sm"
						onClick={handleReopen}
						disabled={isLoading}
						className="gap-1.5 text-muted-foreground hover:text-foreground"
					>
						{isLoading ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<RotateCcw className="h-3.5 w-3.5" />
						)}
						{t("pricing.pipeline.reopen")}
					</Button>
				)}
			</div>
		);
	}

	if (status === "NOT_STARTED") {
		return null;
	}

	// DRAFT or IN_REVIEW — check if user can approve
	if (!canApprove) {
		return null;
	}

	return (
		<div className={cn("flex items-center", className)} dir="rtl">
			<Button
				onClick={handleApprove}
				disabled={isLoading}
				className="gap-2"
			>
				{isLoading ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<CheckCircle2 className="h-4 w-4" />
				)}
				{nextStage
					? t("pricing.pipeline.approve", {
							stage: stageLabel,
							next: nextStageLabel,
						})
					: t("pricing.pipeline.approved")}
			</Button>
		</div>
	);
}
