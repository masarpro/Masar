import { redirect } from "next/navigation";

/**
 * Legacy route. `CreateExpenseForm` wrote to the abandoned `projectExpense`
 * table — those rows never appeared in any list/summary/profitability and never
 * produced a journal entry (silent financial data loss). The canonical expense
 * flow is the unified `AddExpenseDialog` on the project expenses page (§19.10).
 *
 * No live navigation points here (the "Add Expense" quick action links to
 * `finance/expenses`); this redirect only catches stale bookmarks/URLs.
 */
export default async function NewExpensePage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;
	redirect(`/app/${organizationSlug}/projects/${projectId}/finance/expenses`);
}
