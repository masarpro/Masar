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
	getAccountLedgerProcedure,
	getOpeningBalancesProcedure,
	saveOpeningBalancesProcedure,
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
	bulkPostJournalEntriesProcedure,
	postAllDraftsProcedure,
	findJournalEntryByReferenceProcedure,
	getCostCenterReportProcedure,
	getAccountingDashboardProcedure,
} from "./procedures/journal-entries";

import {
	getClientStatementProcedure,
	getVendorStatementProcedure,
} from "./procedures/statements";

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
		getLedger: getAccountLedgerProcedure,
	},

	// Opening Balances
	openingBalances: {
		get: getOpeningBalancesProcedure,
		save: saveOpeningBalancesProcedure,
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
		bulkPost: bulkPostJournalEntriesProcedure,
		postAllDrafts: postAllDraftsProcedure,
		findByReference: findJournalEntryByReferenceProcedure,
	},

	// Reports
	reports: {
		trialBalance: getTrialBalanceProcedure,
		balanceSheet: getBalanceSheetProcedure,
		incomeStatement: getJournalIncomeStatementProcedure,
		costCenter: getCostCenterReportProcedure,
	},

	// Dashboard
	dashboard: getAccountingDashboardProcedure,

	// Statements
	statements: {
		client: getClientStatementProcedure,
		vendor: getVendorStatementProcedure,
	},

	// Accounting Periods
	periods: {
		list: listPeriodsProcedure,
		generate: generatePeriodsProcedure,
		close: closePeriodProcedure,
		reopen: reopenPeriodProcedure,
	},
};
