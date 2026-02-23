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
 * Set contract payment terms (delete-and-recreate)
 */
export async function setContractPaymentTerms(
	contractId: string,
	terms: Array<{
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
		// Delete existing terms
		await tx.contractPaymentTerm.deleteMany({
			where: { contractId },
		});

		// Create new terms
		if (terms.length > 0) {
			await tx.contractPaymentTerm.createMany({
				data: terms.map((term, index) => ({
					contractId,
					type: term.type,
					label: term.label ?? null,
					percent: term.percent ?? null,
					amount: term.amount ?? null,
					dueDate: term.dueDate ?? null,
					milestoneId: term.milestoneId ?? null,
					sortOrder: term.sortOrder ?? index,
				})),
			});
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
