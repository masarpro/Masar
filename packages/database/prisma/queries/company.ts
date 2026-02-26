import { db } from "../client";
import type {
	CompanyExpenseCategory,
	RecurrenceType,
	AssetCategory,
	AssetType,
	AssetStatus,
	EmployeeType,
	SalaryType,
	EmployeeStatus,
	OrgExpenseCategory,
} from "../generated/client";
import { generateExpenseNumber } from "./org-finance";

// ═══════════════════════════════════════════════════════════════════════════
// EMPLOYEE QUERIES - استعلامات الموظفين
// ═══════════════════════════════════════════════════════════════════════════

export async function getOrganizationEmployees(
	organizationId: string,
	options?: {
		status?: EmployeeStatus;
		type?: EmployeeType;
		query?: string;
		limit?: number;
		offset?: number;
	},
) {
	const where: Record<string, unknown> = { organizationId };

	if (options?.status) where.status = options.status;
	if (options?.type) where.type = options.type;
	if (options?.query) {
		where.OR = [
			{ name: { contains: options.query, mode: "insensitive" } },
			{ employeeNo: { contains: options.query, mode: "insensitive" } },
			{ phone: { contains: options.query } },
		];
	}

	const [employees, total] = await Promise.all([
		db.employee.findMany({
			where,
			include: {
				linkedUser: { select: { id: true, name: true, image: true } },
				assignments: {
					where: { isActive: true },
					include: { project: { select: { id: true, name: true, slug: true } } },
				},
			},
			orderBy: { createdAt: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.employee.count({ where }),
	]);

	return { employees, total };
}

export async function getEmployeeById(id: string, organizationId: string) {
	return db.employee.findFirst({
		where: { id, organizationId },
		include: {
			linkedUser: { select: { id: true, name: true, image: true, email: true } },
			assignments: {
				include: { project: { select: { id: true, name: true, slug: true, status: true } } },
				orderBy: { createdAt: "desc" },
			},
		},
	});
}

export async function generateEmployeeNo(organizationId: string): Promise<string> {
	const count = await db.employee.count({ where: { organizationId } });
	const nextNum = count + 1;
	return `EMP-${String(nextNum).padStart(3, "0")}`;
}

export async function createEmployee(data: {
	organizationId: string;
	name: string;
	employeeNo?: string;
	type: EmployeeType;
	phone?: string;
	email?: string;
	nationalId?: string;
	salaryType?: SalaryType;
	baseSalary?: number;
	housingAllowance?: number;
	transportAllowance?: number;
	otherAllowances?: number;
	gosiSubscription?: number;
	joinDate: Date;
	linkedUserId?: string;
	notes?: string;
}) {
	return db.employee.create({
		data: {
			organizationId: data.organizationId,
			name: data.name,
			employeeNo: data.employeeNo,
			type: data.type,
			phone: data.phone,
			email: data.email,
			nationalId: data.nationalId,
			salaryType: data.salaryType ?? "MONTHLY",
			baseSalary: data.baseSalary ?? 0,
			housingAllowance: data.housingAllowance ?? 0,
			transportAllowance: data.transportAllowance ?? 0,
			otherAllowances: data.otherAllowances ?? 0,
			gosiSubscription: data.gosiSubscription ?? 0,
			joinDate: data.joinDate,
			linkedUserId: data.linkedUserId,
			notes: data.notes,
		},
	});
}

export async function updateEmployee(
	id: string,
	organizationId: string,
	data: {
		name?: string;
		employeeNo?: string;
		type?: EmployeeType;
		phone?: string;
		email?: string;
		nationalId?: string;
		salaryType?: SalaryType;
		baseSalary?: number;
		housingAllowance?: number;
		transportAllowance?: number;
		otherAllowances?: number;
		gosiSubscription?: number;
		joinDate?: Date;
		endDate?: Date | null;
		status?: EmployeeStatus;
		linkedUserId?: string | null;
		notes?: string | null;
	},
) {
	return db.employee.update({
		where: { id, organizationId },
		data,
	});
}

export async function terminateEmployee(id: string, organizationId: string, endDate: Date) {
	return db.$transaction(async (tx) => {
		// Deactivate all assignments
		await tx.employeeProjectAssignment.updateMany({
			where: { employeeId: id, isActive: true },
			data: { isActive: false, endDate },
		});

		return tx.employee.update({
			where: { id, organizationId },
			data: { status: "TERMINATED", endDate },
		});
	});
}

export async function getEmployeeSummary(organizationId: string) {
	const [totalActive, totalTerminated, totalOnLeave, employees] = await Promise.all([
		db.employee.count({ where: { organizationId, status: "ACTIVE" } }),
		db.employee.count({ where: { organizationId, status: "TERMINATED" } }),
		db.employee.count({ where: { organizationId, status: "ON_LEAVE" } }),
		db.employee.findMany({
			where: { organizationId, status: "ACTIVE" },
			select: { baseSalary: true, housingAllowance: true, transportAllowance: true, otherAllowances: true, gosiSubscription: true },
		}),
	]);

	let totalSalaries = 0;
	let totalGosi = 0;
	for (const emp of employees) {
		totalSalaries += Number(emp.baseSalary) + Number(emp.housingAllowance) + Number(emp.transportAllowance) + Number(emp.otherAllowances);
		totalGosi += Number(emp.gosiSubscription);
	}

	return {
		totalActive,
		totalTerminated,
		totalOnLeave,
		totalMonthlySalaries: totalSalaries,
		totalMonthlyGosi: totalGosi,
		totalMonthlyCost: totalSalaries + totalGosi,
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// EMPLOYEE ASSIGNMENT QUERIES - توزيع الموظفين على المشاريع
// ═══════════════════════════════════════════════════════════════════════════

export async function getEmployeeAssignments(employeeId: string) {
	return db.employeeProjectAssignment.findMany({
		where: { employeeId },
		include: { project: { select: { id: true, name: true, slug: true, status: true } } },
		orderBy: { createdAt: "desc" },
	});
}

export async function getProjectEmployeeAssignments(projectId: string) {
	return db.employeeProjectAssignment.findMany({
		where: { projectId, isActive: true },
		include: {
			employee: {
				select: {
					id: true, name: true, employeeNo: true, type: true, status: true,
					baseSalary: true, housingAllowance: true, transportAllowance: true,
					otherAllowances: true, gosiSubscription: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});
}

export async function createEmployeeAssignment(data: {
	employeeId: string;
	projectId: string;
	percentage: number;
	startDate: Date;
	notes?: string;
}) {
	// Validate total percentage ≤ 100%
	const existing = await db.employeeProjectAssignment.findMany({
		where: { employeeId: data.employeeId, isActive: true },
		select: { percentage: true },
	});

	const currentTotal = existing.reduce((sum, a) => sum + Number(a.percentage), 0);
	if (currentTotal + data.percentage > 100) {
		throw new Error(`Total allocation would exceed 100% (current: ${currentTotal}%, adding: ${data.percentage}%)`);
	}

	return db.employeeProjectAssignment.create({
		data: {
			employeeId: data.employeeId,
			projectId: data.projectId,
			percentage: data.percentage,
			startDate: data.startDate,
			notes: data.notes,
		},
	});
}

export async function updateEmployeeAssignment(
	id: string,
	data: { percentage?: number; startDate?: Date; endDate?: Date | null; isActive?: boolean; notes?: string | null },
) {
	if (data.percentage !== undefined) {
		const assignment = await db.employeeProjectAssignment.findUnique({ where: { id }, select: { employeeId: true, percentage: true } });
		if (assignment) {
			const existing = await db.employeeProjectAssignment.findMany({
				where: { employeeId: assignment.employeeId, isActive: true, id: { not: id } },
				select: { percentage: true },
			});
			const currentTotal = existing.reduce((sum, a) => sum + Number(a.percentage), 0);
			if (currentTotal + data.percentage > 100) {
				throw new Error(`Total allocation would exceed 100% (other: ${currentTotal}%, setting: ${data.percentage}%)`);
			}
		}
	}

	return db.employeeProjectAssignment.update({ where: { id }, data });
}

export async function removeEmployeeAssignment(id: string) {
	return db.employeeProjectAssignment.delete({ where: { id } });
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPANY EXPENSE QUERIES - مصروفات المنشأة الثابتة
// ═══════════════════════════════════════════════════════════════════════════

export async function getCompanyExpenses(
	organizationId: string,
	options?: {
		category?: CompanyExpenseCategory;
		recurrence?: RecurrenceType;
		isActive?: boolean;
		query?: string;
		limit?: number;
		offset?: number;
	},
) {
	const where: Record<string, unknown> = { organizationId };

	if (options?.category) where.category = options.category;
	if (options?.recurrence) where.recurrence = options.recurrence;
	if (options?.isActive !== undefined) where.isActive = options.isActive;
	if (options?.query) {
		where.OR = [
			{ name: { contains: options.query, mode: "insensitive" } },
			{ vendor: { contains: options.query, mode: "insensitive" } },
		];
	}

	const [expenses, total] = await Promise.all([
		db.companyExpense.findMany({
			where,
			include: {
				_count: { select: { payments: true, allocations: true } },
				allocations: {
					include: { project: { select: { id: true, name: true, slug: true } } },
				},
			},
			orderBy: { createdAt: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.companyExpense.count({ where }),
	]);

	return { expenses, total };
}

export async function getCompanyExpenseById(id: string, organizationId: string) {
	return db.companyExpense.findFirst({
		where: { id, organizationId },
		include: {
			payments: {
				orderBy: { periodStart: "desc" },
				include: { bankAccount: { select: { id: true, name: true } } },
			},
			allocations: {
				include: { project: { select: { id: true, name: true, slug: true } } },
			},
		},
	});
}

export async function createCompanyExpense(data: {
	organizationId: string;
	name: string;
	category: CompanyExpenseCategory;
	description?: string;
	amount: number;
	recurrence?: RecurrenceType;
	vendor?: string;
	contractNumber?: string;
	startDate: Date;
	endDate?: Date;
	reminderDays?: number;
	notes?: string;
}) {
	return db.companyExpense.create({
		data: {
			organizationId: data.organizationId,
			name: data.name,
			category: data.category,
			description: data.description,
			amount: data.amount,
			recurrence: data.recurrence ?? "MONTHLY",
			vendor: data.vendor,
			contractNumber: data.contractNumber,
			startDate: data.startDate,
			endDate: data.endDate,
			reminderDays: data.reminderDays ?? 5,
			notes: data.notes,
		},
	});
}

export async function updateCompanyExpense(
	id: string,
	organizationId: string,
	data: {
		name?: string;
		category?: CompanyExpenseCategory;
		description?: string | null;
		amount?: number;
		recurrence?: RecurrenceType;
		vendor?: string | null;
		contractNumber?: string | null;
		startDate?: Date;
		endDate?: Date | null;
		reminderDays?: number;
		isActive?: boolean;
		notes?: string | null;
	},
) {
	return db.companyExpense.update({
		where: { id, organizationId },
		data,
	});
}

export async function deactivateCompanyExpense(id: string, organizationId: string) {
	return db.companyExpense.update({
		where: { id, organizationId },
		data: { isActive: false },
	});
}

export async function getCompanyExpenseSummary(organizationId: string) {
	const expenses = await db.companyExpense.findMany({
		where: { organizationId, isActive: true },
		select: { amount: true, recurrence: true, category: true },
	});

	let totalMonthly = 0;
	const byCategory: Record<string, number> = {};

	for (const exp of expenses) {
		const amt = Number(exp.amount);
		let monthly: number;
		switch (exp.recurrence) {
			case "MONTHLY": monthly = amt; break;
			case "QUARTERLY": monthly = amt / 3; break;
			case "SEMI_ANNUAL": monthly = amt / 6; break;
			case "ANNUAL": monthly = amt / 12; break;
			case "ONE_TIME": monthly = 0; break;
			default: monthly = amt;
		}
		totalMonthly += monthly;
		byCategory[exp.category] = (byCategory[exp.category] ?? 0) + monthly;
	}

	return {
		totalActiveExpenses: expenses.length,
		totalMonthlyAmount: totalMonthly,
		totalAnnualAmount: totalMonthly * 12,
		byCategory,
	};
}

/**
 * Get company expense data for dashboard: byCategory (pie) + monthly amounts (bars)
 */
export async function getCompanyExpenseDashboardData(organizationId: string) {
	const [summary, runs] = await Promise.all([
		getCompanyExpenseSummary(organizationId),
		db.companyExpenseRun.findMany({
			where: { organizationId, status: "POSTED" },
			select: { month: true, year: true, totalAmount: true },
			orderBy: [{ year: "desc" }, { month: "desc" }],
			take: 6,
		}),
	]);

	const monthlyExpenses = [...runs].reverse().map((r) => ({
		month: r.month,
		year: r.year,
		amount: Number(r.totalAmount),
	}));

	return {
		...summary,
		monthlyExpenses,
	};
}

export async function getUpcomingCompanyPayments(organizationId: string, daysAhead = 30) {
	const futureDate = new Date();
	futureDate.setDate(futureDate.getDate() + daysAhead);

	return db.companyExpensePayment.findMany({
		where: {
			expense: { organizationId },
			isPaid: false,
			dueDate: { lte: futureDate },
		},
		include: {
			expense: { select: { id: true, name: true, category: true } },
		},
		orderBy: { dueDate: "asc" },
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPENSE PAYMENT QUERIES - دفعات المصروفات
// ═══════════════════════════════════════════════════════════════════════════

export async function getExpensePayments(
	expenseId: string,
	options?: { isPaid?: boolean; limit?: number; offset?: number },
) {
	const where: Record<string, unknown> = { expenseId };
	if (options?.isPaid !== undefined) where.isPaid = options.isPaid;

	return db.companyExpensePayment.findMany({
		where,
		include: { bankAccount: { select: { id: true, name: true } } },
		orderBy: { periodStart: "desc" },
		take: options?.limit ?? 50,
		skip: options?.offset ?? 0,
	});
}

export async function createExpensePayment(data: {
	expenseId: string;
	periodStart: Date;
	periodEnd: Date;
	amount: number;
	dueDate: Date;
	isPaid?: boolean;
	paidAt?: Date;
	bankAccountId?: string;
	referenceNo?: string;
	notes?: string;
}) {
	return db.companyExpensePayment.create({ data });
}

/**
 * Category mapping from CompanyExpenseCategory → OrgExpenseCategory
 */
export function mapCompanyToOrgCategory(category: CompanyExpenseCategory): OrgExpenseCategory {
	const mapping: Record<string, OrgExpenseCategory> = {
		RENT: "RENT",
		UTILITIES: "UTILITIES",
		COMMUNICATIONS: "COMMUNICATIONS",
		INSURANCE: "INSURANCE",
		LICENSES: "LICENSES",
		SUBSCRIPTIONS: "MISC",
		MAINTENANCE: "MAINTENANCE",
		BANK_FEES: "BANK_FEES",
		MARKETING: "MARKETING",
		TRANSPORT: "TRANSPORT",
		HOSPITALITY: "HOSPITALITY",
		OTHER: "MISC",
	};
	return mapping[category] ?? "MISC";
}

export async function markExpensePaymentPaid(
	id: string,
	data: {
		paidAt?: Date;
		bankAccountId: string;
		referenceNo?: string;
		organizationId: string;
		createdById: string;
	},
) {
	// Get the payment with its expense details
	const payment = await db.companyExpensePayment.findUnique({
		where: { id },
		include: {
			expense: { select: { id: true, name: true, category: true, vendor: true } },
		},
	});

	if (!payment) {
		throw new Error("Payment not found");
	}

	if (payment.isPaid) {
		throw new Error("Payment is already marked as paid");
	}

	const expenseNo = await generateExpenseNumber(data.organizationId);
	const orgCategory = mapCompanyToOrgCategory(payment.expense.category);

	return db.$transaction(async (tx) => {
		// Create a COMPLETED FinanceExpense
		const financeExpense = await tx.financeExpense.create({
			data: {
				organizationId: data.organizationId,
				createdById: data.createdById,
				expenseNo,
				category: orgCategory,
				description: `${payment.expense.name} - دفعة ${payment.periodStart.toISOString().slice(0, 7)}`,
				amount: Number(payment.amount),
				date: data.paidAt ?? new Date(),
				sourceAccountId: data.bankAccountId,
				vendorName: payment.expense.vendor,
				paymentMethod: "BANK_TRANSFER",
				referenceNo: data.referenceNo,
				status: "COMPLETED",
				sourceType: "FACILITY_RECURRING",
				sourceId: payment.id,
				paidAmount: Number(payment.amount),
				notes: `دفعة مصروف منشأة: ${payment.expense.name}`,
			},
		});

		// Deduct from bank balance
		await tx.organizationBank.update({
			where: { id: data.bankAccountId },
			data: {
				balance: { decrement: Number(payment.amount) },
			},
		});

		// Mark the company payment as paid and link it
		return tx.companyExpensePayment.update({
			where: { id },
			data: {
				isPaid: true,
				paidAt: data.paidAt ?? new Date(),
				bankAccountId: data.bankAccountId,
				referenceNo: data.referenceNo,
				financeExpenseId: financeExpense.id,
			},
		});
	});
}

export async function updateExpensePayment(
	id: string,
	data: {
		amount?: number;
		dueDate?: Date;
		isPaid?: boolean;
		paidAt?: Date | null;
		bankAccountId?: string | null;
		referenceNo?: string | null;
		notes?: string | null;
	},
) {
	return db.companyExpensePayment.update({ where: { id }, data });
}

export async function deleteExpensePayment(id: string) {
	return db.companyExpensePayment.delete({ where: { id } });
}

export async function generateMonthlyPayments(expenseId: string, monthsAhead = 3) {
	const expense = await db.companyExpense.findUnique({
		where: { id: expenseId },
		select: { id: true, amount: true, recurrence: true, startDate: true, endDate: true },
	});

	if (!expense || expense.recurrence === "ONE_TIME") return [];

	// Get the last payment period
	const lastPayment = await db.companyExpensePayment.findFirst({
		where: { expenseId },
		orderBy: { periodEnd: "desc" },
		select: { periodEnd: true },
	});

	const startFrom = lastPayment ? new Date(lastPayment.periodEnd) : new Date(expense.startDate);
	startFrom.setDate(startFrom.getDate() + 1);

	const payments: Array<{
		expenseId: string;
		periodStart: Date;
		periodEnd: Date;
		amount: typeof expense.amount;
		dueDate: Date;
	}> = [];

	const getMonthsIncrement = (recurrence: RecurrenceType): number => {
		switch (recurrence) {
			case "MONTHLY": return 1;
			case "QUARTERLY": return 3;
			case "SEMI_ANNUAL": return 6;
			case "ANNUAL": return 12;
			default: return 1;
		}
	};

	const increment = getMonthsIncrement(expense.recurrence);
	let current = new Date(startFrom);

	for (let i = 0; i < monthsAhead; i++) {
		const periodStart = new Date(current);
		const periodEnd = new Date(current);
		periodEnd.setMonth(periodEnd.getMonth() + increment);
		periodEnd.setDate(periodEnd.getDate() - 1);

		if (expense.endDate && periodStart > expense.endDate) break;

		payments.push({
			expenseId: expense.id,
			periodStart,
			periodEnd,
			amount: expense.amount,
			dueDate: periodStart,
		});

		current.setMonth(current.getMonth() + increment);
	}

	if (payments.length === 0) return [];

	return db.companyExpensePayment.createMany({ data: payments });
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPENSE ALLOCATION QUERIES - توزيع المصروفات على المشاريع
// ═══════════════════════════════════════════════════════════════════════════

export async function getExpenseAllocations(expenseId: string) {
	return db.companyExpenseAllocation.findMany({
		where: { expenseId },
		include: { project: { select: { id: true, name: true, slug: true } } },
		orderBy: { percentage: "desc" },
	});
}

export async function setExpenseAllocations(
	expenseId: string,
	allocations: Array<{ projectId: string; percentage: number; notes?: string }>,
) {
	// Validate total ≤ 100%
	const total = allocations.reduce((sum, a) => sum + a.percentage, 0);
	if (total > 100) {
		throw new Error(`Total allocation percentage cannot exceed 100% (got ${total}%)`);
	}

	return db.$transaction(async (tx) => {
		// Delete existing allocations
		await tx.companyExpenseAllocation.deleteMany({ where: { expenseId } });

		// Create new allocations
		if (allocations.length > 0) {
			await tx.companyExpenseAllocation.createMany({
				data: allocations.map((a) => ({
					expenseId,
					projectId: a.projectId,
					percentage: a.percentage,
					notes: a.notes,
				})),
			});
		}

		return tx.companyExpenseAllocation.findMany({
			where: { expenseId },
			include: { project: { select: { id: true, name: true, slug: true } } },
		});
	});
}

export async function getProjectAllocatedExpenses(projectId: string) {
	const allocations = await db.companyExpenseAllocation.findMany({
		where: { projectId },
		include: {
			expense: {
				select: { id: true, name: true, category: true, amount: true, recurrence: true, isActive: true },
			},
		},
	});

	return allocations.map((a) => {
		const monthlyAmount = (() => {
			const amt = Number(a.expense.amount);
			switch (a.expense.recurrence) {
				case "MONTHLY": return amt;
				case "QUARTERLY": return amt / 3;
				case "SEMI_ANNUAL": return amt / 6;
				case "ANNUAL": return amt / 12;
				case "ONE_TIME": return 0;
				default: return amt;
			}
		})();

		return {
			...a,
			monthlyAllocatedAmount: (monthlyAmount * Number(a.percentage)) / 100,
		};
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPANY ASSET QUERIES - أصول المنشأة
// ═══════════════════════════════════════════════════════════════════════════

export async function getCompanyAssets(
	organizationId: string,
	options?: {
		category?: AssetCategory;
		type?: AssetType;
		status?: AssetStatus;
		query?: string;
		limit?: number;
		offset?: number;
	},
) {
	const where: Record<string, unknown> = { organizationId };

	if (options?.category) where.category = options.category;
	if (options?.type) where.type = options.type;
	if (options?.status) where.status = options.status;
	if (options?.query) {
		where.OR = [
			{ name: { contains: options.query, mode: "insensitive" } },
			{ assetNo: { contains: options.query, mode: "insensitive" } },
			{ serialNumber: { contains: options.query, mode: "insensitive" } },
			{ brand: { contains: options.query, mode: "insensitive" } },
		];
	}

	const [assets, total] = await Promise.all([
		db.companyAsset.findMany({
			where,
			include: {
				currentProject: { select: { id: true, name: true, slug: true } },
			},
			orderBy: { createdAt: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.companyAsset.count({ where }),
	]);

	return { assets, total };
}

export async function getCompanyAssetById(id: string, organizationId: string) {
	return db.companyAsset.findFirst({
		where: { id, organizationId },
		include: {
			currentProject: { select: { id: true, name: true, slug: true, status: true } },
		},
	});
}

export async function createCompanyAsset(data: {
	organizationId: string;
	name: string;
	assetNo?: string;
	category: AssetCategory;
	type?: AssetType;
	brand?: string;
	model?: string;
	serialNumber?: string;
	year?: number;
	description?: string;
	purchasePrice?: number;
	monthlyRent?: number;
	currentValue?: number;
	purchaseDate?: Date;
	warrantyExpiry?: Date;
	insuranceExpiry?: Date;
	notes?: string;
}) {
	return db.companyAsset.create({
		data: {
			organizationId: data.organizationId,
			name: data.name,
			assetNo: data.assetNo,
			category: data.category,
			type: data.type ?? "OWNED",
			brand: data.brand,
			model: data.model,
			serialNumber: data.serialNumber,
			year: data.year,
			description: data.description,
			purchasePrice: data.purchasePrice,
			monthlyRent: data.monthlyRent,
			currentValue: data.currentValue,
			purchaseDate: data.purchaseDate,
			warrantyExpiry: data.warrantyExpiry,
			insuranceExpiry: data.insuranceExpiry,
			notes: data.notes,
		},
	});
}

export async function updateCompanyAsset(
	id: string,
	organizationId: string,
	data: {
		name?: string;
		assetNo?: string;
		category?: AssetCategory;
		type?: AssetType;
		status?: AssetStatus;
		brand?: string | null;
		model?: string | null;
		serialNumber?: string | null;
		year?: number | null;
		description?: string | null;
		purchasePrice?: number | null;
		monthlyRent?: number | null;
		currentValue?: number | null;
		purchaseDate?: Date | null;
		warrantyExpiry?: Date | null;
		insuranceExpiry?: Date | null;
		notes?: string | null;
	},
) {
	return db.companyAsset.update({
		where: { id, organizationId },
		data,
	});
}

export async function deactivateCompanyAsset(id: string, organizationId: string) {
	return db.companyAsset.update({
		where: { id, organizationId },
		data: { status: "RETIRED", currentProjectId: null, assignedAt: null },
	});
}

export async function assignAssetToProject(id: string, organizationId: string, projectId: string) {
	return db.companyAsset.update({
		where: { id, organizationId },
		data: {
			currentProjectId: projectId,
			assignedAt: new Date(),
			status: "IN_USE",
		},
	});
}

export async function returnAssetToWarehouse(id: string, organizationId: string) {
	return db.companyAsset.update({
		where: { id, organizationId },
		data: {
			currentProjectId: null,
			assignedAt: null,
			status: "AVAILABLE",
		},
	});
}

export async function getAssetSummary(organizationId: string) {
	const [total, available, inUse, maintenance, retired, assets] = await Promise.all([
		db.companyAsset.count({ where: { organizationId } }),
		db.companyAsset.count({ where: { organizationId, status: "AVAILABLE" } }),
		db.companyAsset.count({ where: { organizationId, status: "IN_USE" } }),
		db.companyAsset.count({ where: { organizationId, status: "MAINTENANCE" } }),
		db.companyAsset.count({ where: { organizationId, status: "RETIRED" } }),
		db.companyAsset.findMany({
			where: { organizationId, status: { not: "RETIRED" } },
			select: { purchasePrice: true, monthlyRent: true, currentValue: true, type: true },
		}),
	]);

	let totalValue = 0;
	let totalMonthlyRent = 0;

	for (const asset of assets) {
		if (asset.currentValue) totalValue += Number(asset.currentValue);
		else if (asset.purchasePrice) totalValue += Number(asset.purchasePrice);
		if (asset.monthlyRent) totalMonthlyRent += Number(asset.monthlyRent);
	}

	return {
		total,
		available,
		inUse,
		maintenance,
		retired,
		totalValue,
		totalMonthlyRent,
	};
}

export async function getExpiringInsurance(organizationId: string, daysAhead = 30) {
	const futureDate = new Date();
	futureDate.setDate(futureDate.getDate() + daysAhead);

	return db.companyAsset.findMany({
		where: {
			organizationId,
			status: { not: "RETIRED" },
			insuranceExpiry: { lte: futureDate, gte: new Date() },
		},
		select: { id: true, name: true, assetNo: true, category: true, insuranceExpiry: true },
		orderBy: { insuranceExpiry: "asc" },
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD QUERIES - لوحة التحكم
// ═══════════════════════════════════════════════════════════════════════════

export async function getCompanyDashboardData(organizationId: string) {
	const [employeeSummary, expenseSummary, assetSummary, upcomingPayments, expiringInsurance] = await Promise.all([
		getEmployeeSummary(organizationId),
		getCompanyExpenseSummary(organizationId),
		getAssetSummary(organizationId),
		getUpcomingCompanyPayments(organizationId, 30),
		getExpiringInsurance(organizationId, 30),
	]);

	return {
		employees: employeeSummary,
		expenses: expenseSummary,
		assets: assetSummary,
		alerts: {
			upcomingPayments: upcomingPayments.length,
			expiringInsurance: expiringInsurance.length,
			upcomingPaymentsList: upcomingPayments.slice(0, 5),
			expiringInsuranceList: expiringInsurance.slice(0, 5),
		},
		totalMonthlyCost:
			employeeSummary.totalMonthlyCost +
			expenseSummary.totalMonthlyAmount +
			assetSummary.totalMonthlyRent,
	};
}
