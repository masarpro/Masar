import { db } from "../client";
import type { ExpenseRunStatus, CompanyExpenseCategory } from "../generated/client";
import { generateExpenseNumber } from "./org-finance";
import { mapCompanyToOrgCategory } from "./company";

// ═══════════════════════════════════════════════════════════════════════════
// EXPENSE RUN QUERIES - استعلامات دورات ترحيل المصروفات
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate expense run number (FEXP-YYYY-MM)
 */
export async function generateExpenseRunNo(
	organizationId: string,
	month: number,
	year: number,
): Promise<string> {
	const monthStr = String(month).padStart(2, "0");
	return `FEXP-${year}-${monthStr}`;
}

/**
 * Create a DRAFT expense run for a given month/year
 */
export async function createExpenseRun(data: {
	organizationId: string;
	createdById: string;
	month: number;
	year: number;
	notes?: string;
}) {
	const runNo = await generateExpenseRunNo(
		data.organizationId,
		data.month,
		data.year,
	);

	return db.companyExpenseRun.create({
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
 * List expense runs for an organization
 */
export async function getExpenseRuns(
	organizationId: string,
	options?: {
		status?: ExpenseRunStatus;
		year?: number;
		limit?: number;
		offset?: number;
	},
) {
	const where: Record<string, unknown> = { organizationId };

	if (options?.status) where.status = options.status;
	if (options?.year) where.year = options.year;

	const [runs, total] = await Promise.all([
		db.companyExpenseRun.findMany({
			where,
			include: {
				createdBy: { select: { id: true, name: true } },
				postedBy: { select: { id: true, name: true } },
				_count: { select: { items: true } },
			},
			orderBy: [{ year: "desc" }, { month: "desc" }],
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.companyExpenseRun.count({ where }),
	]);

	return { runs, total };
}

/**
 * Get a single expense run by ID with items and details
 */
export async function getExpenseRunById(id: string, organizationId: string) {
	return db.companyExpenseRun.findFirst({
		where: { id, organizationId },
		include: {
			createdBy: { select: { id: true, name: true } },
			postedBy: { select: { id: true, name: true } },
			items: {
				include: {
					companyExpense: {
						select: {
							id: true,
							name: true,
							category: true,
							vendor: true,
							amount: true,
							recurrence: true,
							isActive: true,
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
				orderBy: { name: "asc" },
			},
		},
	});
}

/**
 * Populate a DRAFT expense run with active company expenses
 */
export async function populateExpenseRun(runId: string, organizationId: string) {
	const run = await db.companyExpenseRun.findFirst({
		where: { id: runId, organizationId, status: "DRAFT" },
	});

	if (!run) {
		throw new Error("Expense run not found or not in DRAFT status");
	}

	// Calculate start/end of the run's month
	const startOfMonth = new Date(run.year, run.month - 1, 1);
	const endOfMonth = new Date(run.year, run.month, 0); // last day of month

	// Get all active recurring company expenses valid for this month
	const expenses = await db.companyExpense.findMany({
		where: {
			organizationId,
			isActive: true,
			recurrence: { not: "ONE_TIME" },
			startDate: { lte: endOfMonth },
			OR: [
				{ endDate: null },
				{ endDate: { gte: startOfMonth } },
			],
		},
		select: {
			id: true,
			name: true,
			category: true,
			vendor: true,
			amount: true,
		},
	});

	if (expenses.length === 0) {
		throw new Error("No active recurring expenses found for this period");
	}

	return db.$transaction(async (tx) => {
		// Delete existing items first (re-populate)
		await tx.companyExpenseRunItem.deleteMany({ where: { expenseRunId: runId } });

		// Create items from active expenses
		const items = expenses.map((exp) => ({
			expenseRunId: runId,
			companyExpenseId: exp.id,
			name: exp.name,
			category: exp.category,
			vendor: exp.vendor,
			originalAmount: Number(exp.amount),
			amount: Number(exp.amount),
		}));

		await tx.companyExpenseRunItem.createMany({ data: items });

		// DB-side aggregation
		const totals = await tx.companyExpenseRunItem.aggregate({
			where: { expenseRunId: runId },
			_sum: { amount: true },
			_count: true,
		});

		const totalAmount = Number(totals._sum.amount ?? 0);

		// Update run totals
		return tx.companyExpenseRun.update({
			where: { id: runId },
			data: {
				totalAmount,
				itemCount: totals._count,
			},
			include: {
				items: {
					include: {
						companyExpense: {
							select: { id: true, name: true, category: true, vendor: true },
						},
					},
				},
			},
		});
	});
}

/**
 * Post an expense run → create PENDING FinanceExpenses (one per item)
 */
export async function postExpenseRun(
	runId: string,
	data: {
		organizationId: string;
		postedById: string;
	},
) {
	const run = await db.companyExpenseRun.findFirst({
		where: { id: runId, organizationId: data.organizationId, status: "DRAFT" },
		include: {
			items: {
				include: {
					companyExpense: { select: { id: true, name: true, category: true, vendor: true } },
				},
			},
		},
	});

	if (!run) {
		throw new Error("Expense run not found or not in DRAFT status");
	}

	if (run.items.length === 0) {
		throw new Error("Cannot post empty expense run. Populate first.");
	}

	return db.$transaction(async (tx) => {
		// Create a PENDING FinanceExpense for each item
		for (const item of run.items) {
			const expenseNo = await generateExpenseNumber(data.organizationId);
			const orgCategory = mapCompanyToOrgCategory(
				item.companyExpense.category as CompanyExpenseCategory,
			);

			const expense = await tx.financeExpense.create({
				data: {
					organizationId: data.organizationId,
					createdById: data.postedById,
					expenseNo,
					category: orgCategory,
					description: `${item.name} - ${run.month}/${run.year}`,
					amount: Number(item.amount),
					date: new Date(run.year, run.month - 1, 28),
					status: "PENDING",
					sourceType: "FACILITY_RECURRING",
					sourceId: item.id,
					paidAmount: 0,
					dueDate: new Date(run.year, run.month - 1, 28),
					paymentMethod: "BANK_TRANSFER",
					vendorName: item.vendor,
					notes: `دورة مصروفات ${run.runNo} - ${item.name}`,
				},
			});

			await tx.companyExpenseRunItem.update({
				where: { id: item.id },
				data: { financeExpenseId: expense.id },
			});
		}

		// Update run status
		return tx.companyExpenseRun.update({
			where: { id: runId },
			data: {
				status: "POSTED",
				postedById: data.postedById,
				postedAt: new Date(),
			},
			include: {
				items: {
					include: {
						companyExpense: { select: { id: true, name: true, category: true, vendor: true } },
						financeExpense: { select: { id: true, expenseNo: true, status: true } },
					},
				},
			},
		});
	});
}

/**
 * Cancel an expense run + cancel linked PENDING FinanceExpenses
 */
export async function cancelExpenseRun(runId: string, organizationId: string) {
	const run = await db.companyExpenseRun.findFirst({
		where: {
			id: runId,
			organizationId,
			status: { in: ["DRAFT", "POSTED"] },
		},
		include: {
			items: { select: { financeExpenseId: true } },
		},
	});

	if (!run) {
		throw new Error("Expense run not found or cannot be cancelled");
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

		return tx.companyExpenseRun.update({
			where: { id: runId },
			data: { status: "CANCELLED" },
		});
	});
}

/**
 * Recalculate expense run totals from items.
 */
async function recalculateExpenseRunTotals(runId: string) {
	const [totals, itemCount] = await Promise.all([
		db.companyExpenseRunItem.aggregate({
			where: { expenseRunId: runId },
			_sum: { amount: true },
		}),
		db.companyExpenseRunItem.count({ where: { expenseRunId: runId } }),
	]);

	const totalAmount = Number(totals._sum.amount ?? 0);

	await db.companyExpenseRun.update({
		where: { id: runId },
		data: {
			totalAmount,
			itemCount,
		},
	});
}

/**
 * Update an expense run item (DRAFT only)
 */
export async function updateExpenseRunItem(
	itemId: string,
	organizationId: string,
	data: {
		amount?: number;
		notes?: string;
	},
) {
	const item = await db.companyExpenseRunItem.findFirst({
		where: { id: itemId },
		include: {
			expenseRun: { select: { id: true, organizationId: true, status: true } },
		},
	});

	if (!item || item.expenseRun.organizationId !== organizationId) {
		throw new Error("Expense run item not found");
	}

	if (item.expenseRun.status !== "DRAFT") {
		throw new Error("Can only edit items in DRAFT status");
	}

	await db.companyExpenseRunItem.update({
		where: { id: itemId },
		data: {
			amount: data.amount ?? Number(item.amount),
			notes: data.notes,
		},
	});

	await recalculateExpenseRunTotals(item.expenseRunId);

	return getExpenseRunById(item.expenseRunId, organizationId);
}

/**
 * Delete an expense run item (DRAFT only)
 */
export async function deleteExpenseRunItem(itemId: string, organizationId: string) {
	const item = await db.companyExpenseRunItem.findFirst({
		where: { id: itemId },
		include: {
			expenseRun: { select: { id: true, organizationId: true, status: true } },
		},
	});

	if (!item || item.expenseRun.organizationId !== organizationId) {
		throw new Error("Expense run item not found");
	}

	if (item.expenseRun.status !== "DRAFT") {
		throw new Error("Can only delete items in DRAFT status");
	}

	await db.companyExpenseRunItem.delete({ where: { id: itemId } });
	await recalculateExpenseRunTotals(item.expenseRunId);

	return getExpenseRunById(item.expenseRunId, organizationId);
}

/**
 * Get expense run summary for an organization (current month status)
 */
export async function getExpenseRunSummary(organizationId: string) {
	const now = new Date();
	const currentMonth = now.getMonth() + 1;
	const currentYear = now.getFullYear();

	const [currentRun, totalRuns, totalPosted] = await Promise.all([
		db.companyExpenseRun.findFirst({
			where: { organizationId, month: currentMonth, year: currentYear },
			select: {
				id: true,
				runNo: true,
				status: true,
				totalAmount: true,
				itemCount: true,
			},
		}),
		db.companyExpenseRun.count({ where: { organizationId } }),
		db.companyExpenseRun.count({ where: { organizationId, status: "POSTED" } }),
	]);

	return {
		currentMonth: {
			run: currentRun,
			month: currentMonth,
			year: currentYear,
		},
		totalRuns,
		totalPosted,
	};
}
