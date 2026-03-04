import { db } from "../client";
import { Prisma } from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// Subcontract Items Queries - بنود عقد الباطن (BOQ)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all items for a subcontract with cumulative claimed quantities
 */
export async function getSubcontractItems(
	contractId: string,
	organizationId: string,
) {
	const items = await db.subcontractItem.findMany({
		where: { contractId, organizationId },
		include: {
			claimItems: {
				where: {
					claim: {
						status: { in: ["APPROVED", "PARTIALLY_PAID", "PAID"] },
					},
				},
				select: { thisQty: true },
			},
		},
		orderBy: { sortOrder: "asc" },
	});

	return items.map((item) => {
		const totalCumulativeQty = item.claimItems.reduce(
			(sum, ci) => sum.add(ci.thisQty),
			new Prisma.Decimal(0),
		);
		const remainingQty = item.contractQty.sub(totalCumulativeQty);
		const completionPercent = item.contractQty.gt(0)
			? totalCumulativeQty.div(item.contractQty).mul(100).toNumber()
			: 0;

		const { claimItems, ...rest } = item;
		return {
			...rest,
			contractQty: Number(item.contractQty),
			unitPrice: Number(item.unitPrice),
			totalAmount: Number(item.totalAmount),
			totalCumulativeQty: Number(totalCumulativeQty),
			remainingQty: Number(remainingQty),
			completionPercent: Math.round(completionPercent * 100) / 100,
		};
	});
}

/**
 * Create a new subcontract item
 */
export async function createSubcontractItem(data: {
	organizationId: string;
	contractId: string;
	createdById: string;
	itemCode?: string | null;
	description: string;
	descriptionEn?: string | null;
	unit: string;
	contractQty: number;
	unitPrice: number;
	sortOrder?: number;
	category?: string | null;
	isLumpSum?: boolean;
}) {
	const totalAmount = data.contractQty * data.unitPrice;

	// Get next sortOrder if not provided
	let sortOrder = data.sortOrder;
	if (sortOrder === undefined) {
		const maxSort = await db.subcontractItem.aggregate({
			where: { contractId: data.contractId },
			_max: { sortOrder: true },
		});
		sortOrder = (maxSort._max.sortOrder ?? 0) + 1;
	}

	return db.subcontractItem.create({
		data: {
			organizationId: data.organizationId,
			contractId: data.contractId,
			createdById: data.createdById,
			itemCode: data.itemCode,
			description: data.description,
			descriptionEn: data.descriptionEn,
			unit: data.unit,
			contractQty: data.contractQty,
			unitPrice: data.unitPrice,
			totalAmount,
			sortOrder,
			category: data.category,
			isLumpSum: data.isLumpSum ?? false,
		},
	});
}

/**
 * Update a subcontract item
 */
export async function updateSubcontractItem(
	id: string,
	organizationId: string,
	data: {
		itemCode?: string | null;
		description?: string;
		descriptionEn?: string | null;
		unit?: string;
		contractQty?: number;
		unitPrice?: number;
		sortOrder?: number;
		category?: string | null;
		isLumpSum?: boolean;
	},
) {
	const updateData: Record<string, unknown> = { ...data };

	// Recalculate totalAmount if qty or price changed
	if (data.contractQty !== undefined || data.unitPrice !== undefined) {
		const existing = await db.subcontractItem.findUnique({
			where: { id },
			select: { contractQty: true, unitPrice: true },
		});
		if (existing) {
			const qty = data.contractQty ?? Number(existing.contractQty);
			const price = data.unitPrice ?? Number(existing.unitPrice);
			updateData.totalAmount = qty * price;
		}
	}

	return db.subcontractItem.update({
		where: { id, organizationId },
		data: updateData,
	});
}

/**
 * Delete a subcontract item (only if not used in any claim)
 */
export async function deleteSubcontractItem(
	id: string,
	organizationId: string,
) {
	// Check if item is used in any claim
	const usageCount = await db.subcontractClaimItem.count({
		where: { contractItemId: id },
	});

	if (usageCount > 0) {
		throw new Error(`ITEM_IN_USE:${usageCount}`);
	}

	return db.subcontractItem.delete({
		where: { id, organizationId },
	});
}

/**
 * Copy items from one contract to another
 */
export async function copySubcontractItems(
	sourceContractId: string,
	targetContractId: string,
	organizationId: string,
	createdById: string,
) {
	const sourceItems = await db.subcontractItem.findMany({
		where: { contractId: sourceContractId, organizationId },
		orderBy: { sortOrder: "asc" },
	});

	if (sourceItems.length === 0) return [];

	return db.$transaction(
		sourceItems.map((item) =>
			db.subcontractItem.create({
				data: {
					organizationId,
					contractId: targetContractId,
					createdById,
					itemCode: item.itemCode,
					description: item.description,
					descriptionEn: item.descriptionEn,
					unit: item.unit,
					contractQty: item.contractQty,
					unitPrice: item.unitPrice,
					totalAmount: item.totalAmount,
					sortOrder: item.sortOrder,
					category: item.category,
					isLumpSum: item.isLumpSum,
				},
			}),
		),
	);
}
