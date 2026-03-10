"use client";

import { Badge } from "@ui/components/badge";
import { cn } from "@ui/lib";
import {
	CheckCircle2,
	Circle,
	CircleDot,
	Clock,
	ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type StageStatus = "NOT_STARTED" | "DRAFT" | "IN_REVIEW" | "APPROVED";
type StudyType = "FULL_PROJECT" | "CUSTOM_ITEMS" | "LUMP_SUM_ANALYSIS";

type StageKey =
	| "quantities"
	| "specifications"
	| "costing"
	| "selling-price"
	| "quotation";

interface StageStatuses {
	quantities: StageStatus;
	specs: StageStatus;
	costing: StageStatus;
	pricing: StageStatus;
	quotation: StageStatus;
}

interface PipelineBarProps {
	studyId: string;
	organizationSlug: string;
	currentStage: StageKey;
	stages: StageStatuses;
	studyType?: StudyType;
}

// ═══════════════════════════════════════════════════════════════
// STAGE CONFIG
// ═══════════════════════════════════════════════════════════════

interface StageConfig {
	key: StageKey;
	statusKey: keyof StageStatuses;
	labelKey: string;
	path: string;
}

const STAGES: StageConfig[] = [
	{
		key: "quantities",
		statusKey: "quantities",
		labelKey: "pricing.pipeline.quantities",
		path: "quantities",
	},
	{
		key: "specifications",
		statusKey: "specs",
		labelKey: "pricing.pipeline.specifications",
		path: "specifications",
	},
	{
		key: "costing",
		statusKey: "costing",
		labelKey: "pricing.pipeline.costing",
		path: "costing",
	},
	{
		key: "selling-price",
		statusKey: "pricing",
		labelKey: "pricing.pipeline.sellingPrice",
		path: "selling-price",
	},
	{
		key: "quotation",
		statusKey: "quotation",
		labelKey: "pricing.pipeline.quotation",
		path: "quotation",
	},
];

// ═══════════════════════════════════════════════════════════════
// STATUS STYLES
// ═══════════════════════════════════════════════════════════════

function getStatusStyles(status: StageStatus) {
	switch (status) {
		case "APPROVED":
			return {
				bg: "bg-emerald-50 dark:bg-emerald-950/30",
				border: "border-emerald-200 dark:border-emerald-800",
				text: "text-emerald-700 dark:text-emerald-400",
				icon: CheckCircle2,
				badgeVariant: "default" as const,
				badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
			};
		case "IN_REVIEW":
			return {
				bg: "bg-amber-50 dark:bg-amber-950/30",
				border: "border-amber-200 dark:border-amber-800",
				text: "text-amber-700 dark:text-amber-400",
				icon: Clock,
				badgeVariant: "default" as const,
				badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
			};
		case "DRAFT":
			return {
				bg: "bg-blue-50 dark:bg-blue-950/30",
				border: "border-blue-200 dark:border-blue-800",
				text: "text-blue-700 dark:text-blue-400",
				icon: CircleDot,
				badgeVariant: "default" as const,
				badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
			};
		default:
			return {
				bg: "bg-muted/30",
				border: "border-border",
				text: "text-muted-foreground",
				icon: Circle,
				badgeVariant: "secondary" as const,
				badgeClass: "",
			};
	}
}

function getStatusLabel(status: StageStatus, t: ReturnType<typeof useTranslations>) {
	switch (status) {
		case "APPROVED":
			return t("pricing.pipeline.approved");
		case "IN_REVIEW":
			return t("pricing.pipeline.inReview");
		case "DRAFT":
			return t("pricing.pipeline.draft");
		default:
			return t("pricing.pipeline.notStarted");
	}
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function PipelineBar({
	studyId,
	organizationSlug,
	currentStage,
	stages,
	studyType = "FULL_PROJECT",
}: PipelineBarProps) {
	const t = useTranslations();

	// Filter stages based on study type
	const visibleStages = STAGES.filter((stage) => {
		if (studyType === "LUMP_SUM_ANALYSIS" && stage.key === "quotation") {
			return false;
		}
		return true;
	});

	return (
		<div className="mb-6 w-full" dir="rtl">
			<div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border/50 bg-card p-2 sm:gap-2 sm:p-3">
				{visibleStages.map((stage, index) => {
					const status = stages[stage.statusKey];
					const styles = getStatusStyles(status);
					const Icon = styles.icon;
					const isCurrent = currentStage === stage.key;
					const href = `/app/${organizationSlug}/pricing/studies/${studyId}/${stage.path}`;

					// For LUMP_SUM_ANALYSIS, stage 4 label changes
					const label =
						studyType === "LUMP_SUM_ANALYSIS" && stage.key === "selling-price"
							? t("pricing.pipeline.profitability")
							: t(stage.labelKey);

					return (
						<div key={stage.key} className="flex items-center gap-1 sm:gap-2">
							{/* Stage pill */}
							<Link href={href} className="shrink-0">
								<div
									className={cn(
										"flex items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-all sm:gap-2 sm:px-3 sm:py-2",
										styles.bg,
										styles.border,
										isCurrent && "ring-2 ring-primary ring-offset-1",
										status === "NOT_STARTED"
											? "opacity-60"
											: "cursor-pointer hover:shadow-sm",
									)}
								>
									<Icon className={cn("h-4 w-4 shrink-0", styles.text)} />
									<div className="flex flex-col gap-0.5">
										<span
											className={cn(
												"text-xs font-medium whitespace-nowrap sm:text-sm",
												styles.text,
											)}
										>
											{label}
										</span>
										<Badge
											variant={styles.badgeVariant}
											className={cn(
												"h-4 px-1 text-[10px] font-normal",
												styles.badgeClass,
											)}
										>
											{getStatusLabel(status, t)}
										</Badge>
									</div>
								</div>
							</Link>

							{/* Arrow separator */}
							{index < visibleStages.length - 1 && (
								<ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/50" />
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
