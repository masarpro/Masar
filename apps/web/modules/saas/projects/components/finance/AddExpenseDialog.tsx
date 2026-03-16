"use client";

import { AddExpenseDialog as SharedAddExpenseDialog } from "@saas/shared/components/AddExpenseDialog";

interface AddExpenseDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	projectId: string;
}

export function AddExpenseDialog({
	open,
	onOpenChange,
	organizationId,
	projectId,
}: AddExpenseDialogProps) {
	return (
		<SharedAddExpenseDialog
			open={open}
			onOpenChange={onOpenChange}
			organizationId={organizationId}
			projectId={projectId}
		/>
	);
}
