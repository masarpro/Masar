"use client";

import { cn } from "@ui/lib";
import {
	Calculator,
	Check,
	ChevronLeft,
	ClipboardList,
	DollarSign,
	FileText,
	FolderKanban,
	Pencil,
	Clock,
	Lock,
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
	/** Optional filter: only show these stage types */
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

	// Filter stages if enabledStageTypes is provided
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
		<nav
			className="w-full rounded-xl border border-border/50 bg-card p-3 sm:p-4"
			dir="rtl"
		>
			{/* Desktop: Horizontal stepper with status info */}
			<div className="hidden sm:flex items-center">
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

					// Status indicator circle
					const statusIndicator = (
						<div
							className={cn(
								"flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
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
									isLocked &&
									"bg-muted text-muted-foreground",
							)}
						>
							{isSkipped ? (
								<ArrowLeft className="h-3.5 w-3.5" />
							) : status === "APPROVED" ? (
								<Check className="h-3.5 w-3.5" />
							) : status === "DRAFT" ? (
								<span className="relative flex h-2.5 w-2.5">
									<span
										className={cn(
											"animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
											isCurrent
												? "bg-primary-foreground"
												: "bg-blue-500",
										)}
									/>
									<span
										className={cn(
											"relative inline-flex rounded-full h-2.5 w-2.5",
											isCurrent
												? "bg-primary-foreground"
												: "bg-blue-500",
										)}
									/>
								</span>
							) : status === "IN_REVIEW" ? (
								<Clock className="h-3.5 w-3.5" />
							) : isLocked ? (
								<Lock className="h-3 w-3" />
							) : (
								<span>{index + 1}</span>
							)}
						</div>
					);

					// Label + subtitle
					const labelSection = (
						<div className="hidden md:flex flex-col items-start">
							<span className="text-sm font-medium whitespace-nowrap">
								{stage.label}
							</span>
							{!isSkipped && (
								<span
									className={cn(
										"text-[10px] leading-tight whitespace-nowrap",
										isCurrent
											? "text-primary-foreground/70"
											: "text-muted-foreground",
									)}
								>
									{status === "APPROVED" &&
										(counts?.total
											? `معتمد ✓ · ${counts.total} بند`
											: "معتمد ✓")}
									{status === "DRAFT" &&
										(counts?.total
											? `${counts.completed ?? 0} من ${counts.total}`
											: "جاري العمل")}
									{status === "IN_REVIEW" && "قيد المراجعة"}
									{status === "NOT_STARTED" && "مقفل"}
								</span>
							)}
						</div>
					);

					return (
						<div
							key={stage.key}
							className="flex items-center flex-1 last:flex-initial"
						>
							{isLocked ? (
								<div
									className={cn(
										"flex items-center gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 shrink-0",
										"bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50",
									)}
								>
									{statusIndicator}
									{labelSection}
								</div>
							) : (
								<Link
									href={href}
									className={cn(
										"flex items-center gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 transition-all shrink-0 group",
										isCurrent &&
											"bg-primary text-primary-foreground shadow-sm",
										!isCurrent &&
											isSkipped &&
											"text-muted-foreground/50",
										!isCurrent &&
											!isSkipped &&
											status === "APPROVED" &&
											"bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50",
										!isCurrent &&
											!isSkipped &&
											(status === "DRAFT" ||
												status === "IN_REVIEW") &&
											"text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30",
									)}
								>
									{statusIndicator}
									{labelSection}
								</Link>
							)}

							{/* Connector arrow */}
							{index < visibleStages.length - 1 && (
								<ChevronLeft
									className={cn(
										"h-4 w-4 mx-1 shrink-0",
										isSkippedStage(index + 1, entryPoint) ||
											status === "APPROVED"
											? "text-emerald-400 dark:text-emerald-600"
											: "text-muted-foreground/30",
									)}
								/>
							)}
						</div>
					);
				})}
			</div>

			{/* Mobile: Horizontal icons only */}
			<div className="flex sm:hidden items-center justify-between">
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

					const iconCircle = (
						<div
							className={cn(
								"flex h-9 w-9 items-center justify-center rounded-full transition-all",
								isCurrent &&
									"bg-primary text-primary-foreground shadow-sm",
								!isCurrent &&
									isSkipped &&
									"bg-muted/50 text-muted-foreground/30",
								!isCurrent &&
									!isSkipped &&
									status === "APPROVED" &&
									"bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
								!isCurrent &&
									!isSkipped &&
									status === "DRAFT" &&
									"bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
								!isCurrent &&
									!isSkipped &&
									status === "IN_REVIEW" &&
									"bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
								isLocked &&
									"bg-muted/50 text-muted-foreground opacity-50",
							)}
						>
							{status === "APPROVED" && !isCurrent ? (
								<Check className="h-4 w-4" />
							) : isLocked ? (
								<Lock className="h-3.5 w-3.5" />
							) : (
								<StageIcon className="h-4 w-4" />
							)}
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
							{index < visibleStages.length - 1 && (
								<ChevronLeft
									className={cn(
										"h-3 w-3 mx-0.5 shrink-0",
										status === "APPROVED"
											? "text-emerald-400"
											: "text-muted-foreground/30",
									)}
								/>
							)}
						</div>
					);
				})}
			</div>
		</nav>
	);
}
