// Capital Contributions — مساهمات رأس المال
// List + GetById + Create (ACTIVE مباشرة) + Cancel + GetByOwner

import {
	db,
	orgAuditLog,
	generateAtomicNo,
} from "@repo/database";
import { z } from "zod";
import {
	protectedProcedure,
	subscriptionProcedure,
} from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { ORPCError } from "@orpc/server";
import {
	idString,
	optionalTrimmed,
	positiveAmount,
	paginationLimit,
	paginationOffset,
	MAX_DESC,
	MAX_LONG_TEXT,
} from "../../../lib/validation-constants";

// ═══ Shared enums ═══
const contributionTypeEnum = z.enum(["INITIAL", "ADDITIONAL", "IN_KIND"]);

// ═══════════════════════════════════════════════════════════════════════════
// 1. LIST CONTRIBUTIONS
// ═══════════════════════════════════════════════════════════════════════════
export const listContributionsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/capital-contributions",
		tags: ["Accounting", "Capital Contributions"],
		summary: "List capital contributions for an organization",
	})
	.input(
		z.object({
			organizationId: idString(),
			ownerId: z.string().trim().max(100).optional(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
			limit: paginationLimit(),
			offset: paginationOffset(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const where: any = {
			organizationId: input.organizationId,
		};

		if (input.ownerId) where.ownerId = input.ownerId;
		if (input.dateFrom || input.dateTo) {
			where.date = {};
			if (input.dateFrom) where.date.gte = input.dateFrom;
			if (input.dateTo) where.date.lte = input.dateTo;
		}

		const [items, total] = await Promise.all([
			db.capitalContribution.findMany({
				where,
				include: {
					owner: { select: { id: true, name: true } },
					bankAccount: { select: { id: true, name: true } },
				},
				orderBy: [{ date: "desc" }, { createdAt: "desc" }],
				take: input.limit,
				skip: input.offset,
			}),
			db.capitalContribution.count({ where }),
		]);

		return {
			items: items.map((item) => ({
				...item,
				amount: Number(item.amount),
			})),
			total,
		};
	});

// ═══════════════════════════════════════════════════════════════════════════
// 2. GET CONTRIBUTION BY ID
// ═══════════════════════════════════════════════════════════════════════════
export const getContributionByIdProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/capital-contributions/{id}",
		tags: ["Accounting", "Capital Contributions"],
		summary: "Get a single capital contribution by ID",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const contribution = await db.capitalContribution.findFirst({
			where: {
				id: input.id,
				organizationId: input.organizationId,
			},
			include: {
				owner: {
					select: {
						id: true,
						name: true,
						nameEn: true,
						ownershipPercent: true,
					},
				},
				bankAccount: { select: { id: true, name: true, bankName: true } },
				journalEntry: {
					select: {
						id: true,
						entryNo: true,
						status: true,
						date: true,
						totalAmount: true,
					},
				},
				createdBy: { select: { id: true, name: true, image: true } },
			},
		});

		if (!contribution) {
			throw new ORPCError("NOT_FOUND", {
				message: "مساهمة رأس المال غير موجودة",
			});
		}

		return {
			...contribution,
			amount: Number(contribution.amount),
			owner: {
				...contribution.owner,
				ownershipPercent: Number(contribution.owner.ownershipPercent),
			},
			journalEntry: contribution.journalEntry
				? {
						...contribution.journalEntry,
						totalAmount: Number(contribution.journalEntry.totalAmount),
					}
				: null,
		};
	});

// ═══════════════════════════════════════════════════════════════════════════
// 3. CREATE CONTRIBUTION (ACTIVE مباشرة)
// ═══════════════════════════════════════════════════════════════════════════
export const createContributionProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/capital-contributions",
		tags: ["Accounting", "Capital Contributions"],
		summary: "Create a new capital contribution — ACTIVE immediately",
	})
	.input(
		z.object({
			organizationId: idString(),
			ownerId: idString(),
			date: z.coerce.date(),
			amount: positiveAmount(),
			type: contributionTypeEnum,
			bankAccountId: idString().optional(),
			description: optionalTrimmed(MAX_DESC),
			notes: optionalTrimmed(MAX_LONG_TEXT),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		// Step 1: Verify owner exists and is active
		const owner = await db.organizationOwner.findFirst({
			where: {
				id: input.ownerId,
				organizationId: input.organizationId,
			},
			select: {
				id: true,
				name: true,
				isActive: true,
			},
		});

		if (!owner) {
			throw new ORPCError("NOT_FOUND", {
				message: "المالك/الشريك غير موجود",
			});
		}
		if (!owner.isActive) {
			throw new ORPCError("BAD_REQUEST", {
				message: "المالك/الشريك غير نشط",
			});
		}

		// Step 2: Generate contribution number
		const contributionNo = await generateAtomicNo(
			input.organizationId,
			"CNT",
		);

		// Step 3: Create contribution + increment bank balance atomically
		const contribution = await db.$transaction(async (tx) => {
			const created = await tx.capitalContribution.create({
				data: {
					organizationId: input.organizationId,
					contributionNo,
					date: input.date,
					amount: input.amount,
					type: input.type,
					ownerId: input.ownerId,
					bankAccountId: input.bankAccountId ?? null,
					description: input.description ?? null,
					notes: input.notes ?? null,
					status: "ACTIVE",
					createdById: context.user.id,
				},
				include: {
					owner: { select: { id: true, name: true } },
				},
			});

			// Increment bank balance atomically (capital comes IN)
			if (input.bankAccountId) {
				await tx.organizationBank.update({
					where: { id: input.bankAccountId },
					data: {
						balance: { increment: input.amount },
					},
				});
			}

			return created;
		});

		// Step 4: Create journal entry (outside transaction — silent failure)
		let journalEntryId: string | null = null;
		try {
			const { onCapitalContribution } = await import(
				"../../../lib/accounting/auto-journal"
			);
			journalEntryId = await onCapitalContribution(db, {
				id: contribution.id,
				organizationId: input.organizationId,
				contributionNo,
				amount: contribution.amount,
				date: input.date,
				ownerName: owner.name,
				type: input.type,
				bankAccountId: input.bankAccountId ?? null,
				userId: context.user.id,
			});
		} catch (e) {
			console.error(
				"[AutoJournal] Failed to generate entry for capital contribution:",
				e,
			);
			orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: contribution.id,
				metadata: {
					error: String(e),
					referenceType: "CAPITAL_CONTRIBUTION",
				},
			});
		}

		// Link journal entry to contribution
		if (journalEntryId) {
			await db.capitalContribution.update({
				where: { id: contribution.id },
				data: { journalEntryId },
			});
		}

		// Audit log
		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "CAPITAL_CONTRIBUTION_CREATED",
			entityType: "capital_contribution",
			entityId: contribution.id,
			metadata: {
				contributionNo,
				amount: input.amount,
				type: input.type,
				ownerId: input.ownerId,
				ownerName: owner.name,
				hasJournalEntry: !!journalEntryId,
			},
		});

		return {
			...contribution,
			amount: Number(contribution.amount),
		};
	});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CANCEL CONTRIBUTION (ACTIVE → CANCELLED)
// ═══════════════════════════════════════════════════════════════════════════
export const cancelContributionProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/capital-contributions/{id}/cancel",
		tags: ["Accounting", "Capital Contributions"],
		summary: "Cancel an active capital contribution",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			cancelReason: optionalTrimmed(MAX_DESC),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		const contribution = await db.capitalContribution.findFirst({
			where: {
				id: input.id,
				organizationId: input.organizationId,
			},
			select: {
				id: true,
				status: true,
				contributionNo: true,
				amount: true,
				bankAccountId: true,
				journalEntryId: true,
			},
		});

		if (!contribution) {
			throw new ORPCError("NOT_FOUND", {
				message: "مساهمة رأس المال غير موجودة",
			});
		}
		if (contribution.status !== "ACTIVE") {
			throw new ORPCError("BAD_REQUEST", {
				message: "يمكن إلغاء المساهمات النشطة فقط",
			});
		}

		// Transaction: restore bank balance + update status
		await db.$transaction(async (tx) => {
			if (contribution.bankAccountId) {
				await tx.organizationBank.update({
					where: { id: contribution.bankAccountId },
					data: {
						balance: { decrement: Number(contribution.amount) },
					},
				});
			}

			await tx.capitalContribution.update({
				where: { id: input.id },
				data: {
					status: "CANCELLED",
					cancelledAt: new Date(),
					cancelReason: input.cancelReason ?? null,
				},
			});
		});

		// Reverse journal entry (silent failure)
		try {
			const { reverseAutoJournalEntry } = await import(
				"../../../lib/accounting/auto-journal"
			);
			await reverseAutoJournalEntry(db, {
				organizationId: input.organizationId,
				referenceType: "CAPITAL_CONTRIBUTION",
				referenceId: input.id,
				userId: context.user.id,
			});
		} catch (e) {
			console.error(
				"[AutoJournal] Failed to reverse entry for cancelled capital contribution:",
				e,
			);
			orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: input.id,
				metadata: {
					error: String(e),
					referenceType: "CAPITAL_CONTRIBUTION",
				},
			});
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "CAPITAL_CONTRIBUTION_CANCELLED",
			entityType: "capital_contribution",
			entityId: input.id,
			metadata: {
				contributionNo: contribution.contributionNo,
				cancelReason: input.cancelReason,
				amount: Number(contribution.amount),
			},
		});

		return { success: true };
	});

// ═══════════════════════════════════════════════════════════════════════════
// 5. GET BY OWNER (aggregate contributions for a specific owner)
// ═══════════════════════════════════════════════════════════════════════════
export const getByOwnerProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/capital-contributions/by-owner",
		tags: ["Accounting", "Capital Contributions"],
		summary: "Get aggregated capital contributions for a specific owner",
	})
	.input(
		z.object({
			organizationId: idString(),
			ownerId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		// Aggregate total active contributions for this owner
		const aggregate = await db.capitalContribution.aggregate({
			where: {
				organizationId: input.organizationId,
				ownerId: input.ownerId,
				status: "ACTIVE",
			},
			_sum: { amount: true },
		});

		const contributions = await db.capitalContribution.findMany({
			where: {
				organizationId: input.organizationId,
				ownerId: input.ownerId,
			},
			include: {
				bankAccount: { select: { id: true, name: true } },
			},
			orderBy: [{ date: "desc" }, { createdAt: "desc" }],
		});

		return {
			ownerId: input.ownerId,
			totalContributions: Number(aggregate._sum?.amount ?? 0),
			contributions: contributions.map((c) => ({
				...c,
				amount: Number(c.amount),
			})),
		};
	});
