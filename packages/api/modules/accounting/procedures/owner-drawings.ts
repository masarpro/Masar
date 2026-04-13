// Owner Drawings — سحوبات الشركاء/المالكين
// List + GetById + Create (APPROVED مباشرة مع overdraw logic) + Cancel + CheckOverdraw
// + CompanySummary + ProjectSummary + OwnerSummary

import {
	db,
	orgAuditLog,
	generateAtomicNo,
	getJournalIncomeStatement,
	getCostCenterByProject,
	createOwnerDrawingAccount,
	ensureOwnerDrawingsSystem,
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
import {
	onOwnerDrawing,
	onOwnerDrawingCancelled,
} from "../../../lib/accounting/auto-journal";

// ═══ Shared enums ═══
const drawingStatusEnum = z.enum(["APPROVED", "CANCELLED"]);

// ═══════════════════════════════════════════════════════════════════════════
// 1. LIST DRAWINGS
// ═══════════════════════════════════════════════════════════════════════════
export const listDrawingsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/owner-drawings",
		tags: ["Accounting", "Owner Drawings"],
		summary: "List owner drawings for an organization",
	})
	.input(
		z.object({
			organizationId: idString(),
			ownerId: z.string().trim().max(100).optional(),
			projectId: z.string().trim().max(100).optional(),
			status: drawingStatusEnum.optional(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
			search: z.string().trim().max(200).optional(),
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
		if (input.projectId) where.projectId = input.projectId;
		if (input.status) where.status = input.status;
		if (input.dateFrom || input.dateTo) {
			where.date = {};
			if (input.dateFrom) where.date.gte = input.dateFrom;
			if (input.dateTo) where.date.lte = input.dateTo;
		}
		if (input.search) {
			where.OR = [
				{ drawingNo: { contains: input.search, mode: "insensitive" } },
				{ description: { contains: input.search, mode: "insensitive" } },
				{ owner: { name: { contains: input.search, mode: "insensitive" } } },
			];
		}

		const [items, total] = await Promise.all([
			db.ownerDrawing.findMany({
				where,
				include: {
					owner: { select: { id: true, name: true } },
					bankAccount: { select: { id: true, name: true } },
					project: { select: { id: true, name: true } },
				},
				orderBy: [{ date: "desc" }, { createdAt: "desc" }],
				take: input.limit,
				skip: input.offset,
			}),
			db.ownerDrawing.count({ where }),
		]);

		return {
			items: items.map((item) => ({
				...item,
				amount: Number(item.amount),
				overdrawAmount: item.overdrawAmount
					? Number(item.overdrawAmount)
					: null,
			})),
			total,
		};
	});

// ═══════════════════════════════════════════════════════════════════════════
// 2. GET DRAWING BY ID
// ═══════════════════════════════════════════════════════════════════════════
export const getDrawingByIdProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/owner-drawings/{id}",
		tags: ["Accounting", "Owner Drawings"],
		summary: "Get a single owner drawing by ID",
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

		const drawing = await db.ownerDrawing.findFirst({
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
						drawingsAccountId: true,
					},
				},
				bankAccount: { select: { id: true, name: true, bankName: true } },
				project: { select: { id: true, name: true } },
				journalEntry: {
					select: {
						id: true,
						entryNo: true,
						status: true,
						date: true,
						totalAmount: true,
					},
				},
				approvedBy: { select: { id: true, name: true, image: true } },
				createdBy: { select: { id: true, name: true, image: true } },
			},
		});

		if (!drawing) {
			throw new ORPCError("NOT_FOUND", {
				message: "سحب المالك غير موجود",
			});
		}

		return {
			...drawing,
			amount: Number(drawing.amount),
			overdrawAmount: drawing.overdrawAmount
				? Number(drawing.overdrawAmount)
				: null,
			owner: {
				...drawing.owner,
				ownershipPercent: Number(drawing.owner.ownershipPercent),
			},
			journalEntry: drawing.journalEntry
				? {
						...drawing.journalEntry,
						totalAmount: Number(drawing.journalEntry.totalAmount),
					}
				: null,
		};
	});

// ═══════════════════════════════════════════════════════════════════════════
// Helper: compute overdraw context for an owner
// ═══════════════════════════════════════════════════════════════════════════
async function computeOverdrawContext(
	organizationId: string,
	ownerId: string,
	amount: number,
	bankAccountId: string | undefined,
	projectId: string | undefined,
) {
	// Fetch owner
	const owner = await db.organizationOwner.findFirst({
		where: { id: ownerId, organizationId },
		select: { id: true, name: true, ownershipPercent: true, isActive: true },
	});

	if (!owner) {
		throw new ORPCError("NOT_FOUND", { message: "المالك/الشريك غير موجود" });
	}

	const ownershipPercent = Number(owner.ownershipPercent);

	// Bank balance
	let bankBalance: number | null = null;
	let bankSufficient = true;
	if (bankAccountId) {
		const bank = await db.organizationBank.findFirst({
			where: { id: bankAccountId, organizationId },
			select: { balance: true },
		});
		bankBalance = bank ? Number(bank.balance) : null;
		bankSufficient = bankBalance !== null && bankBalance >= amount;
	}

	let contextProfit = 0;
	let totalPreviousDrawings = 0;
	let contextType: "PROJECT" | "COMPANY" = "COMPANY";
	let projectName: string | null = null;

	if (projectId) {
		contextType = "PROJECT";

		const costCenter = await getCostCenterByProject(db, organizationId, {
			projectId,
		});
		const projectData = costCenter.projects.find(
			(p) => p.projectId === projectId,
		);
		contextProfit = projectData?.netProfit ?? 0;
		projectName = projectData?.projectName ?? null;

		// Sum APPROVED drawings for this project by this owner
		const existingDrawings = await db.ownerDrawing.aggregate({
			where: {
				organizationId,
				projectId,
				ownerId,
				status: "APPROVED",
			},
			_sum: { amount: true },
		});
		totalPreviousDrawings = Number(existingDrawings._sum?.amount ?? 0);
	} else {
		const now = new Date();
		const yearStart = new Date(now.getFullYear(), 0, 1);
		const yearEnd = new Date(now.getFullYear(), 11, 31);

		const incomeStatement = await getJournalIncomeStatement(
			db,
			organizationId,
			{ dateFrom: yearStart, dateTo: yearEnd },
		);
		contextProfit = incomeStatement.netProfit;

		// Sum APPROVED company-level drawings (projectId = null) for this owner this year
		const existingDrawings = await db.ownerDrawing.aggregate({
			where: {
				organizationId,
				ownerId,
				projectId: null,
				status: "APPROVED",
				date: { gte: yearStart, lte: yearEnd },
			},
			_sum: { amount: true },
		});
		totalPreviousDrawings = Number(existingDrawings._sum?.amount ?? 0);
	}

	const ownerShareOfContext = contextProfit * (ownershipPercent / 100);

	// Capital contributions total for this owner
	let capitalContributionsTotal = 0;
	try {
		const contributions = await db.capitalContribution.aggregate({
			where: { organizationId, ownerId },
			_sum: { amount: true },
		});
		capitalContributionsTotal = Number(contributions._sum?.amount ?? 0);
	} catch {
		// Table may not exist yet — ignore
	}

	const availableForOwner =
		ownerShareOfContext + capitalContributionsTotal - totalPreviousDrawings;
	const willExceed = amount > availableForOwner;
	const overdrawAmount = willExceed ? amount - availableForOwner : 0;

	// Other partners (informational)
	const allOwners = await db.organizationOwner.findMany({
		where: { organizationId, isActive: true, id: { not: ownerId } },
		select: { id: true, name: true, ownershipPercent: true },
		orderBy: { name: "asc" },
	});

	const otherPartners = allOwners.map((o) => ({
		ownerId: o.id,
		ownerName: o.name,
		ownershipPercent: Number(o.ownershipPercent),
		theirShareOfContext: contextProfit * (Number(o.ownershipPercent) / 100),
	}));

	return {
		owner,
		ownershipPercent,
		contextType,
		contextProfit,
		projectName,
		ownerName: owner.name,
		ownerShareOfContext,
		totalPreviousDrawings,
		capitalContributions: capitalContributionsTotal,
		availableForOwner,
		willExceed,
		overdrawAmount,
		bankBalance,
		bankSufficient,
		balanceAfterDrawing:
			bankBalance !== null ? bankBalance - amount : null,
		otherPartners,
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. CREATE DRAWING (APPROVED مباشرة — no draft/approval flow)
// ═══════════════════════════════════════════════════════════════════════════
export const createDrawingProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/owner-drawings",
		tags: ["Accounting", "Owner Drawings"],
		summary:
			"Create a new owner drawing — APPROVED immediately with overdraw detection",
	})
	.input(
		z.object({
			organizationId: idString(),
			ownerId: idString(),
			date: z.coerce.date(),
			amount: positiveAmount(),
			bankAccountId: idString().optional(),
			projectId: idString().optional(),
			description: optionalTrimmed(MAX_DESC),
			notes: optionalTrimmed(MAX_LONG_TEXT),
			acknowledgeOverdraw: z.boolean().optional(),
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
				ownershipPercent: true,
				drawingsAccountId: true,
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
		// Auto-create drawings account for legacy owners created before the feature existed
		let drawingsAccountId = owner.drawingsAccountId;
		if (!drawingsAccountId) {
			await ensureOwnerDrawingsSystem(db, input.organizationId);
			drawingsAccountId = await createOwnerDrawingAccount(
				db,
				input.organizationId,
				owner.name,
			);
			if (!drawingsAccountId) {
				throw new ORPCError("BAD_REQUEST", {
					message:
						"تعذّر إنشاء حساب سحوبات للشريك. يرجى التأكد من إعداد دليل الحسابات (حساب 3400) أولاً",
				});
			}
			await db.organizationOwner.update({
				where: { id: owner.id },
				data: { drawingsAccountId },
			});
		}

		// Step 2: Derive drawing type
		const drawingType = input.projectId
			? "PROJECT_SPECIFIC"
			: "COMPANY_LEVEL";

		// Step 3: Check bank balance (hard block)
		if (input.bankAccountId) {
			const bank = await db.organizationBank.findFirst({
				where: {
					id: input.bankAccountId,
					organizationId: input.organizationId,
				},
				select: { id: true, name: true, balance: true },
			});

			if (!bank) {
				throw new ORPCError("BAD_REQUEST", {
					message: "الحساب البنكي غير موجود",
				});
			}

			if (Number(bank.balance) < input.amount) {
				throw new ORPCError("BAD_REQUEST", {
					message: `رصيد البنك غير كافٍ. الرصيد الحالي: ${Number(bank.balance).toLocaleString("en-US")} ر.س`,
					data: {
						code: "INSUFFICIENT_BANK_BALANCE",
						currentBalance: Number(bank.balance),
						requestedAmount: input.amount,
					},
				});
			}
		}

		// Step 4: Verify project exists if provided
		if (input.projectId) {
			const project = await db.project.findFirst({
				where: {
					id: input.projectId,
					organizationId: input.organizationId,
				},
				select: { id: true },
			});
			if (!project) {
				throw new ORPCError("BAD_REQUEST", {
					message: "المشروع غير موجود",
				});
			}
		}

		// Step 5: Overdraw check (same logic as checkOverdraw)
		const overdrawCtx = await computeOverdrawContext(
			input.organizationId,
			input.ownerId,
			input.amount,
			input.bankAccountId,
			input.projectId,
		);

		// Step 6: If overdraw detected and not acknowledged → throw for confirmation
		if (overdrawCtx.willExceed && !input.acknowledgeOverdraw) {
			throw new ORPCError("CONFLICT", {
				message: "OVERDRAW_REQUIRES_CONFIRMATION",
				data: {
					code: "OVERDRAW_REQUIRES_CONFIRMATION",
					overdrawAmount: overdrawCtx.overdrawAmount,
					availableForOwner: overdrawCtx.availableForOwner,
					contextProfit: overdrawCtx.contextProfit,
					totalPreviousDrawings: overdrawCtx.totalPreviousDrawings,
					ownershipPercent: overdrawCtx.ownershipPercent,
					ownerShareOfContext: overdrawCtx.ownerShareOfContext,
					capitalContributions: overdrawCtx.capitalContributions,
					requestedAmount: input.amount,
					drawingType,
					contextType: overdrawCtx.contextType,
					ownerName: overdrawCtx.ownerName,
					otherPartners: overdrawCtx.otherPartners,
				},
			});
		}

		// Step 7: Prepare overdraw data if acknowledged
		let overdrawData: {
			hasOverdrawWarning: boolean;
			overdrawAmount?: number;
			overdrawAcknowledgedBy?: string;
			overdrawAcknowledgedAt?: Date;
		} = { hasOverdrawWarning: false };

		if (overdrawCtx.willExceed && input.acknowledgeOverdraw) {
			overdrawData = {
				hasOverdrawWarning: true,
				overdrawAmount: overdrawCtx.overdrawAmount,
				overdrawAcknowledgedBy: context.user.id,
				overdrawAcknowledgedAt: new Date(),
			};
		}

		// Step 8: Generate drawing number
		const drawingNo = await generateAtomicNo(input.organizationId, "OD");

		// Step 9: Transaction — create APPROVED + decrement bank atomically
		const drawing = await db.$transaction(async (tx) => {
			const created = await tx.ownerDrawing.create({
				data: {
					organizationId: input.organizationId,
					drawingNo,
					date: input.date,
					amount: input.amount,
					ownerId: input.ownerId,
					bankAccountId: input.bankAccountId ?? null,
					projectId: input.projectId ?? null,
					type: drawingType,
					description: input.description ?? null,
					notes: input.notes ?? null,
					status: "APPROVED",
					approvedById: context.user.id,
					approvedAt: new Date(),
					createdById: context.user.id,
					hasOverdrawWarning: overdrawData.hasOverdrawWarning,
					overdrawAmount: overdrawData.overdrawAmount ?? null,
					overdrawAcknowledgedBy:
						overdrawData.overdrawAcknowledgedBy ?? null,
					overdrawAcknowledgedAt:
						overdrawData.overdrawAcknowledgedAt ?? null,
				},
				include: {
					owner: { select: { id: true, name: true } },
					project: { select: { id: true, name: true } },
				},
			});

			// Decrement bank balance atomically
			if (input.bankAccountId) {
				await tx.organizationBank.update({
					where: { id: input.bankAccountId },
					data: {
						balance: { decrement: input.amount },
					},
				});
			}

			return created;
		});

		// Step 10: Create journal entry (outside transaction — silent failure)
		let journalEntryId: string | null = null;
		try {
			journalEntryId = await onOwnerDrawing(db, {
				id: drawing.id,
				organizationId: input.organizationId,
				drawingNo,
				amount: drawing.amount,
				date: input.date,
				ownerName: owner.name,
				drawingsAccountId,
				bankAccountId: input.bankAccountId ?? null,
				projectId: input.projectId ?? null,
				projectName: drawing.project?.name ?? null,
				userId: context.user.id,
			});
		} catch (e) {
			console.error(
				"[AutoJournal] Failed to generate entry for owner drawing:",
				e,
			);
			orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: drawing.id,
				metadata: {
					error: String(e),
					referenceType: "OWNER_DRAWING",
				},
			});
		}

		// Link journal entry to drawing
		if (journalEntryId) {
			await db.ownerDrawing.update({
				where: { id: drawing.id },
				data: { journalEntryId },
			});
		}

		// Audit log
		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "OWNER_DRAWING_CREATED",
			entityType: "owner_drawing",
			entityId: drawing.id,
			metadata: {
				drawingNo,
				amount: input.amount,
				ownerId: input.ownerId,
				ownerName: owner.name,
				drawingType,
				hasJournalEntry: !!journalEntryId,
			},
		});

		if (overdrawCtx.willExceed && input.acknowledgeOverdraw) {
			orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "OWNER_DRAWING_OVERDRAW_ACKNOWLEDGED",
				entityType: "owner_drawing",
				entityId: drawing.id,
				metadata: {
					drawingNo,
					overdrawAmount: overdrawCtx.overdrawAmount,
					availableForOwner: overdrawCtx.availableForOwner,
					contextProfit: overdrawCtx.contextProfit,
					ownerShareOfContext: overdrawCtx.ownerShareOfContext,
				},
			});
		}

		return {
			...drawing,
			amount: Number(drawing.amount),
			overdrawAmount: drawing.overdrawAmount
				? Number(drawing.overdrawAmount)
				: null,
		};
	});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CANCEL DRAWING (APPROVED → CANCELLED)
// ═══════════════════════════════════════════════════════════════════════════
export const cancelDrawingProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/owner-drawings/{id}/cancel",
		tags: ["Accounting", "Owner Drawings"],
		summary: "Cancel an approved owner drawing",
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

		const drawing = await db.ownerDrawing.findFirst({
			where: {
				id: input.id,
				organizationId: input.organizationId,
			},
			select: {
				id: true,
				status: true,
				drawingNo: true,
				amount: true,
				bankAccountId: true,
				journalEntryId: true,
			},
		});

		if (!drawing) {
			throw new ORPCError("NOT_FOUND", {
				message: "سحب المالك غير موجود",
			});
		}
		if (drawing.status !== "APPROVED") {
			throw new ORPCError("BAD_REQUEST", {
				message: "يمكن إلغاء السحوبات المعتمدة فقط",
			});
		}

		// Transaction: restore bank balance + update status
		await db.$transaction(async (tx) => {
			if (drawing.bankAccountId) {
				await tx.organizationBank.update({
					where: { id: drawing.bankAccountId },
					data: {
						balance: { increment: Number(drawing.amount) },
					},
				});
			}

			await tx.ownerDrawing.update({
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
			await onOwnerDrawingCancelled(db, {
				organizationId: input.organizationId,
				drawingId: input.id,
				userId: context.user.id,
			});
		} catch (e) {
			console.error(
				"[AutoJournal] Failed to reverse entry for cancelled owner drawing:",
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
					referenceType: "OWNER_DRAWING",
				},
			});
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "OWNER_DRAWING_CANCELLED",
			entityType: "owner_drawing",
			entityId: input.id,
			metadata: {
				drawingNo: drawing.drawingNo,
				cancelReason: input.cancelReason,
				amount: Number(drawing.amount),
			},
		});

		return { success: true };
	});

// ═══════════════════════════════════════════════════════════════════════════
// 5. CHECK OVERDRAW (pre-check — real-time in form)
// ═══════════════════════════════════════════════════════════════════════════
export const checkOverdrawProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/owner-drawings/check-overdraw",
		tags: ["Accounting", "Owner Drawings"],
		summary: "Check if an amount would overdraw for an owner",
	})
	.input(
		z.object({
			organizationId: idString(),
			ownerId: idString(),
			amount: positiveAmount(),
			bankAccountId: idString().optional(),
			projectId: idString().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const result = await computeOverdrawContext(
			input.organizationId,
			input.ownerId,
			input.amount,
			input.bankAccountId,
			input.projectId,
		);

		return {
			contextType: result.contextType,
			projectName: result.projectName,
			contextProfit: result.contextProfit,
			ownerName: result.ownerName,
			ownershipPercent: result.ownershipPercent,
			ownerShareOfContext: result.ownerShareOfContext,
			totalPreviousDrawings: result.totalPreviousDrawings,
			capitalContributions: result.capitalContributions,
			availableForOwner: result.availableForOwner,
			willExceed: result.willExceed,
			overdrawAmount: result.overdrawAmount,
			bankBalance: result.bankBalance,
			bankSufficient: result.bankSufficient,
			balanceAfterDrawing: result.balanceAfterDrawing,
			requestedAmount: input.amount,
			otherPartners: result.otherPartners,
		};
	});

// ═══════════════════════════════════════════════════════════════════════════
// 6. GET COMPANY SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
export const getCompanySummaryProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/owner-drawings/company-summary",
		tags: ["Accounting", "Owner Drawings"],
		summary: "Get company-level drawings summary for a fiscal year",
	})
	.input(
		z.object({
			organizationId: idString(),
			year: z.number().int().min(2000).max(2100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const year = input.year ?? new Date().getFullYear();
		const yearStart = new Date(year, 0, 1);
		const yearEnd = new Date(year, 11, 31);

		// Get income statement for the year
		const incomeStatement = await getJournalIncomeStatement(
			db,
			input.organizationId,
			{ dateFrom: yearStart, dateTo: yearEnd },
		);
		const currentYearProfit = incomeStatement.netProfit;

		// Get all active owners
		const owners = await db.organizationOwner.findMany({
			where: {
				organizationId: input.organizationId,
				isActive: true,
			},
			select: {
				id: true,
				name: true,
				nameEn: true,
				ownershipPercent: true,
			},
			orderBy: { name: "asc" },
		});

		// For each owner: compute expected share + actual drawings
		const drawingsByOwner = await Promise.all(
			owners.map(async (o) => {
				const ownerPct = Number(o.ownershipPercent);
				const expectedShare = currentYearProfit * (ownerPct / 100);

				const approvedDrawings = await db.ownerDrawing.aggregate({
					where: {
						organizationId: input.organizationId,
						ownerId: o.id,
						status: "APPROVED",
						date: { gte: yearStart, lte: yearEnd },
					},
					_sum: { amount: true },
					_count: { id: true },
				});

				const actualDrawings = Number(
					approvedDrawings._sum?.amount ?? 0,
				);
				const count = approvedDrawings._count?.id ?? 0;

				return {
					ownerId: o.id,
					ownerName: o.name,
					ownerNameEn: o.nameEn,
					ownershipPercent: ownerPct,
					expectedShare,
					actualDrawings,
					difference: expectedShare - actualDrawings,
					count,
				};
			}),
		);

		// Total drawings this year
		const totalDrawingsResult = await db.ownerDrawing.aggregate({
			where: {
				organizationId: input.organizationId,
				status: "APPROVED",
				date: { gte: yearStart, lte: yearEnd },
			},
			_sum: { amount: true },
		});
		const totalDrawingsThisYear = Number(
			totalDrawingsResult._sum?.amount ?? 0,
		);

		// Drawings by project
		const drawingsByProjectRaw = await db.ownerDrawing.groupBy({
			by: ["projectId"],
			where: {
				organizationId: input.organizationId,
				status: "APPROVED",
				date: { gte: yearStart, lte: yearEnd },
			},
			_sum: { amount: true },
			_count: { id: true },
		});

		// Fetch project names
		const projectIds = drawingsByProjectRaw
			.map((d) => d.projectId)
			.filter(Boolean) as string[];
		const projects =
			projectIds.length > 0
				? await db.project.findMany({
						where: { id: { in: projectIds } },
						select: { id: true, name: true },
					})
				: [];
		const projectNameMap = new Map(projects.map((p) => [p.id, p.name]));

		const drawingsByProject = drawingsByProjectRaw.map((d) => ({
			projectId: d.projectId,
			projectName: d.projectId
				? (projectNameMap.get(d.projectId) ?? "غير معروف")
				: "عام / بدون مشروع",
			total: Number(d._sum?.amount ?? 0),
			count: d._count?.id ?? 0,
		}));

		// Drawings by month
		const allDrawings = await db.ownerDrawing.findMany({
			where: {
				organizationId: input.organizationId,
				status: "APPROVED",
				date: { gte: yearStart, lte: yearEnd },
			},
			select: { date: true, amount: true },
			orderBy: { date: "asc" },
		});

		const monthMap = new Map<number, number>();
		for (const d of allDrawings) {
			const month = d.date.getMonth(); // 0-11
			monthMap.set(month, (monthMap.get(month) ?? 0) + Number(d.amount));
		}

		const drawingsByMonth = Array.from({ length: 12 }, (_, i) => ({
			month: i + 1,
			total: monthMap.get(i) ?? 0,
		}));

		// Retained earnings balance (account 3200)
		let retainedEarnings = 0;
		const retainedAccount = await db.chartAccount.findFirst({
			where: {
				organizationId: input.organizationId,
				code: "3200",
				isActive: true,
			},
			select: { id: true },
		});
		if (retainedAccount) {
			const lines = await db.journalEntryLine.aggregate({
				where: {
					accountId: retainedAccount.id,
					journalEntry: { status: "POSTED" },
				},
				_sum: { debit: true, credit: true },
			});
			// Retained Earnings is EQUITY (credit-normal)
			retainedEarnings =
				Number(lines._sum?.credit ?? 0) -
				Number(lines._sum?.debit ?? 0);
		}

		return {
			year,
			currentYearProfit,
			totalDrawingsThisYear,
			availableForDrawing: currentYearProfit - totalDrawingsThisYear,
			retainedEarnings,
			drawingsByOwner,
			drawingsByProject,
			drawingsByMonth,
		};
	});

// ═══════════════════════════════════════════════════════════════════════════
// 7. GET PROJECT SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
export const getProjectSummaryProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/owner-drawings/project-summary",
		tags: ["Accounting", "Owner Drawings"],
		summary: "Get drawings summary for a specific project",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		// Get project info
		const project = await db.project.findFirst({
			where: {
				id: input.projectId,
				organizationId: input.organizationId,
			},
			select: { id: true, name: true },
		});

		if (!project) {
			throw new ORPCError("NOT_FOUND", {
				message: "المشروع غير موجود",
			});
		}

		// Get project profit from cost center
		const costCenter = await getCostCenterByProject(
			db,
			input.organizationId,
			{ projectId: input.projectId },
		);
		const projectData = costCenter.projects.find(
			(p) => p.projectId === input.projectId,
		);
		const projectProfit = projectData?.netProfit ?? 0;

		// Get all APPROVED drawings for this project
		const drawings = await db.ownerDrawing.findMany({
			where: {
				organizationId: input.organizationId,
				projectId: input.projectId,
				status: "APPROVED",
			},
			include: {
				owner: { select: { id: true, name: true } },
			},
			orderBy: { date: "desc" },
		});

		const totalDrawingsFromProject = drawings.reduce(
			(sum, d) => sum + Number(d.amount),
			0,
		);

		return {
			projectId: project.id,
			projectName: project.name,
			projectProfit,
			totalDrawingsFromProject,
			availableFromProject: projectProfit - totalDrawingsFromProject,
			drawingsDetail: drawings.map((d) => ({
				id: d.id,
				drawingNo: d.drawingNo,
				date: d.date,
				amount: Number(d.amount),
				ownerName: d.owner.name,
				description: d.description,
			})),
		};
	});

// ═══════════════════════════════════════════════════════════════════════════
// 8. GET OWNER SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
export const getOwnerSummaryProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/owner-drawings/owner-summary",
		tags: ["Accounting", "Owner Drawings"],
		summary: "Get drawings summary for a specific owner",
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

		// Get owner info
		const owner = await db.organizationOwner.findFirst({
			where: {
				id: input.ownerId,
				organizationId: input.organizationId,
			},
			select: {
				id: true,
				name: true,
				nameEn: true,
				ownershipPercent: true,
				isActive: true,
			},
		});

		if (!owner) {
			throw new ORPCError("NOT_FOUND", {
				message: "المالك/الشريك غير موجود",
			});
		}

		const ownershipPercent = Number(owner.ownershipPercent);

		// Get income statement for current year
		const now = new Date();
		const yearStart = new Date(now.getFullYear(), 0, 1);
		const yearEnd = new Date(now.getFullYear(), 11, 31);

		const incomeStatement = await getJournalIncomeStatement(
			db,
			input.organizationId,
			{ dateFrom: yearStart, dateTo: yearEnd },
		);
		const currentYearProfit = incomeStatement.netProfit;
		const expectedShareOfProfit =
			currentYearProfit * (ownershipPercent / 100);

		// Get all APPROVED drawings for this owner this year
		const ownerDrawings = await db.ownerDrawing.findMany({
			where: {
				organizationId: input.organizationId,
				ownerId: input.ownerId,
				status: "APPROVED",
				date: { gte: yearStart, lte: yearEnd },
			},
			include: {
				project: { select: { id: true, name: true } },
			},
			orderBy: { date: "asc" },
		});

		const totalDrawings = ownerDrawings.reduce(
			(sum, d) => sum + Number(d.amount),
			0,
		);

		// Group by month
		const monthMap = new Map<number, number>();
		for (const d of ownerDrawings) {
			const month = d.date.getMonth();
			monthMap.set(month, (monthMap.get(month) ?? 0) + Number(d.amount));
		}
		const drawingsByMonth = Array.from({ length: 12 }, (_, i) => ({
			month: i + 1,
			total: monthMap.get(i) ?? 0,
		}));

		// Group by project
		const projectMap = new Map<
			string | null,
			{ name: string; total: number; count: number }
		>();
		for (const d of ownerDrawings) {
			const key = d.projectId;
			const existing = projectMap.get(key);
			if (existing) {
				existing.total += Number(d.amount);
				existing.count += 1;
			} else {
				projectMap.set(key, {
					name: d.project?.name ?? "عام / بدون مشروع",
					total: Number(d.amount),
					count: 1,
				});
			}
		}
		const drawingsByProject = Array.from(projectMap.entries()).map(
			([projectId, data]) => ({
				projectId,
				projectName: data.name,
				total: data.total,
				count: data.count,
			}),
		);

		return {
			ownerId: owner.id,
			ownerName: owner.name,
			ownerNameEn: owner.nameEn,
			ownershipPercent,
			currentYearProfit,
			expectedShareOfProfit,
			totalDrawings,
			balance: expectedShareOfProfit - totalDrawings,
			drawingsByMonth,
			drawingsByProject,
		};
	});
