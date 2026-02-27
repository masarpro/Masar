"use client";

import { Badge } from "@ui/components/badge";
import { useTranslations } from "next-intl";

interface MilestoneLinkedItemsProps {
	organizationSlug: string;
	projectId: string;
	milestoneId: string;
	photosCount?: number;
	issuesCount?: number;
}

export function MilestoneLinkedItems({
	photosCount = 0,
	issuesCount = 0,
}: MilestoneLinkedItemsProps) {
	const t = useTranslations();

	if (photosCount === 0 && issuesCount === 0) return null;

	return (
		<div className="flex items-center gap-2 flex-wrap">
			{photosCount > 0 && (
				<Badge variant="secondary" className="text-xs gap-1">
					📷 {t("execution.milestone.linkedPhotos", { count: photosCount })}
				</Badge>
			)}
			{issuesCount > 0 && (
				<Badge
					variant="secondary"
					className="text-xs gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
				>
					⚠️ {t("execution.milestone.linkedIssues", { count: issuesCount })}
				</Badge>
			)}
		</div>
	);
}
