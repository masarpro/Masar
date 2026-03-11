"use client";

import { cn } from "@ui/lib";
import {
	Calculator,
	Check,
	ClipboardList,
	DollarSign,
	FileText,
	FolderKanban,
	Pencil,
	Clock,
	Circle,
	ArrowLeft,
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

const STATUS_LABELS: Record<StageStatus, string> = {
	NOT_STARTED: "لم تبدأ",
	DRAFT: "جاري العمل",
	IN_REVIEW: "قيد المراجعة",
	APPROVED: "معتمد",
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
	/** Optional counts per stage (e.g. number of items) */
	stageCounts?: Partial<Record<StageType, { total?: number; completed?: number }>>;
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
}: StudyPipelineStepperProps) {
	const pathname = usePathname();
	const basePath = `/app/${organizationSlug}/pricing/studies/${studyId}`;

	const getActiveFromPath = (): StageType | null => {
		if (currentStage) return currentStage;
		for (const stage of PIPELINE_STAGES) {
			if (pathname.includes(`/${stage.path}`)) return stage.key;
		}
		return null;
	};

	const activeStageKey = getActiveFromPath();

	return (
		<nav
			className="w-full rounded-xl border border-border/50 bg-card p-3 sm:p-4"
			dir="rtl"
		>
			{/* Desktop: Horizontal stepper with status info */}
			<div className="hidden sm:flex items-center">
				{PIPELINE_STAGES.map((stage, index) => {
					const status = getStageStatus(stage.key, stages);
					const isSkipped = isSkippedStage(index, entryPoint);
					const isCurrent = stage.key === activeStageKey;
					const counts = stageCounts?.[stage.key];

					const href =
						stage.key === "QUANTITIES"
							? `${basePath}/quantities`
							: `${basePath}/${stage.path}`;

					return (
						<div
							key={stage.key}
							className="flex items-center flex-1 last:flex-initial"
						>
							<Link
								href={href}
								className={cn(
									"flex items-center gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 transition-all shrink-0 group",
									isCurrent && "bg-primary text-primary-foreground shadow-sm",
									!isCurrent && isSkipped && "text-muted-foreground/50",
									!isCurrent &&
										!isSkipped &&
										status === "APPROVED" &&
										"bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50",
									!isCurrent &&
										!isSkipped &&
										(status === "DRAFT" || status === "IN_REVIEW") &&
										"text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30",
									!isCurrent &&
										!isSkipped &&
										status === "NOT_STARTED" &&
										"text-muted-foreground hover:bg-muted/50",
								)}
							>
								{/* Status indicator */}
								<div
									className={cn(
										"flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
										isCurrent &&
											"bg-primary-foreground/20 text-primary-foreground",
										!isCurrent &&
											isSkipped &&
											"bg-muted text-muted-foreground/50",
										!isCurrent &&
											!isSkipped &&
											status === "APPROVED" &&
											"bg-emerald-200 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300",
										!isCurrent &&
											!isSkipped &&
											status === "DRAFT" &&
											"bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
										!isCurrent &&
											!isSkipped &&
											status === "IN_REVIEW" &&
											"bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
										!isCurrent &&
											!isSkipped &&
											status === "NOT_STARTED" &&
											"bg-muted text-muted-foreground",
									)}
								>
									{isSkipped ? (
										<ArrowLeft className="h-3.5 w-3.5" />
									) : status === "APPROVED" && !isCurrent ? (
										<Check className="h-3.5 w-3.5" />
									) : status === "DRAFT" && !isCurrent ? (
										<Pencil className="h-3 w-3" />
									) : status === "IN_REVIEW" && !isCurrent ? (
										<Clock className="h-3.5 w-3.5" />
									) : isCurrent ? (
										index + 1
									) : (
										<Circle className="h-3 w-3" />
									)}
								</div>

								{/* Label + status subtitle */}
								<div className="hidden sm:flex flex-col items-start">
									<span className="text-sm font-medium whitespace-nowrap">
										{stage.label}
									</span>
									{/* Status subtitle */}
									{!isSkipped && (
										<span
											className={cn(
												"text-[10px] leading-tight whitespace-nowrap",
												isCurrent
													? "text-primary-foreground/70"
													: "text-muted-foreground",
											)}
										>
											{status === "APPROVED" && "معتمد ✓"}
											{status === "DRAFT" &&
												(counts?.total
													? `${counts.completed ?? 0} من ${counts.total}`
													: "جاري العمل")}
											{status === "IN_REVIEW" && "قيد المراجعة"}
											{status === "NOT_STARTED" && "مقفل"}
										</span>
									)}
								</div>
							</Link>

							{/* Connector line */}
							{index < PIPELINE_STAGES.length - 1 && (
								<div
									className={cn(
										"flex-1 mx-1 sm:mx-2 h-0.5 rounded-full",
										isSkippedStage(index + 1, entryPoint) || status === "APPROVED"
											? "bg-emerald-300 dark:bg-emerald-700"
											: "bg-border",
									)}
								/>
							)}
						</div>
					);
				})}
			</div>

			{/* Mobile: Compact vertical list */}
			<div className="flex sm:hidden flex-col gap-1">
				{PIPELINE_STAGES.map((stage, index) => {
					const status = getStageStatus(stage.key, stages);
					const isSkipped = isSkippedStage(index, entryPoint);
					const isCurrent = stage.key === activeStageKey;
					const counts = stageCounts?.[stage.key];

					const href =
						stage.key === "QUANTITIES"
							? `${basePath}/quantities`
							: `${basePath}/${stage.path}`;

					return (
						<Link
							key={stage.key}
							href={href}
							className={cn(
								"flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
								isCurrent && "bg-primary text-primary-foreground shadow-sm",
								!isCurrent && isSkipped && "text-muted-foreground/50",
								!isCurrent &&
									!isSkipped &&
									status === "APPROVED" &&
									"text-emerald-700 dark:text-emerald-400",
								!isCurrent &&
									!isSkipped &&
									status !== "APPROVED" &&
									"text-muted-foreground hover:bg-muted/50",
							)}
						>
							<div
								className={cn(
									"flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
									isCurrent && "bg-primary-foreground/20 text-primary-foreground",
									!isCurrent && isSkipped && "bg-muted text-muted-foreground/50",
									!isCurrent && !isSkipped && status === "APPROVED" && "bg-emerald-200 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300",
									!isCurrent && !isSkipped && status === "DRAFT" && "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
									!isCurrent && !isSkipped && status === "IN_REVIEW" && "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
									!isCurrent && !isSkipped && status === "NOT_STARTED" && "bg-muted text-muted-foreground",
								)}
							>
								{isSkipped ? (
									<ArrowLeft className="h-3.5 w-3.5" />
								) : status === "APPROVED" && !isCurrent ? (
									<Check className="h-3.5 w-3.5" />
								) : status === "DRAFT" && !isCurrent ? (
									<Pencil className="h-3 w-3" />
								) : status === "IN_REVIEW" && !isCurrent ? (
									<Clock className="h-3.5 w-3.5" />
								) : (
									index + 1
								)}
							</div>
							<span className="text-sm font-medium flex-1">{stage.label}</span>
							{/* Mobile status badge */}
							{!isSkipped && status !== "NOT_STARTED" && (
								<span
									className={cn(
										"text-[10px] font-medium px-1.5 py-0.5 rounded-full",
										isCurrent && "bg-primary-foreground/20 text-primary-foreground",
										!isCurrent && status === "APPROVED" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
										!isCurrent && status === "DRAFT" && "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
										!isCurrent && status === "IN_REVIEW" && "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
									)}
								>
									{STATUS_LABELS[status]}
								</span>
							)}
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
