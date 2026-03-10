"use client";

import { cn } from "@ui/lib";
import {
	Calculator,
	Check,
	ClipboardList,
	Coins,
	FileText,
	Tag,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const PIPELINE_STEPS = [
	{ id: "quantities", icon: Calculator, pathSuffix: "" },
	{ id: "specifications", icon: ClipboardList, pathSuffix: "/specifications" },
	{ id: "costing", icon: Coins, pathSuffix: "/costing" },
	{ id: "selling-price", icon: Tag, pathSuffix: "/selling-price" },
	{ id: "quotation", icon: FileText, pathSuffix: "/quotation" },
] as const;

type StepId = (typeof PIPELINE_STEPS)[number]["id"];

interface StudyPipelineStepperProps {
	studyId: string;
	organizationSlug: string;
	completedStages?: string[];
}

function getCurrentStep(pathname: string, basePath: string): StepId {
	const relativePath = pathname.replace(basePath, "");
	if (relativePath.startsWith("/specifications")) return "specifications";
	if (relativePath.startsWith("/costing")) return "costing";
	if (relativePath.startsWith("/selling-price")) return "selling-price";
	if (relativePath.startsWith("/quotation") || relativePath.startsWith("/pricing"))
		return "quotation";
	return "quantities";
}

export function StudyPipelineStepper({
	studyId,
	organizationSlug,
	completedStages = [],
}: StudyPipelineStepperProps) {
	const t = useTranslations();
	const pathname = usePathname();

	const basePath = `/app/${organizationSlug}/pricing/studies/${studyId}`;
	const currentStepId = getCurrentStep(pathname, basePath);

	const currentIndex = PIPELINE_STEPS.findIndex((s) => s.id === currentStepId);

	return (
		<nav
			className="w-full rounded-xl border border-border/50 bg-card p-3 sm:p-4"
			dir="rtl"
		>
			<div className="flex items-center">
				{PIPELINE_STEPS.map((step, index) => {
					const isCompleted = completedStages.includes(step.id);
					const isCurrent = step.id === currentStepId;
					const isUpcoming = !isCompleted && !isCurrent && index > currentIndex;
					const Icon = step.icon;

					const href =
						step.id === "quantities"
							? `${basePath}/quantities`
							: `${basePath}${step.pathSuffix}`;

					const labelKey =
						step.id === "selling-price"
							? "pricing.pipeline.sellingPrice"
							: `pricing.pipeline.${step.id}`;

					return (
						<div key={step.id} className="flex items-center flex-1 last:flex-initial">
							{/* Step */}
							<Link
								href={href}
								className={cn(
									"flex items-center gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 transition-all shrink-0",
									isCurrent &&
										"bg-primary text-primary-foreground shadow-sm",
									isCompleted &&
										!isCurrent &&
										"bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50",
									isUpcoming &&
										"text-muted-foreground hover:bg-muted/50",
									!isCurrent &&
										!isCompleted &&
										!isUpcoming &&
										"text-muted-foreground hover:bg-muted/50",
								)}
							>
								{/* Step number / check icon */}
								<div
									className={cn(
										"flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
										isCurrent &&
											"bg-primary-foreground/20 text-primary-foreground",
										isCompleted &&
											!isCurrent &&
											"bg-emerald-200 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300",
										!isCurrent &&
											!isCompleted &&
											"bg-muted text-muted-foreground",
									)}
								>
									{isCompleted ? (
										<Check className="h-3.5 w-3.5" />
									) : (
										index + 1
									)}
								</div>

								{/* Icon + Label — label hidden on small screens */}
								<Icon className="h-4 w-4 shrink-0 sm:hidden" />
								<span className="hidden sm:inline text-sm font-medium whitespace-nowrap">
									{t(labelKey)}
								</span>
							</Link>

							{/* Connector line */}
							{index < PIPELINE_STEPS.length - 1 && (
								<div
									className={cn(
										"flex-1 mx-1 sm:mx-2 h-0.5 rounded-full",
										index < currentIndex || completedStages.includes(PIPELINE_STEPS[index + 1].id)
											? "bg-emerald-300 dark:bg-emerald-700"
											: "bg-border",
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
