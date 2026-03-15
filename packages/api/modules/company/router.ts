// Company Management Module Router
// Includes: Employees, Expenses, Assets, Dashboard

import {
	listEmployees,
	getEmployeeByIdProcedure,
	createEmployeeProcedure,
	updateEmployeeProcedure,
	terminateEmployeeProcedure,
	getEmployeeSummaryProcedure,
} from "./procedures/employees";

import {
	listEmployeeAssignments,
	listProjectAssignments,
	createAssignmentProcedure,
	updateAssignmentProcedure,
	removeAssignmentProcedure,
} from "./procedures/employee-assignments";

import { getEmployeeHistoryProcedure } from "./procedures/employee-history";

import {
	listCompanyExpenses,
	getCompanyExpenseByIdProcedure,
	createCompanyExpenseProcedure,
	updateCompanyExpenseProcedure,
	deactivateCompanyExpenseProcedure,
	getCompanyExpenseSummaryProcedure,
	getCompanyExpenseDashboardDataProcedure,
	getUpcomingPaymentsProcedure,
} from "./procedures/company-expenses";

import {
	listExpensePayments,
	createExpensePaymentProcedure,
	markPaymentPaidProcedure,
	updateExpensePaymentProcedure,
	deleteExpensePaymentProcedure,
	generateMonthlyPaymentsProcedure,
} from "./procedures/expense-payments";

import {
	listExpenseAllocations,
	setExpenseAllocationsProcedure,
	getProjectAllocatedExpensesProcedure,
} from "./procedures/expense-allocations";

import {
	listAssets,
	getAssetByIdProcedure,
	createAssetProcedure,
	updateAssetProcedure,
	deactivateAssetProcedure,
	assignAssetToProjectProcedure,
	returnAssetProcedure,
	getAssetSummaryProcedure,
	getExpiringInsuranceProcedure,
} from "./procedures/company-assets";

import {
	listPayrollRuns,
	getPayrollRun,
	createPayrollRunProcedure,
	populatePayrollRunProcedure,
	approvePayrollRunProcedure,
	cancelPayrollRunProcedure,
	payrollSummaryProcedure,
	updatePayrollRunItemProcedure,
	deletePayrollRunItemProcedure,
} from "./procedures/payroll";

import {
	listExpenseRuns,
	getExpenseRunByIdProcedure,
	createExpenseRunProcedure,
	populateExpenseRunProcedure,
	postExpenseRunProcedure,
	cancelExpenseRunProcedure,
	expenseRunSummaryProcedure,
	updateExpenseRunItemProcedure,
	deleteExpenseRunItemProcedure,
} from "./procedures/expense-runs";

import {
	listLeaveTypesProcedure,
	createLeaveTypeProcedure,
	updateLeaveTypeProcedure,
	deleteLeaveTypeProcedure,
	seedDefaultLeaveTypesProcedure,
} from "./procedures/leaves/leave-types";

import {
	listLeaveBalancesProcedure,
	adjustLeaveBalanceProcedure,
} from "./procedures/leaves/leave-balances";

import {
	listLeaveRequestsProcedure,
	createLeaveRequestProcedure,
	approveLeaveRequestProcedure,
	rejectLeaveRequestProcedure,
	cancelLeaveRequestProcedure,
} from "./procedures/leaves/leave-requests";

import { leaveDashboardProcedure } from "./procedures/leaves/leave-dashboard";

import { getCompanyDashboard } from "./procedures/dashboard";

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

export const companyRouter = {
	// Dashboard
	dashboard: getCompanyDashboard,

	// Employees
	employees: {
		list: listEmployees,
		getById: getEmployeeByIdProcedure,
		create: createEmployeeProcedure,
		update: updateEmployeeProcedure,
		terminate: terminateEmployeeProcedure,
		getSummary: getEmployeeSummaryProcedure,
		history: getEmployeeHistoryProcedure,
		// Assignments
		assignments: {
			list: listEmployeeAssignments,
			byProject: listProjectAssignments,
			assign: createAssignmentProcedure,
			update: updateAssignmentProcedure,
			remove: removeAssignmentProcedure,
		},
	},

	// Expenses
	expenses: {
		list: listCompanyExpenses,
		getById: getCompanyExpenseByIdProcedure,
		create: createCompanyExpenseProcedure,
		update: updateCompanyExpenseProcedure,
		deactivate: deactivateCompanyExpenseProcedure,
		getSummary: getCompanyExpenseSummaryProcedure,
		getDashboardData: getCompanyExpenseDashboardDataProcedure,
		getUpcoming: getUpcomingPaymentsProcedure,
		// Payments
		payments: {
			list: listExpensePayments,
			create: createExpensePaymentProcedure,
			markPaid: markPaymentPaidProcedure,
			update: updateExpensePaymentProcedure,
			delete: deleteExpensePaymentProcedure,
			generateMonthly: generateMonthlyPaymentsProcedure,
		},
		// Allocations
		allocations: {
			list: listExpenseAllocations,
			set: setExpenseAllocationsProcedure,
			byProject: getProjectAllocatedExpensesProcedure,
		},
	},

	// Payroll
	payroll: {
		list: listPayrollRuns,
		getById: getPayrollRun,
		create: createPayrollRunProcedure,
		populate: populatePayrollRunProcedure,
		approve: approvePayrollRunProcedure,
		cancel: cancelPayrollRunProcedure,
		summary: payrollSummaryProcedure,
		updateItem: updatePayrollRunItemProcedure,
		deleteItem: deletePayrollRunItemProcedure,
	},

	// Expense Runs - ترحيل المصروفات
	expenseRuns: {
		list: listExpenseRuns,
		getById: getExpenseRunByIdProcedure,
		create: createExpenseRunProcedure,
		populate: populateExpenseRunProcedure,
		post: postExpenseRunProcedure,
		cancel: cancelExpenseRunProcedure,
		summary: expenseRunSummaryProcedure,
		updateItem: updateExpenseRunItemProcedure,
		deleteItem: deleteExpenseRunItemProcedure,
	},

	// Leaves - إدارة الإجازات
	leaves: {
		dashboard: leaveDashboardProcedure,
		types: {
			list: listLeaveTypesProcedure,
			create: createLeaveTypeProcedure,
			update: updateLeaveTypeProcedure,
			delete: deleteLeaveTypeProcedure,
			seedDefaults: seedDefaultLeaveTypesProcedure,
		},
		balances: {
			list: listLeaveBalancesProcedure,
			adjust: adjustLeaveBalanceProcedure,
		},
		requests: {
			list: listLeaveRequestsProcedure,
			create: createLeaveRequestProcedure,
			approve: approveLeaveRequestProcedure,
			reject: rejectLeaveRequestProcedure,
			cancel: cancelLeaveRequestProcedure,
		},
	},

	// Templates (القوالب)
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

	// Assets
	assets: {
		list: listAssets,
		getById: getAssetByIdProcedure,
		create: createAssetProcedure,
		update: updateAssetProcedure,
		retire: deactivateAssetProcedure,
		assignToProject: assignAssetToProjectProcedure,
		returnToWarehouse: returnAssetProcedure,
		getSummary: getAssetSummaryProcedure,
		getExpiringInsurance: getExpiringInsuranceProcedure,
	},
};
