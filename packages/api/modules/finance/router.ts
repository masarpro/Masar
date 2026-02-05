// Finance Module Router
// Includes: Clients, Quotations, Invoices, Open Documents, Templates, Reports
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

import { listQuotations, getQuotation } from "./procedures/list-quotations";
import {
	createQuotationProcedure,
	updateQuotationProcedure,
	updateQuotationItemsProcedure,
	updateQuotationStatusProcedure,
	deleteQuotationProcedure,
	convertQuotationToInvoiceProcedure,
} from "./procedures/create-quotation";

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
} from "./procedures/banks";

import {
	listExpenses,
	getExpense,
	getExpensesSummary,
	createExpenseProcedure,
	updateExpenseProcedure,
	deleteExpenseProcedure,
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

	// Quotations
	quotations: {
		list: listQuotations,
		getById: getQuotation,
		create: createQuotationProcedure,
		update: updateQuotationProcedure,
		updateItems: updateQuotationItemsProcedure,
		updateStatus: updateQuotationStatusProcedure,
		delete: deleteQuotationProcedure,
		convertToInvoice: convertQuotationToInvoiceProcedure,
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
		create: createBankAccountProcedure,
		update: updateBankAccountProcedure,
		setDefault: setDefaultBankAccountProcedure,
		delete: deleteBankAccountProcedure,
	},

	// Expenses (المصروفات)
	expenses: {
		list: listExpenses,
		getById: getExpense,
		getSummary: getExpensesSummary,
		create: createExpenseProcedure,
		update: updateExpenseProcedure,
		delete: deleteExpenseProcedure,
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
