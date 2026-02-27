"use client";

import { Progress } from "@ui/components/progress";
import { Slider } from "@ui/components/slider";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ExecutionMilestone } from "../../lib/execution-types";

interface MilestoneProgressRowProps {
	milestone: ExecutionMilestone;
	onUpdateProgress: (progress: number) => void;
	isLoading?: boolean;
}

export function MilestoneProgressRow({
	milestone,
	onUpdateProgress,
	isLoading,
}: MilestoneProgressRowProps) {
	const t = useTranslations();
	const [localProgress, setLocalProgress] = useState(milestone.progress);

	const isAutoCalculated = milestone.progressMethod === "ACTIVITIES";
	const isChecklist = milestone.progressMethod === "CHECKLIST";
	const isDisabled =
		isAutoCalculated ||
		isChecklist ||
		milestone.status === "COMPLETED" ||
		milestone.status === "CANCELLED" ||
		isLoading;

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<span className="text-sm text-muted-foreground">
					{t("timeline.progress")}
				</span>
				<span className="text-2xl font-bold text-teal-600">
					{Math.round(isDisabled ? milestone.progress : localProgress)}%
				</span>
			</div>

			{isAutoCalculated ? (
				<div>
					<Progress value={milestone.progress} className="h-2" />
					<p className="text-xs text-muted-foreground mt-1">
						{t("execution.milestone.progressAutoCalculated")}
					</p>
				</div>
			) : isChecklist ? (
				<div>
					<Progress value={milestone.progress} className="h-2" />
					<p className="text-xs text-muted-foreground mt-1">
						{t("execution.milestone.progressFromChecklist")}
					</p>
				</div>
			) : (
				<Slider
					value={[localProgress]}
					onValueChange={([value]) => setLocalProgress(value)}
					onValueCommit={([value]) => onUpdateProgress(value)}
					min={0}
					max={100}
					step={5}
					disabled={isDisabled}
					className="py-2"
				/>
			)}
		</div>
	);
}
