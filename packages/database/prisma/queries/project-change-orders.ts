import { db } from "../client";
import type { ChangeOrderStatus, ChangeOrderCategory } from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// Project Change Orders Queries (Phase 11)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * List change orders for a project with optional filters
 */
export async function listChangeOrders(
	organizationId: string,
	projectId: string,
	options?: {
		status?: ChangeOrderStatus;
		search?: string;
		page?: number;
		pageSize?: number;
	},
) {
	const page = options?.page ?? 1;
	const pageSize = options?.pageSize ?? 20;
	const skip = (page - 1) * pageSize;

	const where = {
		organizationId,
		projectId,
		...(options?.status && { status: options.status }),
		...(options?.search && {
			OR: [
				{ title: { contains: options.search, mode: "insensitive" as const } },
				{ description: { contains: options.search, mode: "insensitive" as const } },
			],
		}),
	};

	const [changeOrders, total] = await Promise.all([
		db.projectChangeOrder.findMany({
			where,
			include: {
				requestedBy: { select: { id: true, name: true, email: true } },
				decidedBy: { select: { id: true, name: true, email: true } },
				milestone: { select: { id: true, title: true } },
			},
			orderBy: { coNo: "desc" },
			skip,
			take: pageSize,
		}),
		db.projectChangeOrder.count({ where }),
	]);

	return {
		changeOrders,
		total,
		page,
		pageSize,
		totalPages: Math.ceil(total / pageSize),
	};
}

/**
 * List change orders for owner portal (only APPROVED and IMPLEMENTED)
 */
export async function listChangeOrdersForOwner(
	organizationId: string,
	projectId: string,
	options?: {
		page?: number;
		pageSize?: number;
	},
) {
	const page = options?.page ?? 1;
	const pageSize = options?.pageSize ?? 20;
	const skip = (page - 1) * pageSize;

	const where = {
		organizationId,
		projectId,
		status: { in: ["APPROVED", "IMPLEMENTED"] as ChangeOrderStatus[] },
	};

	const [changeOrders, total] = await Promise.all([
		db.projectChangeOrder.findMany({
			where,
			select: {
				id: true,
				coNo: true,
				title: true,
				description: true,
				category: true,
				status: true,
				costImpact: true,
				currency: true,
				timeImpactDays: true,
				decidedAt: true,
				decisionNote: true,
				implementedAt: true,
				createdAt: true,
			},
			orderBy: { coNo: "desc" },
			skip,
			take: pageSize,
		}),
		db.projectChangeOrder.count({ where }),
	]);

	return {
		changeOrders,
		total,
		page,
		pageSize,
		totalPages: Math.ceil(total / pageSize),
	};
}

/**
 * Get a single change order
 */
export async function getChangeOrder(
	organizationId: string,
	projectId: string,
	changeOrderId: string,
) {
	return db.projectChangeOrder.findFirst({
		where: {
			id: changeOrderId,
			organizationId,
			projectId,
		},
		include: {
			requestedBy: { select: { id: true, name: true, email: true } },
			decidedBy: { select: { id: true, name: true, email: true } },
			implementedBy: { select: { id: true, name: true, email: true } },
			milestone: { select: { id: true, title: true } },
			claim: { select: { id: true, claimNo: true, amount: true } },
		},
	});
}

/**
 * Get a single change order for owner portal (limited fields)
 */
export async function getChangeOrderForOwner(
	organizationId: string,
	projectId: string,
	changeOrderId: string,
) {
	const changeOrder = await db.projectChangeOrder.findFirst({
		where: {
			id: changeOrderId,
			organizationId,
			projectId,
			status: { in: ["APPROVED", "IMPLEMENTED"] },
		},
		select: {
			id: true,
			coNo: true,
			title: true,
			description: true,
			category: true,
			status: true,
			costImpact: true,
			currency: true,
			timeImpactDays: true,
			decidedAt: true,
			decisionNote: true,
			implementedAt: true,
			createdAt: true,
			milestone: { select: { id: true, title: true } },
		},
	});

	return changeOrder;
}

/**
 * Create a new change order
 */
export async function createChangeOrder(
	organizationId: string,
	projectId: string,
	data: {
		title: string;
		description?: string;
		category?: ChangeOrderCategory;
		costImpact?: number;
		currency?: string;
		timeImpactDays?: number;
		milestoneId?: string;
		claimId?: string;
		requestedById: string;
	},
) {
	// Generate coNo in a transaction to ensure uniqueness
	return db.$transaction(async (tx) => {
		// Get the max coNo for this project
		const lastCO = await tx.projectChangeOrder.findFirst({
			where: { organizationId, projectId },
			orderBy: { coNo: "desc" },
			select: { coNo: true },
		});
		const coNo = (lastCO?.coNo ?? 0) + 1;

		return tx.projectChangeOrder.create({
			data: {
				organizationId,
				projectId,
				coNo,
				title: data.title,
				description: data.description,
				category: data.category ?? "OTHER",
				status: "DRAFT",
				costImpact: data.costImpact,
				currency: data.currency ?? "SAR",
				timeImpactDays: data.timeImpactDays,
				milestoneId: data.milestoneId,
				claimId: data.claimId,
				requestedById: data.requestedById,
			},
		});
	});
}

/**
 * Update a change order (only allowed in DRAFT status)
 */
export async function updateChangeOrder(
	organizationId: string,
	projectId: string,
	changeOrderId: string,
	data: {
		title?: string;
		description?: string;
		category?: ChangeOrderCategory;
		costImpact?: number;
		currency?: string;
		timeImpactDays?: number;
		milestoneId?: string | null;
		claimId?: string | null;
	},
) {
	// Verify the change order exists and is in DRAFT status
	const existing = await db.projectChangeOrder.findFirst({
		where: { id: changeOrderId, organizationId, projectId },
	});

	if (!existing) {
		throw new Error("Change order not found");
	}

	if (existing.status !== "DRAFT") {
		throw new Error("Can only edit change orders in DRAFT status");
	}

	return db.projectChangeOrder.update({
		where: { id: changeOrderId },
		data: {
			...data,
			// Handle null values for optional relations
			milestoneId: data.milestoneId === null ? null : data.milestoneId,
			claimId: data.claimId === null ? null : data.claimId,
		},
	});
}

/**
 * Submit a change order for approval (DRAFT -> SUBMITTED)
 */
export async function submitChangeOrder(
	organizationId: string,
	projectId: string,
	changeOrderId: string,
	actorId: string,
) {
	// Verify the change order exists
	const existing = await db.projectChangeOrder.findFirst({
		where: { id: changeOrderId, organizationId, projectId },
	});

	if (!existing) {
		throw new Error("Change order not found");
	}

	if (existing.status !== "DRAFT") {
		throw new Error("Can only submit change orders in DRAFT status");
	}

	return db.projectChangeOrder.update({
		where: { id: changeOrderId },
		data: {
			status: "SUBMITTED",
			requestedAt: new Date(),
		},
	});
}

/**
 * Approve a change order (SUBMITTED -> APPROVED)
 */
export async function approveChangeOrder(
	organizationId: string,
	projectId: string,
	changeOrderId: string,
	actorId: string,
	decisionNote?: string,
) {
	// Verify the change order exists
	const existing = await db.projectChangeOrder.findFirst({
		where: { id: changeOrderId, organizationId, projectId },
	});

	if (!existing) {
		throw new Error("Change order not found");
	}

	if (existing.status !== "SUBMITTED") {
		throw new Error("Can only approve change orders in SUBMITTED status");
	}

	return db.projectChangeOrder.update({
		where: { id: changeOrderId },
		data: {
			status: "APPROVED",
			decidedById: actorId,
			decidedAt: new Date(),
			decisionNote,
		},
	});
}

/**
 * Reject a change order (SUBMITTED -> REJECTED)
 */
export async function rejectChangeOrder(
	organizationId: string,
	projectId: string,
	changeOrderId: string,
	actorId: string,
	decisionNote?: string,
) {
	// Verify the change order exists
	const existing = await db.projectChangeOrder.findFirst({
		where: { id: changeOrderId, organizationId, projectId },
	});

	if (!existing) {
		throw new Error("Change order not found");
	}

	if (existing.status !== "SUBMITTED") {
		throw new Error("Can only reject change orders in SUBMITTED status");
	}

	return db.projectChangeOrder.update({
		where: { id: changeOrderId },
		data: {
			status: "REJECTED",
			decidedById: actorId,
			decidedAt: new Date(),
			decisionNote,
		},
	});
}

/**
 * Mark a change order as implemented (APPROVED -> IMPLEMENTED)
 */
export async function markImplemented(
	organizationId: string,
	projectId: string,
	changeOrderId: string,
	actorId: string,
) {
	// Verify the change order exists
	const existing = await db.projectChangeOrder.findFirst({
		where: { id: changeOrderId, organizationId, projectId },
	});

	if (!existing) {
		throw new Error("Change order not found");
	}

	if (existing.status !== "APPROVED") {
		throw new Error("Can only mark as implemented change orders in APPROVED status");
	}

	return db.projectChangeOrder.update({
		where: { id: changeOrderId },
		data: {
			status: "IMPLEMENTED",
			implementedById: actorId,
			implementedAt: new Date(),
		},
	});
}

/**
 * Delete a change order (only allowed in DRAFT status)
 */
export async function deleteChangeOrder(
	organizationId: string,
	projectId: string,
	changeOrderId: string,
) {
	// Verify the change order exists and is in DRAFT status
	const existing = await db.projectChangeOrder.findFirst({
		where: { id: changeOrderId, organizationId, projectId },
	});

	if (!existing) {
		throw new Error("Change order not found");
	}

	if (existing.status !== "DRAFT") {
		throw new Error("Can only delete change orders in DRAFT status");
	}

	return db.projectChangeOrder.delete({
		where: { id: changeOrderId },
	});
}

/**
 * Get change order statistics for a project
 */
export async function getChangeOrderStats(
	organizationId: string,
	projectId: string,
) {
	const stats = await db.projectChangeOrder.groupBy({
		by: ["status"],
		where: { organizationId, projectId },
		_count: { id: true },
	});

	// Calculate total cost impact for approved/implemented orders
	const approvedOrders = await db.projectChangeOrder.findMany({
		where: {
			organizationId,
			projectId,
			status: { in: ["APPROVED", "IMPLEMENTED"] },
		},
		select: { costImpact: true, timeImpactDays: true },
	});

	let totalCostImpact = 0;
	let totalTimeImpact = 0;

	for (const order of approvedOrders) {
		if (order.costImpact) {
			totalCostImpact += Number(order.costImpact);
		}
		if (order.timeImpactDays) {
			totalTimeImpact += order.timeImpactDays;
		}
	}

	const statusCounts: Record<string, number> = {
		DRAFT: 0,
		SUBMITTED: 0,
		APPROVED: 0,
		REJECTED: 0,
		IMPLEMENTED: 0,
	};

	for (const stat of stats) {
		statusCounts[stat.status] = stat._count.id;
	}

	return {
		...statusCounts,
		total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
		totalCostImpact,
		totalTimeImpact,
	};
}
