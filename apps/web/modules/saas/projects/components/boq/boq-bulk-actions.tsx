"use client";

import { Button } from "@ui/components/button";
import { Trash2, Tag } from "lucide-react";
import { useTranslations } from "next-intl";

interface BOQBulkActionsProps {
	selectedCount: number;
	onDeleteSelected: () => void;
	onAssignPhase: () => void;
}

export function BOQBulkActions({
	selectedCount,
	onDeleteSelected,
	onAssignPhase,
}: BOQBulkActionsProps) {
	const t = useTranslations("projectBoq");

	if (selectedCount === 0) return null;

	return (
		<div className="flex items-center gap-3 rounded-xl border border-chart-4 bg-chart-4/15 p-3 dark:border-chart-4 dark:bg-chart-4/20">
			<span className="text-sm font-medium text-chart-4 dark:text-chart-4">
				{selectedCount} {t("summary.totalItems").toLowerCase()}
			</span>
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
					onClick={onDeleteSelected}
				>
					<Trash2 className="h-4 w-4 me-1.5" />
					{t("actions.deleteSelected")}
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="rounded-xl"
					onClick={onAssignPhase}
				>
					<Tag className="h-4 w-4 me-1.5" />
					{t("actions.assignPhase")}
				</Button>
			</div>
		</div>
	);
}
