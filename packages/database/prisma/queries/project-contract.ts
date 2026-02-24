import { db } from "../client";

// ═══════════════════════════════════════════════════════════════════════════
// Project Contract Queries - العقد الرئيسي
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate next contract number for an organization (CON-001, CON-002, ...)
 */
export async function generateContractNo(organizationId: string): Promise<string> {
	const count = await db.projectContract.count({ where: { organizationId } });
	return `CON-${String(count + 1).padStart(3, "0")}`;
}

/**
 * Get project contract with payment terms
 */
export async function getProjectContract(
	organizationId: string,
	projectId: string,
) {
	const contract = await db.projectContract.findFirst({
		where: { organizationId, projectId },
		include: {
			paymentTerms: { orderBy: { sortOrder: "asc" } },
			createdBy: { select: { id: true, name: true } },
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
		retentionCap: contract.retentionCap
			? Number(contract.retentionCap)
			: null,
		performanceBondPercent: contract.performanceBondPercent
			? Number(contract.performanceBondPercent)
			: null,
		performanceBondAmount: contract.performanceBondAmount
			? Number(contract.performanceBondAmount)
			: null,
		penaltyPercent: contract.penaltyPercent
			? Number(contract.penaltyPercent)
			: null,
		penaltyCapPercent: contract.penaltyCapPercent
			? Number(contract.penaltyCapPercent)
			: null,
		paymentTerms: contract.paymentTerms.map((term) => ({
			...term,
			percent: term.percent ? Number(term.percent) : null,
			amount: term.amount ? Number(term.amount) : null,
		})),
	};
}

/**
 * Upsert project contract (create or update)
 * Also syncs Project.contractValue
 */
export async function upsertProjectContract(data: {
	organizationId: string;
	projectId: string;
	createdById: string;
	contractNo?: string | null;
	title?: string | null;
	clientName?: string | null;
	description?: string | null;
	status?: "DRAFT" | "ACTIVE" | "SUSPENDED" | "CLOSED";
	value: number;
	currency?: string;
	signedDate?: Date | null;
	startDate?: Date | null;
	endDate?: Date | null;
	retentionPercent?: number | null;
	retentionCap?: number | null;
	retentionReleaseDays?: number | null;
	notes?: string | null;
	includesVat?: boolean;
	vatPercent?: number | null;
	paymentMethod?:
		| "CASH"
		| "BANK_TRANSFER"
		| "CHEQUE"
		| "CREDIT_CARD"
		| "OTHER"
		| null;
	performanceBondPercent?: number | null;
	performanceBondAmount?: number | null;
	insuranceRequired?: boolean;
	insuranceDetails?: string | null;
	scopeOfWork?: string | null;
	penaltyPercent?: number | null;
	penaltyCapPercent?: number | null;
}) {
	// Fields used for both create and update
	const coreFields = {
		value: data.value,
		signedDate: data.signedDate ?? null,
		startDate: data.startDate ?? null,
		endDate: data.endDate ?? null,
		retentionPercent: data.retentionPercent ?? null,
		retentionCap: data.retentionCap ?? null,
		retentionReleaseDays: data.retentionReleaseDays ?? null,
		notes: data.notes ?? null,
		includesVat: data.includesVat ?? false,
		vatPercent: data.vatPercent ?? null,
		paymentMethod: data.paymentMethod ?? null,
		performanceBondPercent: data.performanceBondPercent ?? null,
		performanceBondAmount: data.performanceBondAmount ?? null,
		insuranceRequired: data.insuranceRequired ?? false,
		insuranceDetails: data.insuranceDetails ?? null,
		scopeOfWork: data.scopeOfWork ?? null,
		penaltyPercent: data.penaltyPercent ?? null,
		penaltyCapPercent: data.penaltyCapPercent ?? null,
	};

	// Build update payload — only include optional text fields if explicitly provided
	const updatePayload: Record<string, unknown> = { ...coreFields };
	if (data.status !== undefined) updatePayload.status = data.status;
	if (data.contractNo !== undefined)
		updatePayload.contractNo = data.contractNo;
	if (data.currency !== undefined) updatePayload.currency = data.currency;
	if (data.title !== undefined) updatePayload.title = data.title;
	if (data.clientName !== undefined)
		updatePayload.clientName = data.clientName;
	if (data.description !== undefined)
		updatePayload.description = data.description;

	return db.$transaction(async (tx) => {
		const contract = await tx.projectContract.upsert({
			where: { projectId: data.projectId },
			create: {
				organizationId: data.organizationId,
				projectId: data.projectId,
				createdById: data.createdById,
				contractNo: data.contractNo ?? null,
				title: data.title ?? null,
				clientName: data.clientName ?? null,
				description: data.description ?? null,
				currency: data.currency ?? "SAR",
				status: data.status ?? "DRAFT",
				...coreFields,
			},
			update: updatePayload,
			include: {
				createdBy: { select: { id: true, name: true } },
			},
		});

		// Sync Project.contractValue
		await tx.project.update({
			where: { id: data.projectId },
			data: { contractValue: data.value },
		});

		return {
			...contract,
			value: Number(contract.value),
			vatPercent: contract.vatPercent ? Number(contract.vatPercent) : null,
			retentionPercent: contract.retentionPercent
				? Number(contract.retentionPercent)
				: null,
			retentionCap: contract.retentionCap
				? Number(contract.retentionCap)
				: null,
			performanceBondPercent: contract.performanceBondPercent
				? Number(contract.performanceBondPercent)
				: null,
			performanceBondAmount: contract.performanceBondAmount
				? Number(contract.performanceBondAmount)
				: null,
			penaltyPercent: contract.penaltyPercent
				? Number(contract.penaltyPercent)
				: null,
			penaltyCapPercent: contract.penaltyCapPercent
				? Number(contract.penaltyCapPercent)
				: null,
		};
	});
}

/**
 * Set contract payment terms (upsert-based to preserve IDs for linked payments)
 */
export async function setContractPaymentTerms(
	contractId: string,
	terms: Array<{
		id?: string | null;
		type: "ADVANCE" | "MILESTONE" | "MONTHLY" | "COMPLETION" | "CUSTOM";
		label?: string | null;
		percent?: number | null;
		amount?: number | null;
		dueDate?: Date | null;
		milestoneId?: string | null;
		sortOrder?: number;
	}>,
) {
	return db.$transaction(async (tx) => {
		// Collect IDs of terms that should be kept
		const incomingIds = terms
			.map((t) => t.id)
			.filter((id): id is string => !!id);

		// Delete only terms NOT in the incoming list
		await tx.contractPaymentTerm.deleteMany({
			where: {
				contractId,
				...(incomingIds.length > 0
					? { id: { notIn: incomingIds } }
					: {}),
			},
		});

		// Upsert each term: update existing, create new
		for (let i = 0; i < terms.length; i++) {
			const term = terms[i];
			const data = {
				type: term.type,
				label: term.label ?? null,
				percent: term.percent ?? null,
				amount: term.amount ?? null,
				dueDate: term.dueDate ?? null,
				milestoneId: term.milestoneId ?? null,
				sortOrder: term.sortOrder ?? i,
			};

			if (term.id) {
				await tx.contractPaymentTerm.upsert({
					where: { id: term.id },
					update: data,
					create: { ...data, contractId },
				});
			} else {
				await tx.contractPaymentTerm.create({
					data: { ...data, contractId },
				});
			}
		}

		// Return updated terms
		const updatedTerms = await tx.contractPaymentTerm.findMany({
			where: { contractId },
			orderBy: { sortOrder: "asc" },
		});

		return updatedTerms.map((term) => ({
			...term,
			percent: term.percent ? Number(term.percent) : null,
			amount: term.amount ? Number(term.amount) : null,
		}));
	});
}

/**
 * Get payment terms with progress (paid amount, remaining, etc.)
 * Uses two-step query to avoid nested include issues with PrismaPg adapter.
 */
export async function getPaymentTermsWithProgress(
	organizationId: string,
	projectId: string,
) {
	// Step 1: Get contract with payment terms (simple include, no nesting)
	const contract = await db.projectContract.findFirst({
		where: { organizationId, projectId },
		include: {
			paymentTerms: {
				orderBy: { sortOrder: "asc" },
			},
		},
	});

	if (!contract) return null;

	const termIds = contract.paymentTerms.map((t) => t.id);

	// Step 2: Fetch payments linked to these terms separately
	const payments =
		termIds.length > 0
			? await db.financePayment.findMany({
					where: {
						contractTermId: { in: termIds },
						status: "COMPLETED",
					},
					orderBy: { date: "desc" },
					select: {
						id: true,
						contractTermId: true,
						paymentNo: true,
						amount: true,
						date: true,
						paymentMethod: true,
						referenceNo: true,
						description: true,
						destinationAccount: {
							select: { id: true, name: true },
						},
						createdBy: { select: { id: true, name: true } },
					},
				})
			: [];

	// Group payments by contractTermId
	const paymentsByTermId = new Map<string, typeof payments>();
	for (const p of payments) {
		if (!p.contractTermId) continue;
		const existing = paymentsByTermId.get(p.contractTermId) ?? [];
		existing.push(p);
		paymentsByTermId.set(p.contractTermId, existing);
	}

	const contractValue = Number(contract.value);
	const totalWithVat = contract.includesVat
		? contractValue * 1.15
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
				destinationAccount: p.destinationAccount,
				createdBy: p.createdBy,
			})),
		};
	});

	return {
		contractId: contract.id,
		contractValue,
		totalWithVat,
		clientName: contract.clientName,
		currency: contract.currency,
		totalPaid: totalPaidAll,
		totalRequired: totalRequiredAll,
		overallProgress:
			totalRequiredAll > 0
				? Math.min(100, (totalPaidAll / totalRequiredAll) * 100)
				: 0,
		nextIncompleteTermId,
		terms,
	};
}

/**
 * Get contract summary with change order impact
 */
export async function getContractSummary(
	organizationId: string,
	projectId: string,
) {
	const [contract, approvedCOImpact] = await Promise.all([
		db.projectContract.findFirst({
			where: { organizationId, projectId },
			select: {
				value: true,
				retentionPercent: true,
				retentionCap: true,
			},
		}),
		db.projectChangeOrder.aggregate({
			where: {
				organizationId,
				projectId,
				status: { in: ["APPROVED", "IMPLEMENTED"] },
				costImpact: { not: null },
			},
			_sum: { costImpact: true },
		}),
	]);

	if (!contract) {
		return {
			originalValue: 0,
			approvedCOImpact: 0,
			adjustedValue: 0,
			retentionPercent: 0,
			retentionAmount: 0,
		};
	}

	const originalValue = Number(contract.value);
	const coImpact = approvedCOImpact._sum.costImpact
		? Number(approvedCOImpact._sum.costImpact)
		: 0;
	const adjustedValue = originalValue + coImpact;
	const retentionPercent = contract.retentionPercent
		? Number(contract.retentionPercent)
		: 0;

	let retentionAmount = (adjustedValue * retentionPercent) / 100;
	if (contract.retentionCap) {
		const cap = Number(contract.retentionCap);
		if (retentionAmount > cap) {
			retentionAmount = cap;
		}
	}

	return {
		originalValue,
		approvedCOImpact: coImpact,
		adjustedValue,
		retentionPercent,
		retentionAmount,
	};
}
