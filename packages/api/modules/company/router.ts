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

import {
	listCompanyExpenses,
	getCompanyExpenseByIdProcedure,
	createCompanyExpenseProcedure,
	updateCompanyExpenseProcedure,
	deactivateCompanyExpenseProcedure,
	getCompanyExpenseSummaryProcedure,
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

import { getCompanyDashboard } from "./procedures/dashboard";

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
