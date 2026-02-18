import { db } from "../client";
import type { ClaimStatus, ExpenseCategory } from "../generated/client";

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
	const [project, expensesTotal, paymentsTotal, claimsData, upcomingClaims] =
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
	const actualExpenses = expensesTotal._sum.amount
		? Number(expensesTotal._sum.amount)
		: 0;
	const remaining = contractValue - actualExpenses;

	const totalPayments = paymentsTotal._sum.amount
		? Number(paymentsTotal._sum.amount)
		: 0;

	return {
		contractValue,
		actualExpenses,
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
 * Get project expenses with pagination and filters
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
	const where: {
		organizationId: string;
		projectId: string;
		category?: ExpenseCategory;
		date?: { gte?: Date; lte?: Date };
	} = { organizationId, projectId };

	if (options?.category) {
		where.category = options.category;
	}

	if (options?.dateFrom || options?.dateTo) {
		where.date = {};
		if (options.dateFrom) where.date.gte = options.dateFrom;
		if (options.dateTo) where.date.lte = options.dateTo;
	}

	const [expenses, total] = await Promise.all([
		db.projectExpense.findMany({
			where,
			include: {
				createdBy: { select: { id: true, name: true } },
			},
			orderBy: { date: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.projectExpense.count({ where }),
	]);

	return { expenses, total };
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
