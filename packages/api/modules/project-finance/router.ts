import { createClaim } from "./procedures/create-claim";
import { createExpense } from "./procedures/create-expense";
import { deleteClaim } from "./procedures/delete-claim";
import { deleteExpense } from "./procedures/delete-expense";
import { getFinanceSummary } from "./procedures/get-finance-summary";
import { listClaims } from "./procedures/list-claims";
import { listExpenses } from "./procedures/list-expenses";
import { updateClaim } from "./procedures/update-claim";
import { updateClaimStatusProcedure } from "./procedures/update-claim-status";
import { updateExpense } from "./procedures/update-expense";

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
};
