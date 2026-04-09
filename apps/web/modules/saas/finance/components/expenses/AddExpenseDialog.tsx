"use client";

import { AddExpenseDialog as SharedAddExpenseDialog } from "@saas/shared/components/AddExpenseDialog";

interface AddExpenseDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	organizationSlug: string;
	expenseId?: string | null;
}

export function AddExpenseDialog({
	open,
	onOpenChange,
	organizationId,
	expenseId,
}: AddExpenseDialogProps) {
	return (
		<SharedAddExpenseDialog
			open={open}
			onOpenChange={onOpenChange}
			organizationId={organizationId}
			showProjectSelector
			expenseId={expenseId}
		/>
	);
}
