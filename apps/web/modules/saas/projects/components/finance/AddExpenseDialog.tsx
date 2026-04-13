"use client";

import { AddExpenseDialog as FinanceAddExpenseDialog } from "@saas/finance/components/expenses/AddExpenseDialog";

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
		<FinanceAddExpenseDialog
			open={open}
			onOpenChange={onOpenChange}
			organizationId={organizationId}
			projectId={projectId}
		/>
	);
}
