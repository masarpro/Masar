"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@ui/components/card";
import { StatusChip, type StatusTone } from "@ui/components/status-chip";
import { cn } from "@ui/lib";
import {
	Building2,
	Calculator,
	ChevronLeft,
	ClipboardList,
	Lock,
	Tag,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { StageApprovalButton } from "../pipeline/StageApprovalButton";

/**
 * لوحة مختصرة أسفل صفحة الكميات للدراسات الموحّدة التي تشمل نطاق
 * STRUCTURAL أو CUSTOM: التشطيبات وMEP تُسعَّر داخل مساحة العمل
 * الموحدة، أما البنود الإنشائية/اليدوية فما زالت تمر بمسار
 * المواصفات ← تسعير التكلفة ← التسعير. هذه اللوحة تُبقي المسار
 * متاحاً بدون إعادة شريط المراحل الكامل.
 */

const PIPELINE_STEPS = [
	{
		stage: "SPECIFICATIONS",
		route: "specifications",
		labelKey: "pricing.pipeline.specifications",
		icon: ClipboardList,
	},
	{
		stage: "COSTING",
		route: "costing",
		labelKey: "pricing.pipeline.costing",
		icon: Calculator,
	},
	{
		stage: "PRICING",
		route: "pricing",
		labelKey: "pricing.pipeline.sellingPrice",
		icon: Tag,
	},
] as const;

type StageStatus = "NOT_STARTED" | "DRAFT" | "IN_REVIEW" | "APPROVED";

const STATUS_LABEL_KEY: Record<StageStatus, string> = {
	NOT_STARTED: "pricing.pipeline.notStarted",
	DRAFT: "pricing.pipeline.draft",
	IN_REVIEW: "pricing.pipeline.inReview",
	APPROVED: "pricing.pipeline.approved",
};

const STATUS_TONE: Record<StageStatus, StatusTone> = {
	NOT_STARTED: "neutral",
	DRAFT: "info",
	IN_REVIEW: "warning",
	APPROVED: "success",
};

interface StructuralPipelinePanelProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

export function StructuralPipelinePanel({
	organizationId,
	organizationSlug,
	studyId,
}: StructuralPipelinePanelProps) {
	const t = useTranslations();

	const { data: stagesData } = useQuery(
		orpc.pricing.studies.studyStages.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const stageRecords: Array<{
		stage: string;
		status: string;
		canApprove?: boolean;
	}> = (stagesData as any)?.stages ?? [];

	const statusOf = (stage: string): StageStatus =>
		(stageRecords.find((s) => s.stage === stage)?.status ??
			"NOT_STARTED") as StageStatus;

	const quantitiesStatus = statusOf("QUANTITIES");
	const canApproveQuantities =
		stageRecords.find((s) => s.stage === "QUANTITIES")?.canApprove ?? true;

	const basePath = `/app/${organizationSlug}/pricing/studies/${studyId}`;

	return (
		<Card className="border-primary/15">
			<CardContent className="p-4">
				<div
					className="flex flex-wrap items-center justify-between gap-4"
					dir="rtl"
				>
					<div className="flex min-w-0 items-center gap-3">
						<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<Building2 className="h-4.5 w-4.5" />
						</span>
						<div className="min-w-0">
							<p className="font-semibold text-sm">
								{t("pricing.pipeline.structuralPanel.title")}
							</p>
							<p className="truncate text-muted-foreground text-xs">
								{t("pricing.pipeline.structuralPanel.subtitle")}
							</p>
						</div>
					</div>

					<StageApprovalButton
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						studyId={studyId}
						stage="quantities"
						status={quantitiesStatus}
						canReopen
						canApprove={canApproveQuantities}
					/>
				</div>

				<div
					className="mt-4 flex flex-wrap items-stretch gap-2"
					dir="rtl"
				>
					{PIPELINE_STEPS.map((step, index) => {
						const status = statusOf(step.stage);
						const locked = status === "NOT_STARTED";
						const Icon = step.icon;

						const body = (
							<div
								className={cn(
									"flex h-full items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors",
									locked
										? "border-dashed opacity-60"
										: "hover:border-primary/40 hover:bg-primary/5",
								)}
							>
								{locked ? (
									<Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
								) : (
									<Icon className="h-4 w-4 shrink-0 text-primary" />
								)}
								<span className="font-medium text-sm">
									{t(step.labelKey)}
								</span>
								<StatusChip tone={STATUS_TONE[status]}>
									{t(STATUS_LABEL_KEY[status])}
								</StatusChip>
							</div>
						);

						return (
							<div key={step.stage} className="flex items-center gap-2">
								{locked ? (
									<div
										title={t("pricing.pipeline.structuralPanel.locked")}
										className="cursor-not-allowed"
									>
										{body}
									</div>
								) : (
									<Link href={`${basePath}/${step.route}`}>{body}</Link>
								)}
								{index < PIPELINE_STEPS.length - 1 && (
									<ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/50" />
								)}
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
