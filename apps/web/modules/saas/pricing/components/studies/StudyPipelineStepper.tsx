"use client";

import { cn } from "@ui/lib";
import {
	Calculator,
	Check,
	ClipboardList,
	DollarSign,
	FileText,
	FolderKanban,
	Clock,
	Lock,
	Receipt,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ═══════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════

type StageType =
	| "QUANTITIES"
	| "SPECIFICATIONS"
	| "COSTING"
	| "PRICING"
	| "QUOTATION"
	| "CONVERSION";

type StageStatus = "NOT_STARTED" | "DRAFT" | "IN_REVIEW" | "APPROVED";

type StudyEntryPoint =
	| "FROM_SCRATCH"
	| "HAS_QUANTITIES"
	| "HAS_SPECS"
	| "QUOTATION_ONLY"
	| "LUMP_SUM_ANALYSIS"
	| "CUSTOM_ITEMS";

const PIPELINE_STAGES = [
	{
		key: "QUANTITIES" as const,
		label: "الكميات",
		labelEn: "Quantities",
		icon: Calculator,
		path: "quantities",
	},
	{
		key: "SPECIFICATIONS" as const,
		label: "المواصفات",
		labelEn: "Specifications",
		icon: ClipboardList,
		path: "specifications",
	},
	{
		key: "COSTING" as const,
		label: "تسعير التكلفة",
		labelEn: "Costing",
		icon: Receipt,
		path: "costing",
	},
	{
		key: "PRICING" as const,
		label: "التسعير",
		labelEn: "Pricing",
		icon: DollarSign,
		path: "pricing",
	},
	{
		key: "QUOTATION" as const,
		label: "عرض السعر",
		labelEn: "Quotation",
		icon: FileText,
		path: "quotation",
	},
	{
		key: "CONVERSION" as const,
		label: "مشروع",
		labelEn: "Project",
		icon: FolderKanban,
		path: "convert",
	},
] as const;

// Entry point → first active stage index
const ENTRY_POINT_START_INDEX: Record<StudyEntryPoint, number> = {
	FROM_SCRATCH: 0,
	HAS_QUANTITIES: 1,
	HAS_SPECS: 2,
	QUOTATION_ONLY: 4,
	LUMP_SUM_ANALYSIS: 2,
	CUSTOM_ITEMS: 0,
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

interface StudyPipelineStepperProps {
	studyId: string;
	organizationSlug: string;
	stages: Array<{
		stage: StageType;
		status: StageStatus;
		assigneeId?: string | null;
	}>;
	entryPoint: StudyEntryPoint;
	currentStage?: StageType;
	stageCounts?: Partial<
		Record<StageType, { total?: number; completed?: number }>
	>;
	enabledStageTypes?: string[];
}

function getStageStatus(
	stageKey: StageType,
	stages: StudyPipelineStepperProps["stages"],
): StageStatus {
	const found = stages.find((s) => s.stage === stageKey);
	return found?.status ?? "NOT_STARTED";
}

function isSkippedStage(
	stageIndex: number,
	entryPoint: StudyEntryPoint,
): boolean {
	const startIndex = ENTRY_POINT_START_INDEX[entryPoint] ?? 0;
	return stageIndex < startIndex;
}

export function StudyPipelineStepper({
	studyId,
	organizationSlug,
	stages,
	entryPoint,
	currentStage,
	stageCounts,
	enabledStageTypes,
}: StudyPipelineStepperProps) {
	const pathname = usePathname();
	const basePath = `/app/${organizationSlug}/pricing/studies/${studyId}`;

	const visibleStages = enabledStageTypes
		? PIPELINE_STAGES.filter((s) => enabledStageTypes.includes(s.key))
		: PIPELINE_STAGES;

	const getActiveFromPath = (): StageType | null => {
		if (currentStage) return currentStage;
		for (const stage of visibleStages) {
			if (pathname.includes(`/${stage.path}`)) return stage.key;
		}
		return null;
	};

	const activeStageKey = getActiveFromPath();

	return (
		<nav dir="rtl">
			{/* Desktop */}
			<div className="hidden sm:flex items-center justify-center gap-0">
				{visibleStages.map((stage, index) => {
					const status = getStageStatus(stage.key, stages);
					const isSkipped = isSkippedStage(index, entryPoint);
					const isCurrent = stage.key === activeStageKey;
					const counts = stageCounts?.[stage.key];
					const isLocked =
						!isSkipped && !isCurrent && status === "NOT_STARTED";

					const href =
						stage.key === "QUANTITIES"
							? `${basePath}/quantities`
							: `${basePath}/${stage.path}`;

					const StageIcon = stage.icon;

					// Determine colors
					const isApproved =
						!isCurrent && !isSkipped && status === "APPROVED";
					const isDraft =
						!isCurrent && !isSkipped && status === "DRAFT";
					const isInReview =
						!isCurrent && !isSkipped && status === "IN_REVIEW";

					// Connector line between stages
					const connector = index < visibleStages.length - 1 && (
						<div
							className={cn(
								"h-[2px] w-8 lg:w-12 shrink-0",
								isApproved || status === "APPROVED"
									? "bg-emerald-400 dark:bg-emerald-600"
									: "bg-border",
							)}
						/>
					);

					// Status badge text
					const statusText = isSkipped
						? null
						: status === "APPROVED"
							? counts?.total
								? `معتمد · ${counts.total}`
								: "معتمد"
							: status === "DRAFT"
								? counts?.total
									? `${counts.completed ?? 0}/${counts.total}`
									: "جاري العمل"
								: status === "IN_REVIEW"
									? "مراجعة"
									: null;

					const stageContent = (
						<div
							className={cn(
								"flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all min-w-[90px]",
								isCurrent &&
									"bg-primary text-primary-foreground shadow-md",
								!isCurrent &&
									isApproved &&
									"hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
								!isCurrent &&
									isDraft &&
									"hover:bg-blue-50 dark:hover:bg-blue-950/30",
								!isCurrent &&
									isInReview &&
									"hover:bg-amber-50 dark:hover:bg-amber-950/30",
								isLocked && "opacity-40 cursor-not-allowed",
								!isCurrent &&
									!isLocked &&
									!isSkipped &&
									"hover:shadow-sm",
							)}
						>
							{/* Icon circle */}
							<div
								className={cn(
									"flex h-10 w-10 items-center justify-center rounded-full transition-colors",
									isCurrent &&
										"bg-primary-foreground/20",
									isApproved &&
										"bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
									isDraft &&
										"bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
									isInReview &&
										"bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
									isLocked &&
										"bg-muted text-muted-foreground",
									isSkipped &&
										"bg-muted/50 text-muted-foreground/30",
								)}
							>
								{isApproved ? (
									<Check className="h-5 w-5" />
								) : isLocked ? (
									<Lock className="h-4 w-4" />
								) : (
									<StageIcon className="h-5 w-5" />
								)}
							</div>

							{/* Label */}
							<span
								className={cn(
									"text-xs font-medium whitespace-nowrap",
									isCurrent && "text-primary-foreground",
									isApproved &&
										"text-emerald-700 dark:text-emerald-400",
									isDraft &&
										"text-blue-600 dark:text-blue-400",
									isInReview &&
										"text-amber-600 dark:text-amber-400",
									isLocked && "text-muted-foreground",
									isSkipped && "text-muted-foreground/40",
								)}
							>
								{stage.label}
							</span>

							{/* Status text */}
							{statusText && (
								<span
									className={cn(
										"text-[10px] leading-none",
										isCurrent
											? "text-primary-foreground/70"
											: isApproved
												? "text-emerald-500 dark:text-emerald-500"
												: isDraft
													? "text-blue-500 dark:text-blue-400"
													: "text-muted-foreground",
									)}
								>
									{statusText}
								</span>
							)}
						</div>
					);

					return (
						<div
							key={stage.key}
							className="flex items-center"
						>
							{isLocked ? (
								stageContent
							) : (
								<Link href={href}>{stageContent}</Link>
							)}
							{connector}
						</div>
					);
				})}
			</div>

			{/* Mobile */}
			<div className="flex sm:hidden items-center justify-center gap-1">
				{visibleStages.map((stage, index) => {
					const status = getStageStatus(stage.key, stages);
					const isSkipped = isSkippedStage(index, entryPoint);
					const isCurrent = stage.key === activeStageKey;
					const isLocked =
						!isSkipped && !isCurrent && status === "NOT_STARTED";

					const href =
						stage.key === "QUANTITIES"
							? `${basePath}/quantities`
							: `${basePath}/${stage.path}`;

					const StageIcon = stage.icon;

					const isApproved =
						!isCurrent && !isSkipped && status === "APPROVED";
					const isDraft =
						!isCurrent && !isSkipped && status === "DRAFT";
					const isInReview =
						!isCurrent && !isSkipped && status === "IN_REVIEW";

					const connector = index < visibleStages.length - 1 && (
						<div
							className={cn(
								"h-[2px] w-4 shrink-0",
								status === "APPROVED"
									? "bg-emerald-400"
									: "bg-border",
							)}
						/>
					);

					const iconCircle = (
						<div className="flex flex-col items-center gap-1">
							<div
								className={cn(
									"flex h-10 w-10 items-center justify-center rounded-full transition-all",
									isCurrent &&
										"bg-primary text-primary-foreground shadow-md",
									isApproved &&
										"bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
									isDraft &&
										"bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
									isInReview &&
										"bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
									isLocked &&
										"bg-muted/50 text-muted-foreground opacity-40",
									isSkipped &&
										"bg-muted/50 text-muted-foreground/30",
								)}
							>
								{isApproved ? (
									<Check className="h-4 w-4" />
								) : isLocked ? (
									<Lock className="h-3.5 w-3.5" />
								) : (
									<StageIcon className="h-4 w-4" />
								)}
							</div>
							<span
								className={cn(
									"text-[10px] font-medium whitespace-nowrap",
									isCurrent && "text-primary",
									isApproved &&
										"text-emerald-600 dark:text-emerald-400",
									isDraft &&
										"text-blue-600 dark:text-blue-400",
									isLocked && "text-muted-foreground/40",
								)}
							>
								{stage.label}
							</span>
						</div>
					);

					return (
						<div key={stage.key} className="flex items-center">
							{isLocked ? (
								<div className="cursor-not-allowed">
									{iconCircle}
								</div>
							) : (
								<Link href={href}>{iconCircle}</Link>
							)}
							{connector}
						</div>
					);
				})}
			</div>
		</nav>
	);
}
