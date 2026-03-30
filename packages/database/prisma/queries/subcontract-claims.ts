import { db } from "../client";
import { Prisma } from "../generated/client";
import type {
	SubcontractClaimStatus,
	SubcontractClaimType,
	PaymentMethod,
} from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// Subcontract Claims Queries - مستخلصات الباطن
// ═══════════════════════════════════════════════════════════════════════════

/**
 * List subcontract claims with optional filters
 */
export async function getSubcontractClaims(
	organizationId: string,
	filters?: {
		contractId?: string;
		projectId?: string;
		status?: SubcontractClaimStatus;
	},
) {
	const where: Prisma.SubcontractClaimWhereInput = { organizationId };

	if (filters?.contractId) where.contractId = filters.contractId;
	if (filters?.status) where.status = filters.status;
	if (filters?.projectId) {
		where.contract = { projectId: filters.projectId };
	}

	const claims = await db.subcontractClaim.findMany({
		where,
		include: {
			contract: {
				select: { id: true, name: true, companyName: true, projectId: true, value: true },
			},
			createdBy: { select: { id: true, name: true } },
			_count: { select: { items: true, payments: true } },
		},
		orderBy: { createdAt: "desc" },
	});

	return claims.map((claim) => ({
		...claim,
		grossAmount: Number(claim.grossAmount),
		retentionAmount: Number(claim.retentionAmount),
		advanceDeduction: Number(claim.advanceDeduction),
		penaltyAmount: Number(claim.penaltyAmount),
		otherDeductions: Number(claim.otherDeductions),
		vatAmount: Number(claim.vatAmount),
		netAmount: Number(claim.netAmount),
		paidAmount: Number(claim.paidAmount),
		outstanding: Number(claim.netAmount) - Number(claim.paidAmount),
		contract: {
			...claim.contract,
			value: Number(claim.contract.value),
		},
	}));
}

/**
 * Get a single subcontract claim with full details
 */
export async function getSubcontractClaimById(
	id: string,
	organizationId: string,
) {
	const claim = await db.subcontractClaim.findUnique({
		where: { id, organizationId },
		include: {
			contract: {
				select: {
					id: true, name: true, companyName: true, projectId: true,
					value: true, retentionPercent: true, vatPercent: true,
					advancePaymentPercent: true, advancePaymentAmount: true,
					retentionCapPercent: true,
				},
			},
			items: {
				include: {
					contractItem: {
						select: { id: true, itemCode: true, description: true, descriptionEn: true, unit: true },
					},
				},
				orderBy: { contractItem: { sortOrder: "asc" } },
			},
			payments: {
				orderBy: { date: "asc" },
				select: {
					id: true, paymentNo: true, amount: true, date: true,
					paymentMethod: true, description: true, notes: true,
					createdBy: { select: { id: true, name: true } },
				},
			},
			createdBy: { select: { id: true, name: true } },
			approvedBy: { select: { id: true, name: true } },
		},
	});

	if (!claim) return null;

	return {
		...claim,
		grossAmount: Number(claim.grossAmount),
		retentionAmount: Number(claim.retentionAmount),
		advanceDeduction: Number(claim.advanceDeduction),
		penaltyAmount: Number(claim.penaltyAmount),
		otherDeductions: Number(claim.otherDeductions),
		vatAmount: Number(claim.vatAmount),
		netAmount: Number(claim.netAmount),
		paidAmount: Number(claim.paidAmount),
		outstanding: Number(claim.netAmount) - Number(claim.paidAmount),
		contract: {
			...claim.contract,
			value: Number(claim.contract.value),
			retentionPercent: claim.contract.retentionPercent ? Number(claim.contract.retentionPercent) : null,
			vatPercent: claim.contract.vatPercent ? Number(claim.contract.vatPercent) : null,
			advancePaymentPercent: claim.contract.advancePaymentPercent ? Number(claim.contract.advancePaymentPercent) : null,
			advancePaymentAmount: claim.contract.advancePaymentAmount ? Number(claim.contract.advancePaymentAmount) : null,
			retentionCapPercent: claim.contract.retentionCapPercent ? Number(claim.contract.retentionCapPercent) : null,
		},
		items: claim.items.map((item) => ({
			...item,
			contractQty: Number(item.contractQty),
			unitPrice: Number(item.unitPrice),
			prevCumulativeQty: Number(item.prevCumulativeQty),
			thisQty: Number(item.thisQty),
			thisAmount: Number(item.thisAmount),
			cumulativeQty: Number(item.prevCumulativeQty) + Number(item.thisQty),
			remainingQty: Number(item.contractQty) - Number(item.prevCumulativeQty) - Number(item.thisQty),
			completionPercent: Number(item.contractQty) > 0
				? Math.round(((Number(item.prevCumulativeQty) + Number(item.thisQty)) / Number(item.contractQty)) * 10000) / 100
				: 0,
		})),
		payments: claim.payments.map((p) => ({
			...p,
			amount: Number(p.amount),
		})),
	};
}

/**
 * Create a new subcontract claim with items
 */
export async function createSubcontractClaim(data: {
	organizationId: string;
	contractId: string;
	createdById: string;
	title: string;
	periodStart: Date;
	periodEnd: Date;
	claimType?: SubcontractClaimType;
	notes?: string | null;
	penaltyAmount?: number;
	otherDeductions?: number;
	otherDeductionsNote?: string | null;
	items: Array<{
		contractItemId: string;
		thisQty: number;
	}>;
}) {
	return db.$transaction(async (tx) => {
		// Lock the contract row to prevent concurrent claims from racing
		await tx.$queryRawUnsafe(
			`SELECT id FROM subcontract_contracts WHERE id = $1 FOR UPDATE`,
			data.contractId,
		);

		// 1. Get contract details
		const contract = await tx.subcontractContract.findUnique({
			where: { id: data.contractId, organizationId: data.organizationId },
			select: {
				id: true, value: true,
				retentionPercent: true, vatPercent: true,
				advancePaymentPercent: true, advancePaymentAmount: true,
				retentionCapPercent: true,
			},
		});
		if (!contract) throw new Error("CONTRACT_NOT_FOUND");

		// 2. Check no pending claims (SUBMITTED or UNDER_REVIEW)
		const pendingClaim = await tx.subcontractClaim.findFirst({
			where: {
				contractId: data.contractId,
				status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
			},
			select: { id: true, claimNo: true },
		});
		if (pendingClaim) {
			throw new Error("PENDING_CLAIM_EXISTS");
		}

		// 3. Get next claimNo
		const lastClaim = await tx.subcontractClaim.findFirst({
			where: { contractId: data.contractId },
			orderBy: { claimNo: "desc" },
			select: { claimNo: true },
		});
		const claimNo = (lastClaim?.claimNo ?? 0) + 1;

		// 4. Get contract items for validation and pricing
		const contractItems = await tx.subcontractItem.findMany({
			where: {
				contractId: data.contractId,
				id: { in: data.items.map((i) => i.contractItemId) },
			},
		});
		const itemMap = new Map(contractItems.map((i) => [i.id, i]));

		// 5. Compute prevCumulativeQty for each item from approved claims
		const approvedClaimItems = await tx.subcontractClaimItem.findMany({
			where: {
				claim: {
					contractId: data.contractId,
					status: { in: ["APPROVED", "PARTIALLY_PAID", "PAID"] },
				},
				contractItemId: { in: data.items.map((i) => i.contractItemId) },
			},
			select: { contractItemId: true, thisQty: true },
		});

		const prevQtyMap = new Map<string, Prisma.Decimal>();
		for (const ci of approvedClaimItems) {
			const current = prevQtyMap.get(ci.contractItemId) ?? new Prisma.Decimal(0);
			prevQtyMap.set(ci.contractItemId, current.add(ci.thisQty));
		}

		// 6. Build claim items and compute amounts
		let grossAmount = new Prisma.Decimal(0);
		const claimItemsData: Array<{
			organizationId: string;
			contractItemId: string;
			contractQty: Prisma.Decimal;
			unitPrice: Prisma.Decimal;
			prevCumulativeQty: Prisma.Decimal;
			thisQty: Prisma.Decimal;
			thisAmount: Prisma.Decimal;
		}> = [];

		for (const item of data.items) {
			if (item.thisQty <= 0) continue;

			const contractItem = itemMap.get(item.contractItemId);
			if (!contractItem) throw new Error(`ITEM_NOT_FOUND:${item.contractItemId}`);

			const prevCumQty = prevQtyMap.get(item.contractItemId) ?? new Prisma.Decimal(0);
			const thisQty = new Prisma.Decimal(item.thisQty);
			const cumulativeQty = prevCumQty.add(thisQty);

			// Validate: cumulative cannot exceed contract qty
			if (cumulativeQty.gt(contractItem.contractQty)) {
				throw new Error(`QTY_EXCEEDS_REMAINING:${item.contractItemId}`);
			}

			const thisAmount = thisQty.mul(contractItem.unitPrice);
			grossAmount = grossAmount.add(thisAmount);

			claimItemsData.push({
				organizationId: data.organizationId,
				contractItemId: item.contractItemId,
				contractQty: contractItem.contractQty,
				unitPrice: contractItem.unitPrice,
				prevCumulativeQty: prevCumQty,
				thisQty,
				thisAmount,
			});
		}

		if (claimItemsData.length === 0) {
			throw new Error("NO_ITEMS_ADDED");
		}

		// 7. Calculate deductions
		const retentionPercent = contract.retentionPercent
			? Number(contract.retentionPercent)
			: 0;
		let retentionAmount = grossAmount
			.mul(retentionPercent)
			.div(100);

		// Check retention cap
		if (contract.retentionCapPercent) {
			const capPercent = Number(contract.retentionCapPercent);
			const capAmount = new Prisma.Decimal(Number(contract.value))
				.mul(capPercent)
				.div(100);

			// Get total retention already held
			const prevRetention = await tx.subcontractClaim.aggregate({
				where: {
					contractId: data.contractId,
					status: { in: ["APPROVED", "PARTIALLY_PAID", "PAID"] },
				},
				_sum: { retentionAmount: true },
			});
			const totalRetentionSoFar = prevRetention._sum.retentionAmount ?? new Prisma.Decimal(0);
			const remainingCap = capAmount.sub(totalRetentionSoFar);

			if (remainingCap.lte(0)) {
				retentionAmount = new Prisma.Decimal(0);
			} else if (retentionAmount.gt(remainingCap)) {
				retentionAmount = remainingCap;
			}
		}

		// 8. Advance deduction
		let advanceDeduction = new Prisma.Decimal(0);
		if (contract.advancePaymentPercent && contract.advancePaymentAmount) {
			const advPercent = Number(contract.advancePaymentPercent);
			advanceDeduction = grossAmount.mul(advPercent).div(100);

			// Don't exceed remaining unrecovered advance
			const prevAdvDeduction = await tx.subcontractClaim.aggregate({
				where: {
					contractId: data.contractId,
					status: { in: ["APPROVED", "PARTIALLY_PAID", "PAID"] },
				},
				_sum: { advanceDeduction: true },
			});
			const totalRecovered = prevAdvDeduction._sum.advanceDeduction ?? new Prisma.Decimal(0);
			const remainingAdvance = contract.advancePaymentAmount.sub(totalRecovered);

			if (remainingAdvance.lte(0)) {
				advanceDeduction = new Prisma.Decimal(0);
			} else if (advanceDeduction.gt(remainingAdvance)) {
				advanceDeduction = remainingAdvance;
			}
		}

		// 9. Penalty & other deductions
		const penaltyAmount = new Prisma.Decimal(data.penaltyAmount ?? 0);
		const otherDeductionsAmount = new Prisma.Decimal(data.otherDeductions ?? 0);

		// 10. VAT
		const vatPercent = contract.vatPercent ? Number(contract.vatPercent) : 0;
		const taxableAmount = grossAmount.sub(retentionAmount).sub(advanceDeduction).sub(penaltyAmount).sub(otherDeductionsAmount);
		const vatAmount = taxableAmount.gt(0) ? taxableAmount.mul(vatPercent).div(100) : new Prisma.Decimal(0);

		// 11. Net amount
		const netAmount = grossAmount
			.sub(retentionAmount)
			.sub(advanceDeduction)
			.sub(penaltyAmount)
			.sub(otherDeductionsAmount)
			.add(vatAmount);

		if (netAmount.lt(0)) {
			throw new Error("NET_AMOUNT_NEGATIVE");
		}

		// 12. Create claim + items
		const claim = await tx.subcontractClaim.create({
			data: {
				organizationId: data.organizationId,
				contractId: data.contractId,
				createdById: data.createdById,
				claimNo,
				title: data.title,
				periodStart: data.periodStart,
				periodEnd: data.periodEnd,
				claimType: data.claimType ?? "INTERIM",
				notes: data.notes,
				penaltyAmount,
				otherDeductions: otherDeductionsAmount,
				otherDeductionsNote: data.otherDeductionsNote,
				grossAmount,
				retentionAmount,
				advanceDeduction,
				vatAmount,
				netAmount,
				items: {
					create: claimItemsData.map((item) => ({
						organizationId: item.organizationId,
						contractItemId: item.contractItemId,
						contractQty: item.contractQty,
						unitPrice: item.unitPrice,
						prevCumulativeQty: item.prevCumulativeQty,
						thisQty: item.thisQty,
						thisAmount: item.thisAmount,
					})),
				},
			},
			include: {
				items: true,
			},
		});

		return claim;
	});
}

/**
 * Update a subcontract claim (DRAFT only)
 */
export async function updateSubcontractClaim(
	id: string,
	organizationId: string,
	data: {
		title?: string;
		periodStart?: Date;
		periodEnd?: Date;
		claimType?: SubcontractClaimType;
		notes?: string | null;
		penaltyAmount?: number;
		otherDeductions?: number;
		otherDeductionsNote?: string | null;
		items?: Array<{
			contractItemId: string;
			thisQty: number;
		}>;
	},
) {
	return db.$transaction(async (tx) => {
		const claim = await tx.subcontractClaim.findUnique({
			where: { id, organizationId },
			include: { contract: true },
		});
		if (!claim) throw new Error("CLAIM_NOT_FOUND");
		if (claim.status !== "DRAFT") throw new Error("CLAIM_NOT_DRAFT");

		// Lock the contract row to prevent concurrent updates from racing
		await tx.$queryRawUnsafe(
			`SELECT id FROM subcontract_contracts WHERE id = $1 FOR UPDATE`,
			claim.contractId,
		);

		const updateData: Record<string, unknown> = {};
		if (data.title !== undefined) updateData.title = data.title;
		if (data.periodStart !== undefined) updateData.periodStart = data.periodStart;
		if (data.periodEnd !== undefined) updateData.periodEnd = data.periodEnd;
		if (data.claimType !== undefined) updateData.claimType = data.claimType;
		if (data.notes !== undefined) updateData.notes = data.notes;
		if (data.penaltyAmount !== undefined) updateData.penaltyAmount = new Prisma.Decimal(data.penaltyAmount);
		if (data.otherDeductions !== undefined) updateData.otherDeductions = new Prisma.Decimal(data.otherDeductions);
		if (data.otherDeductionsNote !== undefined) updateData.otherDeductionsNote = data.otherDeductionsNote;

		// If items are being updated, recalculate everything
		if (data.items) {
			// Delete existing items
			await tx.subcontractClaimItem.deleteMany({ where: { claimId: id } });

			// Get contract items
			const contractItems = await tx.subcontractItem.findMany({
				where: {
					contractId: claim.contractId,
					id: { in: data.items.map((i) => i.contractItemId) },
				},
			});
			const itemMap = new Map(contractItems.map((i) => [i.id, i]));

			// Get prev cumulative from approved claims
			const approvedClaimItems = await tx.subcontractClaimItem.findMany({
				where: {
					claim: {
						contractId: claim.contractId,
						status: { in: ["APPROVED", "PARTIALLY_PAID", "PAID"] },
						id: { not: id },
					},
					contractItemId: { in: data.items.map((i) => i.contractItemId) },
				},
				select: { contractItemId: true, thisQty: true },
			});

			const prevQtyMap = new Map<string, Prisma.Decimal>();
			for (const ci of approvedClaimItems) {
				const current = prevQtyMap.get(ci.contractItemId) ?? new Prisma.Decimal(0);
				prevQtyMap.set(ci.contractItemId, current.add(ci.thisQty));
			}

			let grossAmount = new Prisma.Decimal(0);
			const claimItemsData: Prisma.SubcontractClaimItemCreateManyInput[] = [];

			for (const item of data.items) {
				if (item.thisQty <= 0) continue;
				const contractItem = itemMap.get(item.contractItemId);
				if (!contractItem) continue;

				const prevCumQty = prevQtyMap.get(item.contractItemId) ?? new Prisma.Decimal(0);
				const thisQty = new Prisma.Decimal(item.thisQty);
				const cumulativeQty = prevCumQty.add(thisQty);

				if (cumulativeQty.gt(contractItem.contractQty)) {
					throw new Error(`QTY_EXCEEDS_REMAINING:${item.contractItemId}`);
				}

				const thisAmount = thisQty.mul(contractItem.unitPrice);
				grossAmount = grossAmount.add(thisAmount);

				claimItemsData.push({
					organizationId,
					claimId: id,
					contractItemId: item.contractItemId,
					contractQty: contractItem.contractQty,
					unitPrice: contractItem.unitPrice,
					prevCumulativeQty: prevCumQty,
					thisQty,
					thisAmount,
				});
			}

			if (claimItemsData.length === 0) throw new Error("NO_ITEMS_ADDED");

			// Recalculate deductions
			const contract = claim.contract;
			const retentionPercent = contract.retentionPercent ? Number(contract.retentionPercent) : 0;
			let retentionAmount = grossAmount.mul(retentionPercent).div(100);

			if (contract.retentionCapPercent) {
				const capAmount = new Prisma.Decimal(Number(contract.value))
					.mul(Number(contract.retentionCapPercent)).div(100);
				const prevRetention = await tx.subcontractClaim.aggregate({
					where: {
						contractId: claim.contractId,
						status: { in: ["APPROVED", "PARTIALLY_PAID", "PAID"] },
						id: { not: id },
					},
					_sum: { retentionAmount: true },
				});
				const totalRetentionSoFar = prevRetention._sum.retentionAmount ?? new Prisma.Decimal(0);
				const remainingCap = capAmount.sub(totalRetentionSoFar);
				if (remainingCap.lte(0)) retentionAmount = new Prisma.Decimal(0);
				else if (retentionAmount.gt(remainingCap)) retentionAmount = remainingCap;
			}

			let advanceDeduction = new Prisma.Decimal(0);
			if (contract.advancePaymentPercent && contract.advancePaymentAmount) {
				advanceDeduction = grossAmount.mul(Number(contract.advancePaymentPercent)).div(100);
				const prevAdv = await tx.subcontractClaim.aggregate({
					where: {
						contractId: claim.contractId,
						status: { in: ["APPROVED", "PARTIALLY_PAID", "PAID"] },
						id: { not: id },
					},
					_sum: { advanceDeduction: true },
				});
				const totalRecovered = prevAdv._sum.advanceDeduction ?? new Prisma.Decimal(0);
				const remaining = contract.advancePaymentAmount.sub(totalRecovered);
				if (remaining.lte(0)) advanceDeduction = new Prisma.Decimal(0);
				else if (advanceDeduction.gt(remaining)) advanceDeduction = remaining;
			}

			const penaltyAmt = data.penaltyAmount !== undefined
				? new Prisma.Decimal(data.penaltyAmount)
				: claim.penaltyAmount;
			const otherDedAmt = data.otherDeductions !== undefined
				? new Prisma.Decimal(data.otherDeductions)
				: claim.otherDeductions;

			const vatPercent = contract.vatPercent ? Number(contract.vatPercent) : 0;
			const taxable = grossAmount.sub(retentionAmount).sub(advanceDeduction).sub(penaltyAmt).sub(otherDedAmt);
			const vatAmount = taxable.gt(0) ? taxable.mul(vatPercent).div(100) : new Prisma.Decimal(0);
			const netAmount = grossAmount.sub(retentionAmount).sub(advanceDeduction).sub(penaltyAmt).sub(otherDedAmt).add(vatAmount);

			if (netAmount.lt(0)) throw new Error("NET_AMOUNT_NEGATIVE");

			updateData.grossAmount = grossAmount;
			updateData.retentionAmount = retentionAmount;
			updateData.advanceDeduction = advanceDeduction;
			updateData.vatAmount = vatAmount;
			updateData.netAmount = netAmount;

			await tx.subcontractClaimItem.createMany({ data: claimItemsData });
		}

		return tx.subcontractClaim.update({
			where: { id },
			data: updateData,
			include: { items: true },
		});
	});
}

/**
 * Update subcontract claim status with workflow validation
 * Uses $transaction + FOR UPDATE to prevent concurrent approval race conditions
 */
export async function updateSubcontractClaimStatus(
	id: string,
	organizationId: string,
	newStatus: SubcontractClaimStatus,
	options?: {
		rejectionReason?: string;
		approvedById?: string;
	},
) {
	return db.$transaction(async (tx) => {
		const claim = await tx.subcontractClaim.findUnique({
			where: { id, organizationId },
			select: {
				id: true,
				status: true,
				contractId: true,
				grossAmount: true,
				items: {
					select: {
						contractItemId: true,
						thisQty: true,
						contractQty: true,
					},
				},
			},
		});
		if (!claim) throw new Error("CLAIM_NOT_FOUND");

		// Validate workflow transitions
		const allowedTransitions: Record<string, string[]> = {
			DRAFT: ["SUBMITTED"],
			SUBMITTED: ["UNDER_REVIEW", "APPROVED", "REJECTED"],
			UNDER_REVIEW: ["APPROVED", "REJECTED"],
			APPROVED: ["PARTIALLY_PAID", "PAID"],
			REJECTED: ["DRAFT"],
			PARTIALLY_PAID: ["PAID"],
			PAID: [],
			CANCELLED: [],
		};

		const allowed = allowedTransitions[claim.status] ?? [];
		if (!allowed.includes(newStatus)) {
			throw new Error(`INVALID_TRANSITION:${claim.status}:${newStatus}`);
		}

		// If approving, lock the contract and re-validate ceiling
		if (newStatus === "APPROVED") {
			await tx.$queryRawUnsafe(
				`SELECT id FROM subcontract_contracts WHERE id = $1 FOR UPDATE`,
				claim.contractId,
			);

			// Re-validate each item's cumulative qty against contract qty
			for (const item of claim.items) {
				const approvedQtyResult = await tx.subcontractClaimItem.aggregate({
					where: {
						contractItemId: item.contractItemId,
						claim: {
							contractId: claim.contractId,
							status: { in: ["APPROVED", "PARTIALLY_PAID", "PAID"] },
						},
					},
					_sum: { thisQty: true },
				});
				const approvedCumQty = approvedQtyResult._sum.thisQty ?? new Prisma.Decimal(0);
				const newCumQty = approvedCumQty.add(item.thisQty);

				if (newCumQty.gt(item.contractQty)) {
					throw new Error(`QTY_EXCEEDS_REMAINING:${item.contractItemId}`);
				}
			}
		}

		const updateData: Record<string, unknown> = { status: newStatus };

		if (newStatus === "SUBMITTED") {
			updateData.submittedAt = new Date();
		} else if (newStatus === "APPROVED") {
			updateData.approvedAt = new Date();
			if (options?.approvedById) updateData.approvedById = options.approvedById;
		} else if (newStatus === "REJECTED") {
			updateData.rejectionReason = options?.rejectionReason ?? null;
		} else if (newStatus === "DRAFT") {
			// Return to draft: clear submission/approval data
			updateData.submittedAt = null;
			updateData.approvedAt = null;
			updateData.approvedById = null;
			updateData.rejectionReason = null;
		}

		return tx.subcontractClaim.update({
			where: { id },
			data: updateData,
		});
	});
}

/**
 * Delete a subcontract claim (DRAFT only)
 */
export async function deleteSubcontractClaim(
	id: string,
	organizationId: string,
) {
	const claim = await db.subcontractClaim.findUnique({
		where: { id, organizationId },
		select: { status: true },
	});
	if (!claim) throw new Error("CLAIM_NOT_FOUND");
	if (claim.status !== "DRAFT") throw new Error("CLAIM_NOT_DRAFT");

	return db.subcontractClaim.delete({ where: { id } });
}

/**
 * Get financial summary for a contract
 */
export async function getSubcontractClaimSummary(
	contractId: string,
	organizationId: string,
) {
	const contract = await db.subcontractContract.findUnique({
		where: { id: contractId, organizationId },
		select: { value: true },
	});
	if (!contract) throw new Error("CONTRACT_NOT_FOUND");

	const claimsAgg = await db.subcontractClaim.aggregate({
		where: {
			contractId,
			organizationId,
			status: { in: ["APPROVED", "PARTIALLY_PAID", "PAID"] },
		},
		_sum: {
			grossAmount: true,
			netAmount: true,
			paidAmount: true,
			retentionAmount: true,
			advanceDeduction: true,
		},
	});

	const contractValue = Number(contract.value);
	const totalClaimed = Number(claimsAgg._sum.grossAmount ?? 0);
	const totalNetClaimed = Number(claimsAgg._sum.netAmount ?? 0);
	const totalPaid = Number(claimsAgg._sum.paidAmount ?? 0);
	const totalRetentionHeld = Number(claimsAgg._sum.retentionAmount ?? 0);
	const totalAdvanceRecovered = Number(claimsAgg._sum.advanceDeduction ?? 0);

	return {
		contractValue,
		totalClaimed,
		totalNetClaimed,
		totalPaid,
		totalRetentionHeld,
		totalAdvanceRecovered,
		totalOutstanding: totalNetClaimed - totalPaid,
		completionPercent: contractValue > 0
			? Math.round((totalClaimed / contractValue) * 10000) / 100
			: 0,
		remainingContractValue: contractValue - totalClaimed,
	};
}

/**
 * Add a payment to an approved claim
 */
export async function addSubcontractClaimPayment(data: {
	organizationId: string;
	claimId: string;
	createdById: string;
	amount: number;
	date: Date;
	paymentMethod: PaymentMethod;
	sourceAccountId?: string | null;
	description?: string | null;
}) {
	return db.$transaction(async (tx) => {
		// 1. Get claim
		const claim = await tx.subcontractClaim.findUnique({
			where: { id: data.claimId, organizationId: data.organizationId },
			select: {
				id: true, contractId: true, netAmount: true, paidAmount: true,
				status: true, claimNo: true,
			},
		});
		if (!claim) throw new Error("CLAIM_NOT_FOUND");

		if (!["APPROVED", "PARTIALLY_PAID"].includes(claim.status)) {
			throw new Error("CLAIM_NOT_PAYABLE");
		}

		// 2. Validate amount
		const maxPayable = Number(claim.netAmount) - Number(claim.paidAmount);
		if (data.amount > maxPayable + 0.01) {
			throw new Error(`AMOUNT_EXCEEDS_OUTSTANDING:${maxPayable}`);
		}

		// 3. Generate payment number
		const paymentCount = await tx.subcontractPayment.count({
			where: { contractId: claim.contractId },
		});
		const paymentNo = `PAY-${String(paymentCount + 1).padStart(4, "0")}`;

		// 4. Create payment
		const payment = await tx.subcontractPayment.create({
			data: {
				organizationId: data.organizationId,
				contractId: claim.contractId,
				claimId: data.claimId,
				createdById: data.createdById,
				paymentNo,
				amount: data.amount,
				date: data.date,
				paymentMethod: data.paymentMethod,
				sourceAccountId: data.sourceAccountId,
				description: data.description,
			},
		});

		// 5. Update claim paidAmount and status
		const newPaidAmount = Number(claim.paidAmount) + data.amount;
		const newStatus = newPaidAmount >= Number(claim.netAmount) - 0.01
			? "PAID"
			: "PARTIALLY_PAID";

		await tx.subcontractClaim.update({
			where: { id: data.claimId },
			data: {
				paidAmount: newPaidAmount,
				status: newStatus as SubcontractClaimStatus,
			},
		});

		// 6. Deduct from bank account if specified
		if (data.sourceAccountId) {
			await tx.organizationBank.update({
				where: { id: data.sourceAccountId },
				data: {
					balance: { decrement: data.amount },
				},
			});
		}

		return { ...payment, amount: Number(payment.amount) };
	});
}

/**
 * Get all data needed for printing a claim in one query
 */
export async function getClaimPrintData(
	claimId: string,
	organizationId: string,
) {
	const claim = await db.subcontractClaim.findUnique({
		where: { id: claimId, organizationId },
		include: {
			items: {
				include: {
					contractItem: {
						select: { id: true, itemCode: true, description: true, descriptionEn: true, unit: true },
					},
				},
				orderBy: { contractItem: { sortOrder: "asc" } },
			},
			createdBy: { select: { name: true } },
			approvedBy: { select: { name: true } },
		},
	});

	if (!claim) return null;

	// Get contract with project and change orders
	const contract = await db.subcontractContract.findUnique({
		where: { id: claim.contractId },
		include: {
			project: {
				select: { id: true, name: true, location: true, startDate: true, endDate: true },
			},
			changeOrders: {
				where: { status: "APPROVED" },
				select: { amount: true },
			},
		},
	});
	if (!contract) return null;

	// Get organization
	const organization = await db.organization.findUnique({
		where: { id: organizationId },
		select: {
			name: true, logo: true, address: true, city: true, phone: true,
			commercialRegister: true, taxNumber: true,
		},
	});

	// Get cumulative summary from previously approved claims
	const approvedClaims = await db.subcontractClaim.findMany({
		where: {
			contractId: claim.contractId,
			organizationId,
			status: { in: ["APPROVED", "PARTIALLY_PAID", "PAID"] },
		},
		select: { id: true, claimNo: true, grossAmount: true, paidAmount: true, retentionAmount: true },
		orderBy: { claimNo: "asc" },
	});

	const previousClaims = approvedClaims.filter((c) => c.claimNo < claim.claimNo);
	const previousClaimsGross = previousClaims.reduce((sum, c) => sum + Number(c.grossAmount), 0);
	const previousClaimsPaid = previousClaims.reduce((sum, c) => sum + Number(c.paidAmount), 0);
	const totalRetentionHeld = approvedClaims.reduce((sum, c) => sum + Number(c.retentionAmount), 0);

	const changeOrdersTotal = contract.changeOrders.reduce((sum: number, co) => sum + Number(co.amount), 0);
	const contractValue = Number(contract.value);

	return {
		organization,
		project: contract.project,
		contract: {
			contractNo: contract.contractNo,
			name: contract.companyName ?? contract.name,
			contractorType: contract.contractorType,
			value: contractValue,
			changeOrdersTotal,
			adjustedValue: contractValue + changeOrdersTotal,
			scopeOfWork: contract.scopeOfWork,
			retentionPercent: contract.retentionPercent ? Number(contract.retentionPercent) : 0,
			advancePaymentPercent: contract.advancePaymentPercent ? Number(contract.advancePaymentPercent) : 0,
			vatPercent: contract.vatPercent ? Number(contract.vatPercent) : 0,
		},
		claim: {
			id: claim.id,
			claimNo: claim.claimNo,
			title: claim.title,
			claimType: claim.claimType,
			status: claim.status,
			periodStart: claim.periodStart,
			periodEnd: claim.periodEnd,
			grossAmount: Number(claim.grossAmount),
			retentionAmount: Number(claim.retentionAmount),
			advanceDeduction: Number(claim.advanceDeduction),
			penaltyAmount: Number(claim.penaltyAmount),
			otherDeductions: Number(claim.otherDeductions),
			otherDeductionsNote: claim.otherDeductionsNote,
			vatAmount: Number(claim.vatAmount),
			netAmount: Number(claim.netAmount),
			paidAmount: Number(claim.paidAmount),
			notes: claim.notes,
			createdBy: claim.createdBy,
			approvedBy: claim.approvedBy,
			approvedAt: claim.approvedAt,
			items: claim.items.map((item) => ({
				id: item.id,
				contractItem: item.contractItem,
				contractQty: Number(item.contractQty),
				unitPrice: Number(item.unitPrice),
				prevCumulativeQty: Number(item.prevCumulativeQty),
				thisQty: Number(item.thisQty),
				thisAmount: Number(item.thisAmount),
				cumulativeQty: Number(item.prevCumulativeQty) + Number(item.thisQty),
				cumulativeAmount: (Number(item.prevCumulativeQty) + Number(item.thisQty)) * Number(item.unitPrice),
				prevCumulativeAmount: Number(item.prevCumulativeQty) * Number(item.unitPrice),
				completionPercent: Number(item.contractQty) > 0
					? Math.round(((Number(item.prevCumulativeQty) + Number(item.thisQty)) / Number(item.contractQty)) * 10000) / 100
					: 0,
			})),
		},
		cumulative: {
			totalClaimsCount: approvedClaims.length + (claim.status === "DRAFT" || claim.status === "SUBMITTED" || claim.status === "UNDER_REVIEW" ? 1 : 0),
			currentClaimNumber: claim.claimNo,
			previousClaimsGross,
			previousClaimsPaid,
			totalRetentionHeld,
		},
	};
}

/**
 * Mark claim as printed
 */
export async function markClaimAsPrinted(
	claimId: string,
	organizationId: string,
) {
	return db.subcontractClaim.update({
		where: { id: claimId, organizationId },
		data: { printedAt: new Date() },
	});
}
