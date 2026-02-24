import { db } from "../client";
import type {
	ClaimStatus,
	FinanceTransactionStatus,
} from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// Payments & Claims Unified Timeline - الدفعات والمستخلصات
// ═══════════════════════════════════════════════════════════════════════════

export type TimelineItemType = "payment" | "claim";

export interface TimelineItem {
	id: string;
	type: TimelineItemType;
	date: Date;
	referenceNo: string;
	amount: number;
	status: string;
	termLabel: string | null;
	termType: string | null;
	paymentMethod: string | null;
	description: string | null;
	createdBy: { id: string; name: string } | null;
	createdAt: Date;
}

export interface PaymentsClaimsTimelineResult {
	items: TimelineItem[];
	totalCount: number;
	totalPayments: number;
	totalClaims: number;
}

/**
 * Get unified payments + claims timeline for a project
 */
export async function getPaymentsClaimsTimeline(
	organizationId: string,
	projectId: string,
	options?: {
		type?: "all" | "payment" | "claim";
		status?: string;
		dateFrom?: Date;
		dateTo?: Date;
		query?: string;
		sortBy?: "date" | "amount";
		sortOrder?: "asc" | "desc";
		limit?: number;
		offset?: number;
	},
): Promise<PaymentsClaimsTimelineResult> {
	const filterType = options?.type ?? "all";
	const sortBy = options?.sortBy ?? "date";
	const sortOrder = options?.sortOrder ?? "desc";
	const limit = options?.limit ?? 20;
	const offset = options?.offset ?? 0;

	// Build payment where clause
	const paymentWhere: {
		organizationId: string;
		projectId: string;
		status?: FinanceTransactionStatus;
		date?: { gte?: Date; lte?: Date };
		OR?: Array<{
			paymentNo?: { contains: string; mode: "insensitive" };
			description?: { contains: string; mode: "insensitive" };
			clientName?: { contains: string; mode: "insensitive" };
		}>;
	} = { organizationId, projectId };

	// Build claim where clause
	const claimWhere: {
		organizationId: string;
		projectId: string;
		status?: ClaimStatus;
		createdAt?: { gte?: Date; lte?: Date };
		OR?: Array<{
			note?: { contains: string; mode: "insensitive" };
		}>;
	} = { organizationId, projectId };

	// Apply status filter
	if (options?.status) {
		const paymentStatuses = ["PENDING", "COMPLETED", "CANCELLED"];
		const claimStatuses = [
			"DRAFT",
			"SUBMITTED",
			"APPROVED",
			"PAID",
			"REJECTED",
		];

		if (paymentStatuses.includes(options.status)) {
			paymentWhere.status =
				options.status as FinanceTransactionStatus;
		}
		if (claimStatuses.includes(options.status)) {
			claimWhere.status = options.status as ClaimStatus;
		}
	}

	// Apply date filter
	if (options?.dateFrom || options?.dateTo) {
		const dateFilter: { gte?: Date; lte?: Date } = {};
		if (options?.dateFrom) dateFilter.gte = options.dateFrom;
		if (options?.dateTo) dateFilter.lte = options.dateTo;
		paymentWhere.date = dateFilter;
		claimWhere.createdAt = dateFilter;
	}

	// Apply search query
	if (options?.query) {
		paymentWhere.OR = [
			{
				paymentNo: {
					contains: options.query,
					mode: "insensitive",
				},
			},
			{
				description: {
					contains: options.query,
					mode: "insensitive",
				},
			},
			{
				clientName: {
					contains: options.query,
					mode: "insensitive",
				},
			},
		];
		claimWhere.OR = [
			{
				note: {
					contains: options.query,
					mode: "insensitive",
				},
			},
		];
	}

	// Run queries in parallel
	const includePayments = filterType === "all" || filterType === "payment";
	const includeClaims = filterType === "all" || filterType === "claim";

	const [paymentsResult, claimsResult, paymentCount, claimCount] =
		await Promise.all([
			includePayments
				? db.financePayment.findMany({
						where: paymentWhere,
						include: {
							contractTerm: {
								select: {
									type: true,
									label: true,
								},
							},
							createdBy: {
								select: { id: true, name: true },
							},
						},
						orderBy:
							sortBy === "amount"
								? { amount: sortOrder }
								: { date: sortOrder },
					})
				: Promise.resolve([]),
			includeClaims
				? db.projectClaim.findMany({
						where: claimWhere,
						include: {
							createdBy: {
								select: { id: true, name: true },
							},
						},
						orderBy:
							sortBy === "amount"
								? { amount: sortOrder }
								: { createdAt: sortOrder },
					})
				: Promise.resolve([]),
			includePayments
				? db.financePayment.count({ where: paymentWhere })
				: Promise.resolve(0),
			includeClaims
				? db.projectClaim.count({ where: claimWhere })
				: Promise.resolve(0),
		]);

	// Normalize to common shape
	const paymentItems: TimelineItem[] = paymentsResult.map((p) => ({
		id: p.id,
		type: "payment" as const,
		date: p.date,
		referenceNo: p.paymentNo,
		amount: Number(p.amount),
		status: p.status,
		termLabel: p.contractTerm?.label ?? null,
		termType: p.contractTerm?.type ?? null,
		paymentMethod: p.paymentMethod,
		description: p.description,
		createdBy: p.createdBy,
		createdAt: p.createdAt,
	}));

	const claimItems: TimelineItem[] = claimsResult.map((c) => ({
		id: c.id,
		type: "claim" as const,
		date: c.periodStart ?? c.createdAt,
		referenceNo: `#${c.claimNo}`,
		amount: Number(c.amount),
		status: c.status,
		termLabel: null,
		termType: null,
		paymentMethod: null,
		description: c.note,
		createdBy: c.createdBy,
		createdAt: c.createdAt,
	}));

	// Merge and sort
	let allItems = [...paymentItems, ...claimItems];

	allItems.sort((a, b) => {
		const aVal =
			sortBy === "amount" ? a.amount : a.date.getTime();
		const bVal =
			sortBy === "amount" ? b.amount : b.date.getTime();
		return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
	});

	// Paginate
	const totalCount = allItems.length;
	allItems = allItems.slice(offset, offset + limit);

	return {
		items: allItems,
		totalCount,
		totalPayments: paymentCount,
		totalClaims: claimCount,
	};
}
