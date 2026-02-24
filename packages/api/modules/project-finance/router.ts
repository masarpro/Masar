import { createClaim } from "./procedures/create-claim";
import { createExpense } from "./procedures/create-expense";
import { createSubcontract } from "./procedures/create-subcontract";
import { deleteClaim } from "./procedures/delete-claim";
import { deleteExpense } from "./procedures/delete-expense";
import { deleteSubcontract } from "./procedures/delete-subcontract";
import { getExpensesByCategoryProcedure } from "./procedures/get-expenses-by-category";
import { getFinanceSummary } from "./procedures/get-finance-summary";
import { getPaymentsClaimsTimelineProcedure } from "./procedures/get-payments-claims-timeline";
import { getSubcontract } from "./procedures/get-subcontract";
import { listClaims } from "./procedures/list-claims";
import { listExpenses } from "./procedures/list-expenses";
import { listSubcontracts } from "./procedures/list-subcontracts";
import { updateClaim } from "./procedures/update-claim";
import { updateClaimStatusProcedure } from "./procedures/update-claim-status";
import { updateExpense } from "./procedures/update-expense";
import { updateSubcontract } from "./procedures/update-subcontract";

export const projectFinanceRouter = {
	getSummary: getFinanceSummary,
	listExpenses,
	createExpense,
	updateExpense,
	deleteExpense,
	listClaims,
	createClaim,
	updateClaim,
	updateClaimStatus: updateClaimStatusProcedure,
	deleteClaim,
	listSubcontracts,
	getSubcontract,
	createSubcontract,
	updateSubcontract,
	deleteSubcontract,
	getExpensesByCategory: getExpensesByCategoryProcedure,
	getPaymentsClaimsTimeline: getPaymentsClaimsTimelineProcedure,
};
