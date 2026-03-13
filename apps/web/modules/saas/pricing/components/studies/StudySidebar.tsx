"use client";

import { cn } from "@ui/lib";
import {
	Calculator,
	Check,
	ClipboardList,
	DollarSign,
	FileText,
	FolderKanban,
	LayoutDashboard,
	Pencil,
	Clock,
	Circle,
	ArrowLeft,
	Receipt,
	ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ═══════════════════════════════════════════════════════════════
// TYPES
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

// ═══════════════════════════════════════════════════════════════
// SIDEBAR STAGES
// ═══════════════════════════════════════════════════════════════

const SIDEBAR_STAGES = [
	{ key: "QUANTITIES" as const, label: "الكميات", icon: Calculator, path: "quantities", number: "①" },
	{ key: "SPECIFICATIONS" as const, label: "المواصفات", icon: ClipboardList, path: "specifications", number: "②" },
	{ key: "COSTING" as const, label: "تسعير التكلفة", icon: Receipt, path: "costing", number: "③" },
	{ key: "PRICING" as const, label: "التسعير", icon: DollarSign, path: "pricing", number: "④" },
	{ key: "QUOTATION" as const, label: "عرض السعر", icon: FileText, path: "quotation", number: "⑤" },
	{ key: "CONVERSION" as const, label: "تحويل لمشروع", icon: FolderKanban, path: "convert", number: "⑥" },
] as const;

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

interface StudySidebarProps {
	studyId: string;
	studyName?: string | null;
	organizationSlug: string;
	stages: Array<{
		stage: StageType;
		status: StageStatus;
	}>;
	entryPoint: StudyEntryPoint;
	/** Optional filter: only show these stage types (synced with StudyPipelineStepper) */
	enabledStageTypes?: StageType[];
}

export function StudySidebar({
	studyId,
	studyName,
	organizationSlug,
	stages,
	entryPoint,
	enabledStageTypes,
}: StudySidebarProps) {
	const pathname = usePathname();
	const basePath = `/app/${organizationSlug}/pricing/studies/${studyId}`;
	const studiesListPath = `/app/${organizationSlug}/pricing/studies`;

	// Filter stages by enabledStageTypes (synced with StudyPipelineStepper)
	const visibleStages = enabledStageTypes
		? SIDEBAR_STAGES.filter((s) => enabledStageTypes.includes(s.key))
		: SIDEBAR_STAGES;

	const getStatus = (stageKey: StageType): StageStatus => {
		return stages.find((s) => s.stage === stageKey)?.status ?? "NOT_STARTED";
	};

	const isSkipped = (stageKey: StageType): boolean => {
		const startIndex = ENTRY_POINT_START_INDEX[entryPoint] ?? 0;
		const originalIndex = SIDEBAR_STAGES.findIndex((s) => s.key === stageKey);
		return originalIndex < startIndex;
	};

	const isActive = (path: string): boolean => {
		if (path === "") {
			// Overview: active only on the exact study page
			const studyPagePath = `/pricing/studies/${studyId}`;
			return pathname.endsWith(studyPagePath) || pathname.endsWith(`${studyPagePath}/`);
		}
		return pathname.includes(`/${path}`);
	};

	return (
		<aside
			className="hidden lg:flex flex-col w-56 shrink-0 border-s border-border bg-card/50 rounded-xl p-3 self-start sticky top-4"
			dir="rtl"
		>
			{/* Back to studies list */}
			<Link
				href={studiesListPath}
				className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted/50 mb-1"
			>
				<ArrowRight className="h-4 w-4" />
				<span>دراسات الكميات</span>
			</Link>

			{/* Study name */}
			{studyName && (
				<div className="px-3 py-2 mb-2">
					<p className="text-sm font-semibold text-foreground truncate">{studyName}</p>
				</div>
			)}

			<div className="h-px bg-border mb-2" />

			{/* Overview link */}
			<Link
				href={basePath}
				className={cn(
					"flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mb-1",
					isActive("")
						? "bg-primary text-primary-foreground font-medium"
						: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
				)}
			>
				<LayoutDashboard className="h-4 w-4" />
				<span>نظرة عامة</span>
			</Link>

			<div className="h-px bg-border my-2" />

			{/* Pipeline stages */}
			<div className="flex flex-col gap-0.5">
				<p className="text-[11px] text-muted-foreground font-medium px-3 py-1 uppercase tracking-wider">
					مراحل الدراسة
				</p>

				{visibleStages.map((stage) => {
					const status = getStatus(stage.key);
					const skipped = isSkipped(stage.key);
					const active = isActive(stage.path);

					const href =
						stage.key === "QUANTITIES"
							? `${basePath}/quantities`
							: `${basePath}/${stage.path}`;

					return (
						<Link
							key={stage.key}
							href={href}
							className={cn(
								"flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all group",
								active && "bg-primary text-primary-foreground font-medium",
								!active && skipped && "text-muted-foreground/40",
								!active && !skipped && status === "APPROVED" && "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
								!active && !skipped && status === "DRAFT" && "text-foreground hover:bg-blue-50 dark:hover:bg-blue-950/30",
								!active && !skipped && status === "IN_REVIEW" && "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30",
								!active && !skipped && status === "NOT_STARTED" && "text-muted-foreground hover:bg-muted/50",
							)}
						>
							{/* Stage number/status indicator */}
							<div
								className={cn(
									"flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
									active && "bg-primary-foreground/20 text-primary-foreground",
									!active && skipped && "bg-muted/50 text-muted-foreground/40",
									!active && !skipped && status === "APPROVED" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
									!active && !skipped && status === "DRAFT" && "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
									!active && !skipped && status === "IN_REVIEW" && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
									!active && !skipped && status === "NOT_STARTED" && "bg-muted text-muted-foreground",
								)}
							>
								{skipped ? (
									<ArrowLeft className="h-3 w-3" />
								) : status === "APPROVED" && !active ? (
									<Check className="h-3 w-3" />
								) : status === "DRAFT" && !active ? (
									<Pencil className="h-2.5 w-2.5" />
								) : status === "IN_REVIEW" && !active ? (
									<Clock className="h-3 w-3" />
								) : (
									stage.number
								)}
							</div>

							{/* Label */}
							<span className="truncate">{stage.label}</span>
						</Link>
					);
				})}
			</div>
		</aside>
	);
}
