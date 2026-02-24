import type { PaymentMethod, PaymentTermType } from "../generated/client";
import { db } from "../client";

// ═══════════════════════════════════════════════════════════════════════════
// Subcontract Contract Queries - إدارة مقاولي الباطن
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate next subcontract number (SUB-YYYY-0001, SUB-YYYY-0002, ...)
 */
export async function generateSubcontractNo(
	organizationId: string,
): Promise<string> {
	const year = new Date().getFullYear();
	const count = await db.subcontractContract.count({
		where: { organizationId },
	});
	return `SUB-${year}-${String(count + 1).padStart(4, "0")}`;
}

/**
 * Get all subcontract contracts for a project
 */
export async function getSubcontractContracts(
	organizationId: string,
	projectId: string,
) {
	const contracts = await db.subcontractContract.findMany({
		where: { organizationId, projectId },
		include: {
			createdBy: { select: { id: true, name: true } },
			_count: {
				select: {
					paymentTerms: true,
					changeOrders: true,
					payments: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	// Get payment totals for each contract
	const contractIds = contracts.map((c) => c.id);
	const paymentTotals =
		contractIds.length > 0
			? await db.subcontractPayment.groupBy({
					by: ["contractId"],
					where: {
						contractId: { in: contractIds },
						status: "COMPLETED",
					},
					_sum: { amount: true },
				})
			: [];

	// Get approved change order totals
	const coTotals =
		contractIds.length > 0
			? await db.subcontractChangeOrder.groupBy({
					by: ["contractId"],
					where: {
						contractId: { in: contractIds },
						status: "APPROVED",
					},
					_sum: { amount: true },
				})
			: [];

	const paymentMap = new Map(
		paymentTotals.map((p) => [
			p.contractId,
			p._sum.amount ? Number(p._sum.amount) : 0,
		]),
	);
	const coMap = new Map(
		coTotals.map((c) => [
			c.contractId,
			c._sum.amount ? Number(c._sum.amount) : 0,
		]),
	);

	return contracts.map((c) => {
		const value = Number(c.value);
		const coImpact = coMap.get(c.id) ?? 0;
		const adjustedValue = value + coImpact;
		const totalPaid = paymentMap.get(c.id) ?? 0;
		const remaining = adjustedValue - totalPaid;

		return {
			...c,
			value,
			vatPercent: c.vatPercent ? Number(c.vatPercent) : null,
			retentionPercent: c.retentionPercent
				? Number(c.retentionPercent)
				: null,
			totalPaid,
			coImpact,
			adjustedValue,
			remaining,
		};
	});
}

/**
 * Get subcontract by ID with all relations
 */
export async function getSubcontractById(
	id: string,
	organizationId: string,
	projectId: string,
) {
	const contract = await db.subcontractContract.findFirst({
		where: { id, organizationId, projectId },
		include: {
			createdBy: { select: { id: true, name: true } },
			paymentTerms: { orderBy: { sortOrder: "asc" } },
			changeOrders: {
				orderBy: { orderNo: "asc" },
				include: {
					createdBy: { select: { id: true, name: true } },
				},
			},
			payments: {
				orderBy: { date: "desc" },
				include: {
					term: { select: { id: true, label: true, type: true } },
					sourceAccount: { select: { id: true, name: true } },
					createdBy: { select: { id: true, name: true } },
				},
			},
		},
	});

	if (!contract) return null;

	return {
		...contract,
		value: Number(contract.value),
		vatPercent: contract.vatPercent ? Number(contract.vatPercent) : null,
		retentionPercent: contract.retentionPercent
			? Number(contract.retentionPercent)
			: null,
		paymentTerms: contract.paymentTerms.map((t) => ({
			...t,
			percent: t.percent ? Number(t.percent) : null,
			amount: t.amount ? Number(t.amount) : null,
		})),
		changeOrders: contract.changeOrders.map((co) => ({
			...co,
			amount: Number(co.amount),
		})),
		payments: contract.payments.map((p) => ({
			...p,
			amount: Number(p.amount),
		})),
	};
}

/**
 * Create a new subcontract contract
 */
export async function createSubcontractContract(data: {
	organizationId: string;
	projectId: string;
	createdById: string;
	contractNo?: string | null;
	name: string;
	contractorType?: "COMPANY" | "INDIVIDUAL";
	companyName?: string | null;
	phone?: string | null;
	email?: string | null;
	taxNumber?: string | null;
	crNumber?: string | null;
	status?: "DRAFT" | "ACTIVE" | "SUSPENDED" | "COMPLETED" | "TERMINATED";
	value: number;
	startDate?: Date | null;
	endDate?: Date | null;
	signedDate?: Date | null;
	scopeOfWork?: string | null;
	notes?: string | null;
	includesVat?: boolean;
	vatPercent?: number | null;
	retentionPercent?: number | null;
	paymentMethod?: PaymentMethod | null;
	attachmentUrl?: string | null;
}) {
	return db.subcontractContract.create({
		data: {
			organizationId: data.organizationId,
			projectId: data.projectId,
			createdById: data.createdById,
			contractNo: data.contractNo ?? null,
			name: data.name,
			contractorType: data.contractorType ?? "COMPANY",
			companyName: data.companyName ?? null,
			phone: data.phone ?? null,
			email: data.email ?? null,
			taxNumber: data.taxNumber ?? null,
			crNumber: data.crNumber ?? null,
			status: data.status ?? "DRAFT",
			value: data.value,
			startDate: data.startDate ?? null,
			endDate: data.endDate ?? null,
			signedDate: data.signedDate ?? null,
			scopeOfWork: data.scopeOfWork ?? null,
			notes: data.notes ?? null,
			includesVat: data.includesVat ?? false,
			vatPercent: data.vatPercent ?? null,
			retentionPercent: data.retentionPercent ?? null,
			paymentMethod: data.paymentMethod ?? null,
			attachmentUrl: data.attachmentUrl ?? null,
		},
		include: {
			createdBy: { select: { id: true, name: true } },
		},
	});
}

/**
 * Update a subcontract contract
 */
export async function updateSubcontractContract(
	id: string,
	organizationId: string,
	projectId: string,
	data: Partial<{
		contractNo: string | null;
		name: string;
		contractorType: "COMPANY" | "INDIVIDUAL";
		companyName: string | null;
		phone: string | null;
		email: string | null;
		taxNumber: string | null;
		crNumber: string | null;
		status: "DRAFT" | "ACTIVE" | "SUSPENDED" | "COMPLETED" | "TERMINATED";
		value: number;
		startDate: Date | null;
		endDate: Date | null;
		signedDate: Date | null;
		scopeOfWork: string | null;
		notes: string | null;
		includesVat: boolean;
		vatPercent: number | null;
		retentionPercent: number | null;
		paymentMethod: PaymentMethod | null;
		attachmentUrl: string | null;
	}>,
) {
	const existing = await db.subcontractContract.findFirst({
		where: { id, organizationId, projectId },
	});
	if (!existing) throw new Error("Subcontract not found");

	return db.subcontractContract.update({
		where: { id },
		data,
		include: {
			createdBy: { select: { id: true, name: true } },
		},
	});
}

/**
 * Delete a subcontract contract
 */
export async function deleteSubcontractContract(
	id: string,
	organizationId: string,
	projectId: string,
) {
	const existing = await db.subcontractContract.findFirst({
		where: { id, organizationId, projectId },
	});
	if (!existing) throw new Error("Subcontract not found");

	await db.subcontractContract.delete({ where: { id } });
	return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// Payment Terms
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Set subcontract payment terms (upsert pattern - preserves IDs for linked payments)
 */
export async function setSubcontractPaymentTerms(
	contractId: string,
	terms: Array<{
		id?: string | null;
		type: PaymentTermType;
		label?: string | null;
		percent?: number | null;
		amount?: number | null;
		dueDate?: Date | null;
		sortOrder?: number;
	}>,
) {
	return db.$transaction(async (tx) => {
		const incomingIds = terms
			.map((t) => t.id)
			.filter((id): id is string => !!id);

		// Delete terms NOT in the incoming list
		await tx.subcontractPaymentTerm.deleteMany({
			where: {
				contractId,
				...(incomingIds.length > 0
					? { id: { notIn: incomingIds } }
					: {}),
			},
		});

		// Upsert each term
		for (let i = 0; i < terms.length; i++) {
			const term = terms[i];
			const termData = {
				type: term.type,
				label: term.label ?? null,
				percent: term.percent ?? null,
				amount: term.amount ?? null,
				dueDate: term.dueDate ?? null,
				sortOrder: term.sortOrder ?? i,
			};

			if (term.id) {
				await tx.subcontractPaymentTerm.upsert({
					where: { id: term.id },
					update: termData,
					create: { ...termData, contractId },
				});
			} else {
				await tx.subcontractPaymentTerm.create({
					data: { ...termData, contractId },
				});
			}
		}

		const updatedTerms = await tx.subcontractPaymentTerm.findMany({
			where: { contractId },
			orderBy: { sortOrder: "asc" },
		});

		return updatedTerms.map((t) => ({
			...t,
			percent: t.percent ? Number(t.percent) : null,
			amount: t.amount ? Number(t.amount) : null,
		}));
	});
}

/**
 * Get subcontract payment terms with payment progress
 */
export async function getSubcontractPaymentTermsProgress(
	contractId: string,
) {
	const contract = await db.subcontractContract.findFirst({
		where: { id: contractId },
		include: {
			paymentTerms: { orderBy: { sortOrder: "asc" } },
		},
	});

	if (!contract) return null;

	const termIds = contract.paymentTerms.map((t) => t.id);

	// Fetch payments linked to these terms
	const payments =
		termIds.length > 0
			? await db.subcontractPayment.findMany({
					where: {
						termId: { in: termIds },
						status: "COMPLETED",
					},
					orderBy: { date: "desc" },
					select: {
						id: true,
						termId: true,
						paymentNo: true,
						amount: true,
						date: true,
						paymentMethod: true,
						referenceNo: true,
						description: true,
						sourceAccount: { select: { id: true, name: true } },
						createdBy: { select: { id: true, name: true } },
					},
				})
			: [];

	// Also fetch unlinked payments
	const unlinkedPayments = await db.subcontractPayment.findMany({
		where: {
			contractId,
			termId: null,
			status: "COMPLETED",
		},
		orderBy: { date: "desc" },
		select: {
			id: true,
			termId: true,
			paymentNo: true,
			amount: true,
			date: true,
			paymentMethod: true,
			referenceNo: true,
			description: true,
			sourceAccount: { select: { id: true, name: true } },
			createdBy: { select: { id: true, name: true } },
		},
	});

	// Group payments by termId
	const paymentsByTermId = new Map<string, typeof payments>();
	for (const p of payments) {
		if (!p.termId) continue;
		const existing = paymentsByTermId.get(p.termId) ?? [];
		existing.push(p);
		paymentsByTermId.set(p.termId, existing);
	}

	const contractValue = Number(contract.value);
	const totalWithVat = contract.includesVat
		? contractValue * (1 + Number(contract.vatPercent ?? 15) / 100)
		: contractValue;

	let totalPaidAll = 0;
	let totalRequiredAll = 0;
	let nextIncompleteTermId: string | null = null;

	const terms = contract.paymentTerms.map((term) => {
		const termAmount = term.amount
			? Number(term.amount)
			: term.percent
				? (totalWithVat * Number(term.percent)) / 100
				: 0;

		const termPayments = paymentsByTermId.get(term.id) ?? [];
		const paidAmount = termPayments.reduce(
			(sum, p) => sum + Number(p.amount),
			0,
		);
		const remainingAmount = Math.max(0, termAmount - paidAmount);
		const progressPercent =
			termAmount > 0
				? Math.min(100, (paidAmount / termAmount) * 100)
				: 0;
		const isComplete = termAmount > 0 && paidAmount >= termAmount;

		totalPaidAll += paidAmount;
		totalRequiredAll += termAmount;

		if (!isComplete && !nextIncompleteTermId) {
			nextIncompleteTermId = term.id;
		}

		return {
			id: term.id,
			type: term.type,
			label: term.label,
			percent: term.percent ? Number(term.percent) : null,
			amount: termAmount,
			sortOrder: term.sortOrder,
			paidAmount,
			remainingAmount,
			progressPercent,
			isComplete,
			payments: termPayments.map((p) => ({
				id: p.id,
				paymentNo: p.paymentNo,
				amount: Number(p.amount),
				date: p.date,
				paymentMethod: p.paymentMethod,
				referenceNo: p.referenceNo,
				description: p.description,
				sourceAccount: p.sourceAccount,
				createdBy: p.createdBy,
			})),
		};
	});

	// Add unlinked payments to total
	const unlinkedTotal = unlinkedPayments.reduce(
		(sum, p) => sum + Number(p.amount),
		0,
	);
	totalPaidAll += unlinkedTotal;

	return {
		contractId: contract.id,
		contractValue,
		totalWithVat,
		totalPaid: totalPaidAll,
		totalRequired: totalRequiredAll,
		overallProgress:
			totalWithVat > 0
				? Math.min(100, (totalPaidAll / totalWithVat) * 100)
				: 0,
		nextIncompleteTermId,
		terms,
		unlinkedPayments: unlinkedPayments.map((p) => ({
			id: p.id,
			paymentNo: p.paymentNo,
			amount: Number(p.amount),
			date: p.date,
			paymentMethod: p.paymentMethod,
			referenceNo: p.referenceNo,
			description: p.description,
			sourceAccount: p.sourceAccount,
			createdBy: p.createdBy,
		})),
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// Change Orders
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a change order for a subcontract
 */
export async function createSubcontractChangeOrder(data: {
	contractId: string;
	createdById: string;
	description: string;
	amount: number;
	status?: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
	approvedDate?: Date | null;
	attachmentUrl?: string | null;
}) {
	// Get next order number
	const count = await db.subcontractChangeOrder.count({
		where: { contractId: data.contractId },
	});

	return db.subcontractChangeOrder.create({
		data: {
			contractId: data.contractId,
			createdById: data.createdById,
			orderNo: count + 1,
			description: data.description,
			amount: data.amount,
			status: data.status ?? "DRAFT",
			approvedDate: data.approvedDate ?? null,
			attachmentUrl: data.attachmentUrl ?? null,
		},
		include: {
			createdBy: { select: { id: true, name: true } },
		},
	});
}

/**
 * Update a change order
 */
export async function updateSubcontractChangeOrder(
	id: string,
	data: Partial<{
		description: string;
		amount: number;
		status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
		approvedDate: Date | null;
		attachmentUrl: string | null;
	}>,
) {
	return db.subcontractChangeOrder.update({
		where: { id },
		data,
		include: {
			createdBy: { select: { id: true, name: true } },
		},
	});
}

/**
 * Delete a change order
 */
export async function deleteSubcontractChangeOrder(id: string) {
	await db.subcontractChangeOrder.delete({ where: { id } });
	return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// Payments
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate subcontract payment number (SUBPAY-001, SUBPAY-002, ...)
 */
async function generateSubcontractPaymentNo(
	organizationId: string,
): Promise<string> {
	const count = await db.subcontractPayment.count({
		where: { organizationId },
	});
	return `SUBPAY-${String(count + 1).padStart(4, "0")}`;
}

/**
 * Create a subcontract payment (deducts from source bank account)
 */
export async function createSubcontractPayment(data: {
	organizationId: string;
	contractId: string;
	createdById: string;
	termId?: string | null;
	amount: number;
	date: Date;
	sourceAccountId?: string | null;
	paymentMethod?: PaymentMethod | null;
	referenceNo?: string | null;
	description?: string | null;
	notes?: string | null;
}) {
	const paymentNo = await generateSubcontractPaymentNo(data.organizationId);

	return db.$transaction(async (tx) => {
		const payment = await tx.subcontractPayment.create({
			data: {
				organizationId: data.organizationId,
				contractId: data.contractId,
				createdById: data.createdById,
				termId: data.termId ?? null,
				paymentNo,
				amount: data.amount,
				date: data.date,
				sourceAccountId: data.sourceAccountId ?? null,
				paymentMethod: data.paymentMethod ?? "BANK_TRANSFER",
				referenceNo: data.referenceNo ?? null,
				description: data.description ?? null,
				notes: data.notes ?? null,
				status: "COMPLETED",
			},
			include: {
				term: { select: { id: true, label: true, type: true } },
				sourceAccount: { select: { id: true, name: true } },
				createdBy: { select: { id: true, name: true } },
			},
		});

		// Deduct from source bank account if provided
		if (data.sourceAccountId) {
			await tx.organizationBank.update({
				where: { id: data.sourceAccountId },
				data: {
					balance: { decrement: data.amount },
				},
			});
		}

		return payment;
	});
}

/**
 * Get subcontracts summary for a project
 */
export async function getSubcontractsSummary(
	organizationId: string,
	projectId: string,
) {
	const [contractsAgg, paymentsAgg, approvedCOAgg] = await Promise.all([
		db.subcontractContract.aggregate({
			where: { organizationId, projectId },
			_sum: { value: true },
			_count: true,
		}),
		db.subcontractPayment.aggregate({
			where: {
				organizationId,
				contract: { projectId },
				status: "COMPLETED",
			},
			_sum: { amount: true },
		}),
		db.subcontractChangeOrder.aggregate({
			where: {
				contract: { organizationId, projectId },
				status: "APPROVED",
			},
			_sum: { amount: true },
		}),
	]);

	const totalValue = contractsAgg._sum.value
		? Number(contractsAgg._sum.value)
		: 0;
	const totalPaid = paymentsAgg._sum.amount
		? Number(paymentsAgg._sum.amount)
		: 0;
	const coImpact = approvedCOAgg._sum.amount
		? Number(approvedCOAgg._sum.amount)
		: 0;

	return {
		contractsCount: contractsAgg._count,
		totalValue,
		coImpact,
		adjustedValue: totalValue + coImpact,
		totalPaid,
		remaining: totalValue + coImpact - totalPaid,
	};
}
