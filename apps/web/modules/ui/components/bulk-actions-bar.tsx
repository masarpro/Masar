"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import type { ReactNode } from "react";

export type BulkAction = {
	label: string;
	icon?: ReactNode;
	onClick: (selectedIds: string[]) => void;
	variant?: "default" | "destructive";
};

type BulkActionsBarProps = {
	selectedCount: number;
	totalCount: number;
	actions: BulkAction[];
	selectedIds: string[];
	onClearSelection: () => void;
};

export function BulkActionsBar({
	selectedCount,
	totalCount,
	actions,
	selectedIds,
	onClearSelection,
}: BulkActionsBarProps) {
	if (selectedCount === 0) return null;

	return (
		<div className="sticky bottom-4 z-10 mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-xl border bg-background p-3 shadow-lg animate-in slide-in-from-bottom-2">
			<div className="flex items-center gap-2">
				<Badge variant="secondary">
					{selectedCount} / {totalCount} محدد
				</Badge>
				<Button variant="ghost" size="sm" onClick={onClearSelection}>
					إلغاء التحديد
				</Button>
			</div>
			<div className="flex items-center gap-2">
				{actions.map((action, i) => (
					<Button
						key={i}
						variant={
							action.variant === "destructive"
								? "error"
								: "secondary"
						}
						size="sm"
						onClick={() => action.onClick(selectedIds)}
					>
						{action.icon}
						{action.label}
					</Button>
				))}
			</div>
		</div>
	);
}
