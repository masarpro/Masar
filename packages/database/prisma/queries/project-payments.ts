import { db } from "../client";
import { Prisma } from "../generated/client";
import type { PaymentMethod } from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// Project Payments Queries - دفعات المشروع
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Round to 2 decimals (financial amounts are Decimal(15,2))
 */
function round2(value: number): number {
	return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Get project payments summary with contract + terms + totals
 */
export async function getProjectPaymentsSummary(
	organizationId: string,
	projectId: string,
) {
	const [contract, payments] = await Promise.all([
		db.projectContract.findUnique({
			where: { projectId },
			include: {
				paymentTerms: {
					orderBy: { sortOrder: "asc" },
					include: {
						projectPayments: {
							orderBy: { date: "desc" },
							include: {
								destinationAccount: { select: { id: true, name: true } },
								createdBy: { select: { id: true, name: true } },
							},
						},
					},
				},
			},
		}),
		db.projectPayment.findMany({
			where: { organizationId, projectId },
			orderBy: { date: "desc" },
			include: {
				contractTerm: { select: { id: true, label: true, type: true } },
				destinationAccount: { select: { id: true, name: true } },
				createdBy: { select: { id: true, name: true } },
			},
		}),
	]);

	const totalCollected = payments.reduce(
		(sum, p) => sum + Number(p.amount),
		0,
	);

	const contractValue = contract ? Number(contract.value) : 0;
	const retentionPercent = contract ? Number(contract.retentionPercent ?? 0) : 0;
	const retentionAmount = contractValue * (retentionPercent / 100);
	const remaining = contractValue - totalCollected;

	// Term payments (linked to a contract term)
	const termPayments = payments.filter((p) => p.contractTermId);
	// Free payments (not linked to any term)
	const freePayments = payments.filter((p) => !p.contractTermId);

	const terms = contract?.paymentTerms.map((term) => ({
		...term,
		percent: term.percent ? Number(term.percent) : null,
		amount: term.amount ? Number(term.amount) : null,
		paidAmount: Number(term.paidAmount),
		projectPayments: term.projectPayments.map((p) => ({
			...p,
			amount: Number(p.amount),
		})),
	})) ?? [];

	return {
		hasContract: !!contract,
		hasTerms: terms.length > 0,
		contractValue,
		retentionPercent,
		retentionAmount,
		totalCollected,
		remaining,
		collectionPercent: contractValue > 0
			? Math.round((totalCollected / contractValue) * 100)
			: 0,
		terms,
		freePayments: freePayments.map((p) => ({
			...p,
			amount: Number(p.amount),
		})),
		termPayments: termPayments.map((p) => ({
			...p,
			amount: Number(p.amount),
		})),
		allPayments: payments.map((p) => ({
			...p,
			amount: Number(p.amount),
		})),
	};
}

/**
 * List project payments with optional filters
 */
export async function listProjectPayments(
	organizationId: string,
	projectId: string,
	filters?: {
		contractTermId?: string;
		type?: "term" | "free";
	},
) {
	const where: Prisma.ProjectPaymentWhereInput = {
		organizationId,
		projectId,
	};

	if (filters?.contractTermId) {
		where.contractTermId = filters.contractTermId;
	}
	if (filters?.type === "term") {
		where.contractTermId = { not: null };
	}
	if (filters?.type === "free") {
		where.contractTermId = null;
	}

	const payments = await db.projectPayment.findMany({
		where,
		orderBy: { date: "desc" },
		include: {
			contractTerm: { select: { id: true, label: true, type: true } },
			destinationAccount: { select: { id: true, name: true } },
			createdBy: { select: { id: true, name: true } },
		},
	});

	return payments.map((p) => ({
		...p,
		amount: Number(p.amount),
	}));
}

/**
 * Create a project payment with term + bank updates in transaction.
 *
 * Spillover: when the payment is linked to a contract term that has a defined
 * amount, and the amount exceeds that term's remaining capacity, the excess
 * cascades forward into the following terms (by sortOrder). Each term that
 * receives an allocation gets its own ProjectPayment row so the per-term
 * payments list, edit/delete reversal, journals and receipt vouchers all stay
 * consistent. Any final remainder (payment larger than all remaining stages)
 * is attached to the last stage so no amount is lost.
 *
 * Returns the list of created rows (one per stage allocation), the primary
 * (first) row, and the split count.
 */
export async function createProjectPayment(data: {
	organizationId: string;
	projectId: string;
	createdById: string;
	contractTermId?: string | null;
	amount: number;
	date: Date;
	paymentMethod: PaymentMethod;
	referenceNo?: string | null;
	description?: string | null;
	destinationAccountId?: string | null;
	note?: string | null;
}) {
	const includeShape = {
		contractTerm: { select: { id: true, label: true, type: true } },
		destinationAccount: { select: { id: true, name: true } },
		createdBy: { select: { id: true, name: true } },
	} as const;

	return db.$transaction(async (tx) => {
		// Build the allocation plan (which term gets how much)
		let allocations: Array<{ contractTermId: string | null; amount: number }> =
			[];

		if (data.contractTermId) {
			const selected = await tx.contractPaymentTerm.findUnique({
				where: { id: data.contractTermId },
			});

			// Only spill when the selected term has a capped amount
			if (selected && selected.amount != null) {
				const terms = await tx.contractPaymentTerm.findMany({
					where: {
						contractId: selected.contractId,
						sortOrder: { gte: selected.sortOrder },
					},
					orderBy: { sortOrder: "asc" },
				});

				let remaining = round2(data.amount);
				for (const term of terms) {
					if (remaining <= 0) break;
					// Uncapped term swallows the rest
					if (term.amount == null) {
						allocations.push({ contractTermId: term.id, amount: remaining });
						remaining = 0;
						break;
					}
					const capacity = round2(
						Number(term.amount) - Number(term.paidAmount),
					);
					if (capacity <= 0) continue; // already full → skip
					const take = round2(Math.min(remaining, capacity));
					allocations.push({ contractTermId: term.id, amount: take });
					remaining = round2(remaining - take);
				}

				// Final overflow → attach to the last stage (no amount lost)
				if (remaining > 0) {
					const lastTerm = terms[terms.length - 1];
					const lastAlloc = allocations[allocations.length - 1];
					if (lastAlloc && lastTerm && lastAlloc.contractTermId === lastTerm.id) {
						lastAlloc.amount = round2(lastAlloc.amount + remaining);
					} else if (lastTerm) {
						allocations.push({
							contractTermId: lastTerm.id,
							amount: remaining,
						});
					} else {
						allocations.push({
							contractTermId: data.contractTermId,
							amount: remaining,
						});
					}
					remaining = 0;
				}
			}
		}

		// Fallback: free payment, uncapped selected term, or nothing allocated
		if (allocations.length === 0) {
			allocations = [
				{ contractTermId: data.contractTermId ?? null, amount: data.amount },
			];
		}

		// Sequential payment numbers from a single base count (avoid collisions)
		const baseCount = await tx.projectPayment.count({
			where: { projectId: data.projectId },
		});

		const created: Array<
			Awaited<ReturnType<typeof tx.projectPayment.create>>
		> = [];

		for (let i = 0; i < allocations.length; i++) {
			const alloc = allocations[i];
			const paymentNo = `PAY-${String(baseCount + i + 1).padStart(4, "0")}`;

			const payment = await tx.projectPayment.create({
				data: {
					organizationId: data.organizationId,
					projectId: data.projectId,
					createdById: data.createdById,
					contractTermId: alloc.contractTermId,
					paymentNo,
					amount: alloc.amount,
					date: data.date,
					paymentMethod: data.paymentMethod,
					referenceNo: data.referenceNo ?? null,
					description: data.description ?? null,
					destinationAccountId: data.destinationAccountId ?? null,
					note: data.note ?? null,
				},
				include: includeShape,
			});
			created.push(payment);

			// Update term paidAmount and status if linked to a term
			if (alloc.contractTermId) {
				const term = await tx.contractPaymentTerm.findUnique({
					where: { id: alloc.contractTermId },
				});
				if (term) {
					const newPaid = round2(Number(term.paidAmount) + alloc.amount);
					const termAmount = Number(term.amount ?? 0);
					const newStatus =
						termAmount > 0 && newPaid >= termAmount
							? "FULLY_PAID"
							: newPaid > 0
								? "PARTIALLY_PAID"
								: "PENDING";

					await tx.contractPaymentTerm.update({
						where: { id: alloc.contractTermId },
						data: {
							paidAmount: newPaid,
							status: newStatus,
						},
					});
				}
			}

			// Add to destination bank account balance if provided
			if (data.destinationAccountId) {
				await tx.organizationBank.update({
					where: { id: data.destinationAccountId },
					data: {
						balance: { increment: alloc.amount },
					},
				});
			}
		}

		return {
			payments: created,
			primary: created[0]!,
			splitCount: created.length,
		};
	});
}

/**
 * Update a project payment (adjust term + bank diffs in transaction)
 */
export async function updateProjectPayment(
	id: string,
	organizationId: string,
	data: {
		amount?: number;
		date?: Date;
		paymentMethod?: PaymentMethod;
		referenceNo?: string | null;
		description?: string | null;
		destinationAccountId?: string | null;
		note?: string | null;
	},
) {
	return db.$transaction(async (tx) => {
		const existing = await tx.projectPayment.findUnique({
			where: { id, organizationId },
		});
		if (!existing) throw new Error("PAYMENT_NOT_FOUND");

		const oldAmount = Number(existing.amount);
		const newAmount = data.amount ?? oldAmount;
		const amountDiff = newAmount - oldAmount;

		const payment = await tx.projectPayment.update({
			where: { id },
			data: {
				amount: data.amount,
				date: data.date,
				paymentMethod: data.paymentMethod,
				referenceNo: data.referenceNo,
				description: data.description,
				destinationAccountId: data.destinationAccountId,
				note: data.note,
			},
			include: {
				contractTerm: { select: { id: true, label: true, type: true } },
				destinationAccount: { select: { id: true, name: true } },
				createdBy: { select: { id: true, name: true } },
			},
		});

		// Adjust term if linked and amount changed
		if (existing.contractTermId && amountDiff !== 0) {
			const term = await tx.contractPaymentTerm.findUnique({
				where: { id: existing.contractTermId },
			});
			if (term) {
				const newPaid = Number(term.paidAmount) + amountDiff;
				const termAmount = Number(term.amount ?? 0);
				const newStatus =
					termAmount > 0 && newPaid >= termAmount
						? "FULLY_PAID"
						: newPaid > 0
							? "PARTIALLY_PAID"
							: "PENDING";

				await tx.contractPaymentTerm.update({
					where: { id: existing.contractTermId },
					data: {
						paidAmount: Math.max(0, newPaid),
						status: newStatus,
					},
				});
			}
		}

		// Adjust bank balance if amount changed
		if (amountDiff !== 0) {
			// Handle old destination account
			if (existing.destinationAccountId && data.destinationAccountId === undefined) {
				// Same account, adjust diff
				await tx.organizationBank.update({
					where: { id: existing.destinationAccountId },
					data: { balance: { increment: amountDiff } },
				});
			}
			// If destination changed, handled below
		}

		// Handle destination account change
		if (data.destinationAccountId !== undefined && data.destinationAccountId !== existing.destinationAccountId) {
			// Reverse old account
			if (existing.destinationAccountId) {
				await tx.organizationBank.update({
					where: { id: existing.destinationAccountId },
					data: { balance: { decrement: oldAmount } },
				});
			}
			// Credit new account
			if (data.destinationAccountId) {
				await tx.organizationBank.update({
					where: { id: data.destinationAccountId },
					data: { balance: { increment: newAmount } },
				});
			}
		}

		return payment;
	});
}

/**
 * Delete a project payment (reverse term + bank in transaction)
 */
export async function deleteProjectPayment(
	id: string,
	organizationId: string,
) {
	return db.$transaction(async (tx) => {
		const existing = await tx.projectPayment.findUnique({
			where: { id, organizationId },
		});
		if (!existing) throw new Error("PAYMENT_NOT_FOUND");

		const amount = Number(existing.amount);

		// Reverse term paidAmount
		if (existing.contractTermId) {
			const term = await tx.contractPaymentTerm.findUnique({
				where: { id: existing.contractTermId },
			});
			if (term) {
				const newPaid = Math.max(0, Number(term.paidAmount) - amount);
				const termAmount = Number(term.amount ?? 0);
				const newStatus =
					termAmount > 0 && newPaid >= termAmount
						? "FULLY_PAID"
						: newPaid > 0
							? "PARTIALLY_PAID"
							: "PENDING";

				await tx.contractPaymentTerm.update({
					where: { id: existing.contractTermId },
					data: {
						paidAmount: newPaid,
						status: newStatus,
					},
				});
			}
		}

		// Reverse bank balance
		if (existing.destinationAccountId) {
			await tx.organizationBank.update({
				where: { id: existing.destinationAccountId },
				data: { balance: { decrement: amount } },
			});
		}

		await tx.projectPayment.delete({ where: { id } });
		return { success: true };
	});
}
