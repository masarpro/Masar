"use client";

import { Card } from "@ui/components/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/collapsible";
import { useState } from "react";
import type { ExecutionMilestone } from "../../lib/execution-types";
import { MilestoneActivityChecklist } from "./MilestoneActivityChecklist";
import { MilestoneCardHeader } from "./MilestoneCardHeader";
import { MilestoneProgressRow } from "./MilestoneProgressRow";

interface EnhancedMilestoneCardProps {
	milestone: ExecutionMilestone;
	projectId: string;
	organizationSlug: string;
	onStart: () => void;
	onComplete: () => void;
	onUpdateProgress: (progress: number) => void;
	onEdit: () => void;
	onDelete: () => void;
	isLoading?: boolean;
}

export function EnhancedMilestoneCard({
	milestone,
	projectId,
	onStart,
	onComplete,
	onUpdateProgress,
	onEdit,
	onDelete,
	isLoading,
}: EnhancedMilestoneCardProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	const borderColor =
		milestone.status === "COMPLETED"
			? "border-green-200 dark:border-green-800"
			: milestone.status === "DELAYED"
				? "border-red-200 dark:border-red-800"
				: milestone.isCritical
					? "border-orange-200 dark:border-orange-800"
					: "";

	return (
		<Card className={`p-4 ${borderColor}`}>
			<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
				<CollapsibleTrigger asChild>
					<div>
						<MilestoneCardHeader
							milestone={milestone}
							isExpanded={isExpanded}
							onToggleExpand={() => setIsExpanded(!isExpanded)}
							onStart={onStart}
							onComplete={onComplete}
							onEdit={onEdit}
							onDelete={onDelete}
							isLoading={isLoading}
						/>
					</div>
				</CollapsibleTrigger>

				{/* Inline progress bar (always visible) */}
				<div className="mt-3 ms-6">
					<MilestoneProgressRow
						milestone={milestone}
						onUpdateProgress={onUpdateProgress}
						isLoading={isLoading}
					/>
				</div>

				<CollapsibleContent>
					<div className="mt-4 ms-6 space-y-4 border-t pt-4">
						{/* Activity checklist */}
						<MilestoneActivityChecklist
							projectId={projectId}
							milestoneId={milestone.id}
						/>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}
