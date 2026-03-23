// Accounting Module Router
// Chart of Accounts + Journal Entries + Reports + Periods

import {
	seedChartOfAccountsProcedure,
	listAccountsProcedure,
	getAccountByIdProcedure,
	createAccountProcedure,
	updateAccountProcedure,
	deactivateAccountProcedure,
	getAccountBalanceProcedure,
} from "./procedures/chart-of-accounts";

import {
	listJournalEntriesProcedure,
	getJournalEntryByIdProcedure,
	createJournalEntryProcedure,
	postJournalEntryProcedure,
	reverseJournalEntryProcedure,
	deleteJournalEntryProcedure,
	getTrialBalanceProcedure,
	getBalanceSheetProcedure,
	getJournalIncomeStatementProcedure,
	createAdjustmentEntryProcedure,
	listPeriodsProcedure,
	generatePeriodsProcedure,
	closePeriodProcedure,
	reopenPeriodProcedure,
} from "./procedures/journal-entries";

export const accountingRouter = {
	// Chart of Accounts
	accounts: {
		seed: seedChartOfAccountsProcedure,
		list: listAccountsProcedure,
		getById: getAccountByIdProcedure,
		create: createAccountProcedure,
		update: updateAccountProcedure,
		deactivate: deactivateAccountProcedure,
		getBalance: getAccountBalanceProcedure,
	},

	// Journal Entries
	journal: {
		list: listJournalEntriesProcedure,
		getById: getJournalEntryByIdProcedure,
		create: createJournalEntryProcedure,
		post: postJournalEntryProcedure,
		reverse: reverseJournalEntryProcedure,
		delete: deleteJournalEntryProcedure,
		createAdjustment: createAdjustmentEntryProcedure,
	},

	// Reports
	reports: {
		trialBalance: getTrialBalanceProcedure,
		balanceSheet: getBalanceSheetProcedure,
		incomeStatement: getJournalIncomeStatementProcedure,
	},

	// Accounting Periods
	periods: {
		list: listPeriodsProcedure,
		generate: generatePeriodsProcedure,
		close: closePeriodProcedure,
		reopen: reopenPeriodProcedure,
	},
};
