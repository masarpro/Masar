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
		<div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
			<span className="text-sm font-medium text-blue-700 dark:text-blue-300">
				{selectedCount} {t("summary.totalItems").toLowerCase()}
			</span>
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400"
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
