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

import { getProjectProfitabilityProcedure } from "./procedures/profitability";
import { getCashFlowReportProcedure } from "./procedures/cash-flow";

import {
	getAgedReceivablesProcedure,
	getAgedPayablesProcedure,
	getVATReportProcedure,
	getIncomeStatementProcedure,
} from "./procedures/accounting-reports";

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
	getBankLinesForReconciliationProcedure,
	createReconciliationProcedure,
	listReconciliationsProcedure,
} from "./procedures/bank-reconciliation";

import {
	listOrgPayments,
	getOrgPayment,
	createOrgPaymentProcedure,
	updateOrgPaymentProcedure,
	deleteOrgPaymentProcedure,
} from "./procedures/payments";

import {
	listReceiptVouchers,
	getReceiptVoucher,
	createReceiptVoucher,
	updateReceiptVoucher,
	issueReceiptVoucher,
	cancelReceiptVoucher,
	printReceiptVoucher,
	getReceiptVoucherSummary,
} from "./procedures/receipt-vouchers";

import {
	listPaymentVouchers,
	getPaymentVoucher,
	createPaymentVoucher,
	updatePaymentVoucher,
	submitPaymentVoucher,
	approvePaymentVoucher,
	rejectPaymentVoucher,
	cancelPaymentVoucher,
	printPaymentVoucher,
	getPaymentVoucherSummary,
} from "./procedures/payment-vouchers";

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

import { createFinanceLogoUploadUrl } from "./procedures/create-finance-logo-upload-url";

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

	// Reports
	reports: {
		revenueByPeriod: getFinanceRevenueByPeriod,
		revenueByProject: getFinanceRevenueByProject,
		revenueByClient: getFinanceRevenueByClient,
		conversionRate: getFinanceConversionRate,
		quotationStats: getFinanceQuotationStats,
		invoiceStats: getFinanceInvoiceStats,
		profitability: getProjectProfitabilityProcedure,
		cashFlow: getCashFlowReportProcedure,
	},

	// Accounting Reports (التقارير المحاسبية)
	accountingReports: {
		agedReceivables: getAgedReceivablesProcedure,
		agedPayables: getAgedPayablesProcedure,
		vatReport: getVATReportProcedure,
		incomeStatement: getIncomeStatementProcedure,
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
		reconciliation: {
			getLines: getBankLinesForReconciliationProcedure,
			create: createReconciliationProcedure,
			history: listReconciliationsProcedure,
		},
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

	// Receipt Vouchers (سندات القبض)
	receipts: {
		list: listReceiptVouchers,
		getById: getReceiptVoucher,
		create: createReceiptVoucher,
		update: updateReceiptVoucher,
		issue: issueReceiptVoucher,
		cancel: cancelReceiptVoucher,
		print: printReceiptVoucher,
		getSummary: getReceiptVoucherSummary,
	},

	// Payment Vouchers / Disbursements (سندات الصرف)
	disbursements: {
		list: listPaymentVouchers,
		getById: getPaymentVoucher,
		create: createPaymentVoucher,
		update: updatePaymentVoucher,
		submit: submitPaymentVoucher,
		approve: approvePaymentVoucher,
		reject: rejectPaymentVoucher,
		cancel: cancelPaymentVoucher,
		print: printPaymentVoucher,
		getSummary: getPaymentVoucherSummary,
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
		createLogoUploadUrl: createFinanceLogoUploadUrl,
	},
};
