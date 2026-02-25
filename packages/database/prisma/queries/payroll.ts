import { db } from "../client";
import type { PayrollRunStatus } from "../generated/client";
import { generateExpenseNumber } from "./org-finance";

// ═══════════════════════════════════════════════════════════════════════════
// PAYROLL RUN QUERIES - استعلامات دورات الرواتب
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate payroll run number (PAY-YYYY-MM)
 */
export async function generatePayrollRunNo(
	organizationId: string,
	month: number,
	year: number,
): Promise<string> {
	const monthStr = String(month).padStart(2, "0");
	return `PAY-${year}-${monthStr}`;
}

/**
 * Create a DRAFT payroll run for a given month/year
 */
export async function createPayrollRun(data: {
	organizationId: string;
	createdById: string;
	month: number;
	year: number;
	notes?: string;
}) {
	const runNo = await generatePayrollRunNo(
		data.organizationId,
		data.month,
		data.year,
	);

	return db.payrollRun.create({
		data: {
			organizationId: data.organizationId,
			createdById: data.createdById,
			runNo,
			month: data.month,
			year: data.year,
			status: "DRAFT",
			notes: data.notes,
		},
	});
}

/**
 * List payroll runs for an organization
 */
export async function getPayrollRuns(
	organizationId: string,
	options?: {
		status?: PayrollRunStatus;
		year?: number;
		limit?: number;
		offset?: number;
	},
) {
	const where: Record<string, unknown> = { organizationId };

	if (options?.status) where.status = options.status;
	if (options?.year) where.year = options.year;

	const [runs, total] = await Promise.all([
		db.payrollRun.findMany({
			where,
			include: {
				createdBy: { select: { id: true, name: true } },
				approvedBy: { select: { id: true, name: true } },
				_count: { select: { items: true } },
			},
			orderBy: [{ year: "desc" }, { month: "desc" }],
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.payrollRun.count({ where }),
	]);

	return { runs, total };
}

/**
 * Get a single payroll run by ID with items and employees
 */
export async function getPayrollRunById(id: string, organizationId: string) {
	return db.payrollRun.findFirst({
		where: { id, organizationId },
		include: {
			createdBy: { select: { id: true, name: true } },
			approvedBy: { select: { id: true, name: true } },
			items: {
				include: {
					employee: {
						select: {
							id: true,
							name: true,
							employeeNo: true,
							type: true,
							status: true,
						},
					},
					financeExpense: {
						select: {
							id: true,
							expenseNo: true,
							status: true,
							paidAmount: true,
							amount: true,
						},
					},
				},
				orderBy: { employee: { name: "asc" } },
			},
		},
	});
}

/**
 * Populate a DRAFT payroll run with ACTIVE employees
 */
export async function populatePayrollRun(runId: string, organizationId: string) {
	const run = await db.payrollRun.findFirst({
		where: { id: runId, organizationId, status: "DRAFT" },
	});

	if (!run) {
		throw new Error("Payroll run not found or not in DRAFT status");
	}

	// Get all active employees
	const employees = await db.employee.findMany({
		where: { organizationId, status: "ACTIVE" },
		select: {
			id: true,
			baseSalary: true,
			housingAllowance: true,
			transportAllowance: true,
			otherAllowances: true,
			gosiSubscription: true,
		},
	});

	if (employees.length === 0) {
		throw new Error("No active employees found");
	}

	return db.$transaction(async (tx) => {
		// Delete existing items first (re-populate)
		await tx.payrollRunItem.deleteMany({ where: { payrollRunId: runId } });

		// Compute per-employee salary breakdown (safe for single-employee magnitudes)
		const items = employees.map((emp) => {
			const base = Number(emp.baseSalary);
			const housing = Number(emp.housingAllowance);
			const transport = Number(emp.transportAllowance);
			const other = Number(emp.otherAllowances);
			const gosi = Number(emp.gosiSubscription);
			const net = base + housing + transport + other - gosi;

			return {
				payrollRunId: runId,
				employeeId: emp.id,
				baseSalary: base,
				housingAllowance: housing,
				transportAllowance: transport,
				otherAllowances: other,
				gosiDeduction: gosi,
				otherDeductions: 0,
				netSalary: net,
			};
		});

		await tx.payrollRunItem.createMany({ data: items });

		// DB-side aggregation avoids JS floating-point drift across many employees
		const totals = await tx.payrollRunItem.aggregate({
			where: { payrollRunId: runId },
			_sum: {
				baseSalary: true,
				housingAllowance: true,
				transportAllowance: true,
				otherAllowances: true,
				gosiDeduction: true,
				otherDeductions: true,
				netSalary: true,
			},
		});

		const totalBaseSalary = Number(totals._sum.baseSalary ?? 0);
		const totalAllowances = Number(totals._sum.housingAllowance ?? 0)
			+ Number(totals._sum.transportAllowance ?? 0)
			+ Number(totals._sum.otherAllowances ?? 0);
		const totalDeductions = Number(totals._sum.gosiDeduction ?? 0)
			+ Number(totals._sum.otherDeductions ?? 0);
		const totalNetSalary = Number(totals._sum.netSalary ?? 0);

		// Update run totals
		return tx.payrollRun.update({
			where: { id: runId },
			data: {
				totalBaseSalary,
				totalAllowances,
				totalDeductions,
				totalNetSalary,
				employeeCount: employees.length,
			},
			include: {
				items: {
					include: {
						employee: {
							select: { id: true, name: true, employeeNo: true, type: true },
						},
					},
				},
			},
		});
	});
}

/**
 * Approve a payroll run → create PENDING FinanceExpenses (one per employee)
 */
export async function approvePayrollRun(
	runId: string,
	data: {
		organizationId: string;
		approvedById: string;
	},
) {
	const run = await db.payrollRun.findFirst({
		where: { id: runId, organizationId: data.organizationId, status: "DRAFT" },
		include: {
			items: {
				include: {
					employee: { select: { id: true, name: true, employeeNo: true } },
				},
			},
		},
	});

	if (!run) {
		throw new Error("Payroll run not found or not in DRAFT status");
	}

	if (run.items.length === 0) {
		throw new Error("Cannot approve empty payroll run. Populate first.");
	}

	return db.$transaction(async (tx) => {
		// Create a PENDING FinanceExpense for each employee
		for (const item of run.items) {
			const expenseNo = await generateExpenseNumber(data.organizationId);

			const expense = await tx.financeExpense.create({
				data: {
					organizationId: data.organizationId,
					createdById: data.approvedById,
					expenseNo,
					category: "SALARIES",
					description: `راتب ${item.employee.name} - ${run.month}/${run.year}`,
					amount: Number(item.netSalary),
					date: new Date(run.year, run.month - 1, 28), // end of month approx
					status: "PENDING",
					sourceType: "FACILITY_PAYROLL",
					sourceId: item.id,
					paidAmount: 0,
					dueDate: new Date(run.year, run.month - 1, 28),
					paymentMethod: "BANK_TRANSFER",
					notes: `دورة رواتب ${run.runNo} - ${item.employee.employeeNo ?? ""}`,
				},
			});

			await tx.payrollRunItem.update({
				where: { id: item.id },
				data: { financeExpenseId: expense.id },
			});
		}

		// Update run status
		return tx.payrollRun.update({
			where: { id: runId },
			data: {
				status: "APPROVED",
				approvedById: data.approvedById,
				approvedAt: new Date(),
			},
			include: {
				items: {
					include: {
						employee: { select: { id: true, name: true, employeeNo: true } },
						financeExpense: { select: { id: true, expenseNo: true, status: true } },
					},
				},
			},
		});
	});
}

/**
 * Cancel a payroll run + cancel linked PENDING FinanceExpenses
 */
export async function cancelPayrollRun(runId: string, organizationId: string) {
	const run = await db.payrollRun.findFirst({
		where: {
			id: runId,
			organizationId,
			status: { in: ["DRAFT", "APPROVED"] },
		},
		include: {
			items: { select: { financeExpenseId: true } },
		},
	});

	if (!run) {
		throw new Error("Payroll run not found or cannot be cancelled");
	}

	return db.$transaction(async (tx) => {
		// Cancel linked PENDING finance expenses
		const expenseIds = run.items
			.map((item) => item.financeExpenseId)
			.filter((id): id is string => id !== null);

		if (expenseIds.length > 0) {
			await tx.financeExpense.updateMany({
				where: {
					id: { in: expenseIds },
					status: "PENDING",
				},
				data: { status: "CANCELLED" },
			});
		}

		return tx.payrollRun.update({
			where: { id: runId },
			data: { status: "CANCELLED" },
		});
	});
}

/**
 * Recalculate payroll run totals from items.
 * Uses DB-side aggregation to avoid JS floating-point drift across many employees.
 */
async function recalculatePayrollRunTotals(runId: string) {
	const [totals, itemCount] = await Promise.all([
		db.payrollRunItem.aggregate({
			where: { payrollRunId: runId },
			_sum: {
				baseSalary: true,
				housingAllowance: true,
				transportAllowance: true,
				otherAllowances: true,
				gosiDeduction: true,
				otherDeductions: true,
				netSalary: true,
			},
		}),
		db.payrollRunItem.count({ where: { payrollRunId: runId } }),
	]);

	const totalBaseSalary = Number(totals._sum.baseSalary ?? 0);
	const totalAllowances = Number(totals._sum.housingAllowance ?? 0)
		+ Number(totals._sum.transportAllowance ?? 0)
		+ Number(totals._sum.otherAllowances ?? 0);
	const totalDeductions = Number(totals._sum.gosiDeduction ?? 0)
		+ Number(totals._sum.otherDeductions ?? 0);
	const totalNetSalary = Number(totals._sum.netSalary ?? 0);

	await db.payrollRun.update({
		where: { id: runId },
		data: {
			totalBaseSalary,
			totalAllowances,
			totalDeductions,
			totalNetSalary,
			employeeCount: itemCount,
		},
	});
}

/**
 * Update a payroll run item (DRAFT only)
 */
export async function updatePayrollRunItem(
	itemId: string,
	organizationId: string,
	data: {
		baseSalary?: number;
		housingAllowance?: number;
		transportAllowance?: number;
		otherAllowances?: number;
		gosiDeduction?: number;
		otherDeductions?: number;
	},
) {
	const item = await db.payrollRunItem.findFirst({
		where: { id: itemId },
		include: {
			payrollRun: { select: { id: true, organizationId: true, status: true } },
		},
	});

	if (!item || item.payrollRun.organizationId !== organizationId) {
		throw new Error("Payroll item not found");
	}

	if (item.payrollRun.status !== "DRAFT") {
		throw new Error("Can only edit payroll items in DRAFT status");
	}

	const base = data.baseSalary ?? Number(item.baseSalary);
	const housing = data.housingAllowance ?? Number(item.housingAllowance);
	const transport = data.transportAllowance ?? Number(item.transportAllowance);
	const other = data.otherAllowances ?? Number(item.otherAllowances);
	const gosi = data.gosiDeduction ?? Number(item.gosiDeduction);
	const otherDed = data.otherDeductions ?? Number(item.otherDeductions);
	const net = base + housing + transport + other - gosi - otherDed;

	await db.payrollRunItem.update({
		where: { id: itemId },
		data: {
			baseSalary: base,
			housingAllowance: housing,
			transportAllowance: transport,
			otherAllowances: other,
			gosiDeduction: gosi,
			otherDeductions: otherDed,
			netSalary: net,
		},
	});

	await recalculatePayrollRunTotals(item.payrollRunId);

	return getPayrollRunById(item.payrollRunId, organizationId);
}

/**
 * Delete a payroll run item (DRAFT only)
 */
export async function deletePayrollRunItem(itemId: string, organizationId: string) {
	const item = await db.payrollRunItem.findFirst({
		where: { id: itemId },
		include: {
			payrollRun: { select: { id: true, organizationId: true, status: true } },
		},
	});

	if (!item || item.payrollRun.organizationId !== organizationId) {
		throw new Error("Payroll item not found");
	}

	if (item.payrollRun.status !== "DRAFT") {
		throw new Error("Can only delete payroll items in DRAFT status");
	}

	await db.payrollRunItem.delete({ where: { id: itemId } });
	await recalculatePayrollRunTotals(item.payrollRunId);

	return getPayrollRunById(item.payrollRunId, organizationId);
}

/**
 * Get payroll summary for an organization (current month status)
 */
export async function getPayrollSummary(organizationId: string) {
	const now = new Date();
	const currentMonth = now.getMonth() + 1;
	const currentYear = now.getFullYear();

	const [currentRun, totalRuns, totalPaid] = await Promise.all([
		db.payrollRun.findFirst({
			where: { organizationId, month: currentMonth, year: currentYear },
			select: {
				id: true,
				runNo: true,
				status: true,
				totalNetSalary: true,
				employeeCount: true,
			},
		}),
		db.payrollRun.count({ where: { organizationId } }),
		db.payrollRun.count({ where: { organizationId, status: "PAID" } }),
	]);

	return {
		currentMonth: {
			run: currentRun,
			month: currentMonth,
			year: currentYear,
		},
		totalRuns,
		totalPaid,
	};
}
