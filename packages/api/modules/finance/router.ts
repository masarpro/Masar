// Finance Module Router
// Includes: Clients, Invoices, Open Documents, Templates, Reports
// + Banks, Expenses, Payments, Transfers (Organization Finance)

import { listClients } from "./procedures/list-clients";
import { createClientProcedure } from "./procedures/create-client";
import {
	updateClientProcedure,
	deleteClientProcedure,
	getClient,
	listClientContacts,
	createClientContactProcedure,
	updateClientContactProcedure,
	deleteClientContactProcedure,
	setClientContactAsPrimaryProcedure,
} from "./procedures/update-client";

import { listInvoices, getInvoice } from "./procedures/list-invoices";
import {
	createInvoiceProcedure,
	updateInvoiceProcedure,
	updateInvoiceItemsProcedure,
	updateInvoiceStatusProcedure,
	convertToTaxInvoiceProcedure,
	addInvoicePaymentProcedure,
	deleteInvoicePaymentProcedure,
	deleteInvoiceProcedure,
	issueInvoiceProcedure,
	duplicateInvoiceProcedure,
	createCreditNoteProcedure,
	getInvoiceActivityProcedure,
	updateInvoiceNotesProcedure,
} from "./procedures/create-invoice";

import {
	listOpenDocuments,
	getOpenDocument,
	createOpenDocumentProcedure,
	updateOpenDocumentProcedure,
	deleteOpenDocumentProcedure,
} from "./procedures/open-documents";

import {
	listFinanceTemplates,
	getFinanceTemplate,
	getDefaultTemplate,
	createFinanceTemplateProcedure,
	updateFinanceTemplateProcedure,
	setDefaultTemplateProcedure,
	deleteFinanceTemplateProcedure,
	seedDefaultTemplates,
} from "./procedures/templates";

import {
	getFinanceDashboard,
	getFinanceOutstanding,
	getFinanceRevenueByPeriod,
	getFinanceRevenueByProject,
	getFinanceRevenueByClient,
	getFinanceConversionRate,
	getFinanceQuotationStats,
	getFinanceInvoiceStats,
	getProjectFinance,
} from "./procedures/dashboard";

// Organization Finance (Banks, Expenses, Payments, Transfers)
import {
	listBankAccounts,
	getBankAccount,
	getBalancesSummary,
	createBankAccountProcedure,
	updateBankAccountProcedure,
	setDefaultBankAccountProcedure,
	deleteBankAccountProcedure,
	reconcileBankAccountProcedure,
} from "./procedures/banks";

import {
	listExpenses,
	getExpense,
	getExpensesSummary,
	createExpenseProcedure,
	updateExpenseProcedure,
	deleteExpenseProcedure,
	payExpenseProcedure,
	cancelExpenseProcedure,
	listExpensesWithSubcontracts,
} from "./procedures/expenses";

import {
	listOrgPayments,
	getOrgPayment,
	createOrgPaymentProcedure,
	updateOrgPaymentProcedure,
	deleteOrgPaymentProcedure,
} from "./procedures/payments";

import {
	listTransfers,
	getTransfer,
	createTransferProcedure,
	cancelTransferProcedure,
} from "./procedures/transfers";

import { getOrgFinanceDashboardProcedure } from "./procedures/org-finance-dashboard";

import {
	getOrgFinanceSettingsProcedure,
	updateOrgFinanceSettingsProcedure,
} from "./procedures/org-finance-settings";

export const financeRouter = {
	// Dashboard
	dashboard: getFinanceDashboard,
	outstanding: getFinanceOutstanding,

	// Clients
	clients: {
		list: listClients,
		getById: getClient,
		create: createClientProcedure,
		update: updateClientProcedure,
		delete: deleteClientProcedure,
		// Contacts
		contacts: {
			list: listClientContacts,
			create: createClientContactProcedure,
			update: updateClientContactProcedure,
			delete: deleteClientContactProcedure,
			setPrimary: setClientContactAsPrimaryProcedure,
		},
	},

	// Invoices
	invoices: {
		list: listInvoices,
		getById: getInvoice,
		create: createInvoiceProcedure,
		update: updateInvoiceProcedure,
		updateItems: updateInvoiceItemsProcedure,
		updateStatus: updateInvoiceStatusProcedure,
		convertToTax: convertToTaxInvoiceProcedure,
		addPayment: addInvoicePaymentProcedure,
		deletePayment: deleteInvoicePaymentProcedure,
		delete: deleteInvoiceProcedure,
		issue: issueInvoiceProcedure,
		duplicate: duplicateInvoiceProcedure,
		createCreditNote: createCreditNoteProcedure,
		updateNotes: updateInvoiceNotesProcedure,
		getActivity: getInvoiceActivityProcedure,
	},

	// Open Documents
	documents: {
		list: listOpenDocuments,
		getById: getOpenDocument,
		create: createOpenDocumentProcedure,
		update: updateOpenDocumentProcedure,
		delete: deleteOpenDocumentProcedure,
	},

	// Templates
	templates: {
		list: listFinanceTemplates,
		getById: getFinanceTemplate,
		getDefault: getDefaultTemplate,
		create: createFinanceTemplateProcedure,
		update: updateFinanceTemplateProcedure,
		setDefault: setDefaultTemplateProcedure,
		delete: deleteFinanceTemplateProcedure,
		seed: seedDefaultTemplates,
	},

	// Reports
	reports: {
		revenueByPeriod: getFinanceRevenueByPeriod,
		revenueByProject: getFinanceRevenueByProject,
		revenueByClient: getFinanceRevenueByClient,
		conversionRate: getFinanceConversionRate,
		quotationStats: getFinanceQuotationStats,
		invoiceStats: getFinanceInvoiceStats,
	},

	// Project Finance (integration)
	projectFinance: getProjectFinance,

	// ═══════════════════════════════════════════════════════════════════════════
	// Organization Finance - المالية المؤسسية
	// ═══════════════════════════════════════════════════════════════════════════

	// Bank Accounts (الحسابات البنكية)
	banks: {
		list: listBankAccounts,
		getById: getBankAccount,
		getSummary: getBalancesSummary,
		reconcile: reconcileBankAccountProcedure,
		create: createBankAccountProcedure,
		update: updateBankAccountProcedure,
		setDefault: setDefaultBankAccountProcedure,
		delete: deleteBankAccountProcedure,
	},

	// Expenses (المصروفات)
	expenses: {
		list: listExpenses,
		listUnified: listExpensesWithSubcontracts,
		getById: getExpense,
		getSummary: getExpensesSummary,
		create: createExpenseProcedure,
		update: updateExpenseProcedure,
		delete: deleteExpenseProcedure,
		pay: payExpenseProcedure,
		cancel: cancelExpenseProcedure,
	},

	// Payments / Receipts (المقبوضات / سندات القبض)
	orgPayments: {
		list: listOrgPayments,
		getById: getOrgPayment,
		create: createOrgPaymentProcedure,
		update: updateOrgPaymentProcedure,
		delete: deleteOrgPaymentProcedure,
	},

	// Transfers (التحويلات)
	transfers: {
		list: listTransfers,
		getById: getTransfer,
		create: createTransferProcedure,
		cancel: cancelTransferProcedure,
	},

	// Organization Finance Dashboard
	orgDashboard: getOrgFinanceDashboardProcedure,

	// Organization Finance Settings (إعدادات المالية)
	settings: {
		get: getOrgFinanceSettingsProcedure,
		update: updateOrgFinanceSettingsProcedure,
	},
};
