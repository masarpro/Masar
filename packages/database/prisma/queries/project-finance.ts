import { db } from "../client";
import type {
	ClaimStatus,
	ExpenseCategory,
	OrgExpenseCategory,
} from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// Project Finance Queries - استعلامات المالية
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get project finance summary with aggregated data
 */
export async function getProjectFinanceSummary(
	organizationId: string,
	projectId: string,
) {
	// Get upcoming claims date range
	const thirtyDaysFromNow = new Date();
	thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

	// Run all queries in parallel
	const [project, expensesTotal, paymentsTotal, claimsData, upcomingClaims, approvedCOImpact, subcontractPaymentsTotal] =
		await Promise.all([
			// Get project contract value
			db.project.findFirst({
				where: { id: projectId, organizationId },
				select: { contractValue: true },
			}),
			// Get total expenses from unified FinanceExpense (filtered by projectId)
			db.financeExpense.aggregate({
				where: { organizationId, projectId, status: "COMPLETED" },
				_sum: { amount: true },
			}),
			// Get total payments from unified FinancePayment (filtered by projectId)
			db.financePayment.aggregate({
				where: { organizationId, projectId, status: "COMPLETED" },
				_sum: { amount: true },
			}),
			// Get claims summary
			db.projectClaim.groupBy({
				by: ["status"],
				where: { organizationId, projectId },
				_sum: { amount: true },
				_count: true,
			}),
			// Get upcoming claims (due within 30 days)
			db.projectClaim.aggregate({
				where: {
					organizationId,
					projectId,
					status: { in: ["SUBMITTED", "APPROVED"] },
					dueDate: { lte: thirtyDaysFromNow },
				},
				_sum: { amount: true },
				_count: true,
			}),
			// Get approved change orders cost impact
			db.projectChangeOrder.aggregate({
				where: {
					organizationId,
					projectId,
					status: { in: ["APPROVED", "IMPLEMENTED"] },
					costImpact: { not: null },
				},
				_sum: { costImpact: true },
			}),
			// Get total subcontract payments (دفعات مقاولي الباطن)
			db.subcontractPayment.aggregate({
				where: {
					organizationId,
					contract: { projectId },
					status: "COMPLETED",
				},
				_sum: { amount: true },
			}),
		]);

	if (!project) {
		throw new Error("Project not found");
	}

	// Calculate claims totals
	let claimsTotal = 0;
	let claimsPaid = 0;
	let claimsApproved = 0;
	let claimsSubmitted = 0;
	let claimsDraft = 0;

	for (const group of claimsData) {
		const sum = group._sum.amount ? Number(group._sum.amount) : 0;
		claimsTotal += sum;

		switch (group.status) {
			case "PAID":
				claimsPaid += sum;
				break;
			case "APPROVED":
				claimsApproved += sum;
				break;
			case "SUBMITTED":
				claimsSubmitted += sum;
				break;
			case "DRAFT":
				claimsDraft += sum;
				break;
		}
	}

	const contractValue = project.contractValue
		? Number(project.contractValue)
		: 0;
	const financeExpenses = expensesTotal._sum.amount
		? Number(expensesTotal._sum.amount)
		: 0;
	const subcontractExpenses = subcontractPaymentsTotal._sum.amount
		? Number(subcontractPaymentsTotal._sum.amount)
		: 0;
	const actualExpenses = financeExpenses + subcontractExpenses;
	const changeOrdersImpact = approvedCOImpact._sum.costImpact
		? Number(approvedCOImpact._sum.costImpact)
		: 0;
	const adjustedContractValue = contractValue + changeOrdersImpact;
	const remaining = adjustedContractValue - actualExpenses;

	const totalPayments = paymentsTotal._sum.amount
		? Number(paymentsTotal._sum.amount)
		: 0;

	return {
		contractValue,
		adjustedContractValue,
		changeOrdersImpact,
		actualExpenses,
		subcontractExpenses,
		totalPayments,
		remaining,
		claimsTotal,
		claimsPaid,
		claimsApproved,
		claimsSubmitted,
		claimsDraft,
		upcomingClaimsTotal: upcomingClaims._sum.amount
			? Number(upcomingClaims._sum.amount)
			: 0,
		upcomingClaimsCount: upcomingClaims._count,
	};
}

/**
 * Get project expenses from unified FinanceExpense + SubcontractPayment
 */
export async function getProjectExpenses(
	organizationId: string,
	projectId: string,
	options?: {
		category?: ExpenseCategory;
		dateFrom?: Date;
		dateTo?: Date;
		limit?: number;
		offset?: number;
	},
) {
	// Map old project categories to org expense categories
	const categoryMap: Record<string, OrgExpenseCategory> = {
		MATERIALS: "MATERIALS",
		LABOR: "LABOR",
		EQUIPMENT: "EQUIPMENT_RENTAL",
		TRANSPORT: "TRANSPORT",
		MISC: "MISC",
	};

	// Build FinanceExpense where clause
	const expenseWhere: Record<string, unknown> = {
		organizationId,
		projectId,
	};

	if (
		options?.category &&
		options.category !== "SUBCONTRACTOR" &&
		categoryMap[options.category]
	) {
		expenseWhere.category = categoryMap[options.category];
	}

	if (options?.dateFrom || options?.dateTo) {
		const dateFilter: Record<string, Date> = {};
		if (options?.dateFrom) dateFilter.gte = options.dateFrom;
		if (options?.dateTo) dateFilter.lte = options.dateTo;
		expenseWhere.date = dateFilter;
	}

	// Build SubcontractPayment where clause
	const subWhere: Record<string, unknown> = {
		organizationId,
		contract: { projectId },
	};
	if (options?.dateFrom || options?.dateTo) {
		const dateFilter: Record<string, Date> = {};
		if (options?.dateFrom) dateFilter.gte = options.dateFrom;
		if (options?.dateTo) dateFilter.lte = options.dateTo;
		subWhere.date = dateFilter;
	}

	// If filtering by SUBCONTRACTOR, only show subcontract payments
	const isSubcontractorOnly = options?.category === "SUBCONTRACTOR";
	const isOtherCategory =
		options?.category &&
		options.category !== "SUBCONTRACTOR" &&
		categoryMap[options.category];

	const [expenseResults, subResults] = await Promise.all([
		isSubcontractorOnly
			? { expenses: [], total: 0 }
			: (async () => {
					const [expenses, total] = await Promise.all([
						db.financeExpense.findMany({
							where: expenseWhere as any,
							include: {
								sourceAccount: {
									select: { id: true, name: true },
								},
								createdBy: { select: { id: true, name: true } },
							},
							orderBy: { date: "desc" },
							take: 200,
							skip: 0,
						}),
						db.financeExpense.count({ where: expenseWhere as any }),
					]);
					return { expenses, total };
				})(),
		isOtherCategory
			? { payments: [], total: 0 }
			: (async () => {
					const [payments, total] = await Promise.all([
						db.subcontractPayment.findMany({
							where: subWhere as any,
							include: {
								contract: {
									select: { id: true, name: true, contractNo: true },
								},
								sourceAccount: {
									select: { id: true, name: true },
								},
								createdBy: { select: { id: true, name: true } },
							},
							orderBy: { date: "desc" },
							take: 200,
							skip: 0,
						}),
						db.subcontractPayment.count({ where: subWhere as any }),
					]);
					return { payments, total };
				})(),
	]);

	// Normalize and merge
	const normalizedExpenses = (
		"expenses" in expenseResults ? expenseResults.expenses : []
	).map((e) => ({
		_type: "expense" as const,
		id: e.id,
		date: e.date,
		category: "MATERIALS" as ExpenseCategory, // map back for UI
		orgCategory: e.category,
		amount: e.amount,
		vendorName: e.vendorName,
		note: e.description,
		description: e.description,
		createdBy: e.createdBy,
		createdAt: e.createdAt,
		sourceAccount: e.sourceAccount,
	}));

	// Map org categories back to project-level categories for UI display
	for (const exp of normalizedExpenses) {
		const reverseMap: Record<string, ExpenseCategory> = {
			MATERIALS: "MATERIALS",
			LABOR: "LABOR",
			EQUIPMENT_RENTAL: "EQUIPMENT",
			EQUIPMENT_PURCHASE: "EQUIPMENT",
			TRANSPORT: "TRANSPORT",
			SUBCONTRACTOR: "SUBCONTRACTOR",
			MISC: "MISC",
		};
		exp.category = reverseMap[exp.orgCategory] ?? "MISC";
	}

	const normalizedSub = (
		"payments" in subResults ? subResults.payments : []
	).map((p) => ({
		_type: "subcontract_payment" as const,
		id: p.id,
		date: p.date,
		category: "SUBCONTRACTOR" as ExpenseCategory,
		orgCategory: "SUBCONTRACTOR" as OrgExpenseCategory,
		amount: p.amount,
		vendorName: p.contract.name,
		note: p.description,
		description: p.description,
		createdBy: p.createdBy,
		createdAt: p.createdAt,
		sourceAccount: p.sourceAccount,
	}));

	const merged = [...normalizedExpenses, ...normalizedSub].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);

	// Apply pagination
	const limit = options?.limit ?? 50;
	const offset = options?.offset ?? 0;
	const paged = merged.slice(offset, offset + limit);

	const expTotal =
		"expenses" in expenseResults
			? (expenseResults as { total: number }).total
			: 0;
	const subTotal =
		"payments" in subResults
			? (subResults as { total: number }).total
			: 0;

	return { expenses: paged, total: expTotal + subTotal };
}

/**
 * Create a new project expense
 */
export async function createProjectExpense(data: {
	organizationId: string;
	projectId: string;
	createdById: string;
	date: Date;
	category: ExpenseCategory;
	amount: number;
	vendorName?: string;
	note?: string;
	attachmentUrl?: string;
	subcontractContractId?: string;
}) {
	// Verify project belongs to organization
	const project = await db.project.findFirst({
		where: { id: data.projectId, organizationId: data.organizationId },
		select: { id: true },
	});

	if (!project) {
		throw new Error("المشروع غير موجود");
	}

	return db.projectExpense.create({
		data: {
			organizationId: data.organizationId,
			projectId: data.projectId,
			createdById: data.createdById,
			date: data.date,
			category: data.category,
			amount: data.amount,
			vendorName: data.vendorName,
			note: data.note,
			attachmentUrl: data.attachmentUrl,
			subcontractContractId: data.subcontractContractId,
		},
		include: {
			createdBy: { select: { id: true, name: true } },
		},
	});
}

/**
 * Get project claims with pagination and filters
 */
export async function getProjectClaims(
	organizationId: string,
	projectId: string,
	options?: {
		status?: ClaimStatus;
		limit?: number;
		offset?: number;
	},
) {
	const where: {
		organizationId: string;
		projectId: string;
		status?: ClaimStatus;
	} = { organizationId, projectId };

	if (options?.status) {
		where.status = options.status;
	}

	const [claims, total] = await Promise.all([
		db.projectClaim.findMany({
			where,
			include: {
				createdBy: { select: { id: true, name: true } },
			},
			orderBy: { claimNo: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.projectClaim.count({ where }),
	]);

	return { claims, total };
}

/**
 * Create a new project claim with transaction-safe claimNo generation
 */
export async function createProjectClaim(data: {
	organizationId: string;
	projectId: string;
	createdById: string;
	periodStart?: Date;
	periodEnd?: Date;
	amount: number;
	dueDate?: Date;
	note?: string;
}) {
	// Verify project belongs to organization
	const project = await db.project.findFirst({
		where: { id: data.projectId, organizationId: data.organizationId },
		select: { id: true },
	});

	if (!project) {
		throw new Error("المشروع غير موجود");
	}

	// Use transaction to safely generate claimNo
	return db.$transaction(async (tx) => {
		// Get the maximum claimNo for this project
		const lastClaim = await tx.projectClaim.findFirst({
			where: { projectId: data.projectId },
			orderBy: { claimNo: "desc" },
			select: { claimNo: true },
		});

		const nextClaimNo = (lastClaim?.claimNo ?? 0) + 1;

		return tx.projectClaim.create({
			data: {
				organizationId: data.organizationId,
				projectId: data.projectId,
				createdById: data.createdById,
				claimNo: nextClaimNo,
				periodStart: data.periodStart,
				periodEnd: data.periodEnd,
				amount: data.amount,
				dueDate: data.dueDate,
				note: data.note,
				status: "DRAFT",
			},
			include: {
				createdBy: { select: { id: true, name: true } },
			},
		});
	});
}

/**
 * Update claim status with appropriate timestamps
 */
export async function updateClaimStatus(
	id: string,
	organizationId: string,
	projectId: string,
	newStatus: ClaimStatus,
) {
	// Verify claim belongs to organization/project
	const existing = await db.projectClaim.findFirst({
		where: { id, organizationId, projectId },
		select: { id: true, status: true },
	});

	if (!existing) {
		throw new Error("المستخلص غير موجود");
	}

	// Build update data with appropriate timestamps
	const updateData: {
		status: ClaimStatus;
		approvedAt?: Date | null;
		paidAt?: Date | null;
	} = { status: newStatus };

	// Set timestamps based on new status
	if (newStatus === "APPROVED" && existing.status !== "APPROVED") {
		updateData.approvedAt = new Date();
	} else if (newStatus === "PAID" && existing.status !== "PAID") {
		updateData.paidAt = new Date();
		// Also set approvedAt if not already set
		if (existing.status !== "APPROVED") {
			updateData.approvedAt = new Date();
		}
	} else if (newStatus === "DRAFT" || newStatus === "SUBMITTED") {
		// Reset timestamps when going back to draft/submitted
		updateData.approvedAt = null;
		updateData.paidAt = null;
	}

	return db.projectClaim.update({
		where: { id },
		data: updateData,
		include: {
			createdBy: { select: { id: true, name: true } },
		},
	});
}

/**
 * Get a single expense by ID
 */
export async function getProjectExpenseById(
	id: string,
	organizationId: string,
	projectId: string,
) {
	return db.projectExpense.findFirst({
		where: { id, organizationId, projectId },
		include: {
			createdBy: { select: { id: true, name: true } },
		},
	});
}

/**
 * Get a single claim by ID
 */
export async function getProjectClaimById(
	id: string,
	organizationId: string,
	projectId: string,
) {
	return db.projectClaim.findFirst({
		where: { id, organizationId, projectId },
		include: {
			createdBy: { select: { id: true, name: true } },
		},
	});
}

/**
 * Update a project expense
 */
export async function updateProjectExpense(
	id: string,
	organizationId: string,
	projectId: string,
	data: {
		date?: Date;
		category?: ExpenseCategory;
		amount?: number;
		vendorName?: string | null;
		note?: string | null;
		attachmentUrl?: string | null;
		subcontractContractId?: string | null;
	},
) {
	const existing = await db.projectExpense.findFirst({
		where: { id, organizationId, projectId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("المصروف غير موجود");
	}

	return db.projectExpense.update({
		where: { id },
		data: {
			date: data.date,
			category: data.category,
			amount: data.amount,
			vendorName: data.vendorName,
			note: data.note,
			attachmentUrl: data.attachmentUrl,
			subcontractContractId: data.subcontractContractId,
		},
		include: {
			createdBy: { select: { id: true, name: true } },
		},
	});
}

/**
 * Delete a project expense
 */
export async function deleteProjectExpense(
	id: string,
	organizationId: string,
	projectId: string,
) {
	const existing = await db.projectExpense.findFirst({
		where: { id, organizationId, projectId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("المصروف غير موجود");
	}

	return db.projectExpense.delete({
		where: { id },
	});
}

/**
 * Delete a project claim
 */
export async function deleteProjectClaim(
	id: string,
	organizationId: string,
	projectId: string,
) {
	const existing = await db.projectClaim.findFirst({
		where: { id, organizationId, projectId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("المستخلص غير موجود");
	}

	return db.projectClaim.delete({
		where: { id },
	});
}

/**
 * Update a project claim (full update, not just status)
 */
export async function updateProjectClaim(
	id: string,
	organizationId: string,
	projectId: string,
	data: {
		periodStart?: Date | null;
		periodEnd?: Date | null;
		amount?: number;
		dueDate?: Date | null;
		note?: string | null;
	},
) {
	const existing = await db.projectClaim.findFirst({
		where: { id, organizationId, projectId },
		select: { id: true, status: true },
	});

	if (!existing) {
		throw new Error("المستخلص غير موجود");
	}

	// Only allow editing if claim is in DRAFT status
	if (existing.status !== "DRAFT") {
		throw new Error("لا يمكن تعديل المستخلص إلا في حالة المسودة");
	}

	return db.projectClaim.update({
		where: { id },
		data: {
			periodStart: data.periodStart,
			periodEnd: data.periodEnd,
			amount: data.amount,
			dueDate: data.dueDate,
			note: data.note,
		},
		include: {
			createdBy: { select: { id: true, name: true } },
		},
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// Subcontract Contract Queries - moved to subcontract.ts
// Old functions (getSubcontractContracts, getSubcontractContractById,
// createSubcontractContract, updateSubcontractContract, deleteSubcontractContract)
// are now exported from packages/database/prisma/queries/subcontract.ts

/**
 * Get expenses grouped by category for donut chart
 */
export async function getExpensesByCategory(
	organizationId: string,
	projectId: string,
) {
	// Use FinanceExpense (unified) instead of ProjectExpense
	const [financeResult, subcontractTotal] = await Promise.all([
		db.financeExpense.groupBy({
			by: ["category"],
			where: { organizationId, projectId, status: "COMPLETED" },
			_sum: { amount: true },
			_count: true,
		}),
		db.subcontractPayment.aggregate({
			where: {
				organizationId,
				contract: { projectId },
				status: "COMPLETED",
			},
			_sum: { amount: true },
			_count: true,
		}),
	]);

	// Map org categories back to simpler project categories
	const categoryMap: Record<string, string> = {
		MATERIALS: "MATERIALS",
		LABOR: "LABOR",
		EQUIPMENT_RENTAL: "EQUIPMENT",
		EQUIPMENT_PURCHASE: "EQUIPMENT",
		TRANSPORT: "TRANSPORT",
		SUBCONTRACTOR: "SUBCONTRACTOR",
	};

	const grouped = new Map<string, { total: number; count: number }>();
	for (const group of financeResult) {
		const mappedCat = categoryMap[group.category] ?? "MISC";
		const existing = grouped.get(mappedCat) ?? { total: 0, count: 0 };
		existing.total += group._sum.amount ? Number(group._sum.amount) : 0;
		existing.count += group._count;
		grouped.set(mappedCat, existing);
	}

	// Add subcontract payments as SUBCONTRACTOR category
	if (subcontractTotal._count > 0) {
		const existing = grouped.get("SUBCONTRACTOR") ?? {
			total: 0,
			count: 0,
		};
		existing.total += subcontractTotal._sum.amount
			? Number(subcontractTotal._sum.amount)
			: 0;
		existing.count += subcontractTotal._count;
		grouped.set("SUBCONTRACTOR", existing);
	}

	return Array.from(grouped.entries()).map(([category, data]) => ({
		category,
		total: data.total,
		count: data.count,
	}));
}
