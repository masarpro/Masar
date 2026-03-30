import {
	createJournalEntry,
	postJournalEntry,
	reverseJournalEntry,
	getTrialBalance,
	getBalanceSheet,
	getJournalIncomeStatement,
	generateMonthlyPeriods,
	closePeriod,
	reopenPeriod,
	bulkPostJournalEntries,
	bulkPostAllDrafts,
	findJournalEntryByReference,
	getCostCenterByProject,
	getAccountingDashboard,
} from "@repo/database";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import {
	MAX_NAME, MAX_DESC, MAX_ID, MAX_ARRAY,
	idString, searchQuery, financialAmount,
	paginationLimit, paginationOffset,
} from "../../../lib/validation-constants";
import type { Prisma } from "@repo/database/prisma/generated/client";

/** Shape of a journal entry line as returned by createJournalEntry / reverseJournalEntry (include: { lines: true }) */
type JournalEntryLine = {
	id: string;
	journalEntryId: string;
	accountId: string;
	debit: { toNumber(): number } | number;
	credit: { toNumber(): number } | number;
	description: string | null;
	projectId: string | null;
};

// ========== List Journal Entries ==========

export const listJournalEntriesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/journal",
		tags: ["Accounting", "Journal Entries"],
		summary: "List journal entries",
	})
	.input(
		z.object({
			organizationId: idString(),
			dateFrom: z.string().datetime().optional(),
			dateTo: z.string().datetime().optional(),
			status: z.enum(["DRAFT", "POSTED", "REVERSED"]).optional(),
			referenceType: z.string().trim().max(MAX_ID).optional(),
			search: searchQuery(),
			amountFrom: financialAmount().optional(),
			amountTo: financialAmount().optional(),
			accountId: idString().optional(),
			limit: paginationLimit(),
			offset: paginationOffset(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const where: Prisma.JournalEntryWhereInput = { organizationId: input.organizationId };

		if (input.status) where.status = input.status;
		if (input.referenceType) where.referenceType = input.referenceType;
		if (input.dateFrom || input.dateTo) {
			where.date = {};
			if (input.dateFrom) where.date.gte = new Date(input.dateFrom);
			if (input.dateTo) where.date.lte = new Date(input.dateTo);
		}
		if (input.amountFrom !== undefined || input.amountTo !== undefined) {
			where.totalAmount = {};
			if (input.amountFrom !== undefined) where.totalAmount.gte = input.amountFrom;
			if (input.amountTo !== undefined) where.totalAmount.lte = input.amountTo;
		}
		if (input.accountId) {
			where.lines = { some: { accountId: input.accountId } };
		}
		if (input.search) {
			where.OR = [
				{ description: { contains: input.search, mode: "insensitive" } },
				{ entryNo: { contains: input.search, mode: "insensitive" } },
				{ referenceNo: { contains: input.search, mode: "insensitive" } },
			];
		}

		const [entries, total] = await Promise.all([
			db.journalEntry.findMany({
				where,
				include: {
					lines: {
						include: {
							account: { select: { code: true, nameAr: true, nameEn: true } },
						},
					},
				},
				orderBy: { date: "desc" },
				take: input.limit,
				skip: input.offset,
			}),
			db.journalEntry.count({ where }),
		]);

		return {
			entries: entries.map((e) => ({
				...e,
				totalAmount: Number(e.totalAmount),
				lines: e.lines.map((l) => ({
					...l,
					debit: Number(l.debit),
					credit: Number(l.credit),
				})),
			})),
			total,
		};
	});

// ========== Get Journal Entry by ID ==========

export const getJournalEntryByIdProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/journal/{id}",
		tags: ["Accounting", "Journal Entries"],
		summary: "Get journal entry details",
	})
	.input(z.object({ organizationId: idString(), id: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const entry = await db.journalEntry.findUnique({
			where: { id: input.id },
			include: {
				lines: {
					include: {
						account: { select: { code: true, nameAr: true, nameEn: true, type: true } },
					},
				},
				createdByUser: { select: { name: true } },
				postedByUser: { select: { name: true } },
			},
		});

		if (!entry || entry.organizationId !== input.organizationId) {
			throw new Error("Journal entry not found");
		}

		// Fetch reversal entry info if reversed
		let reversalEntry: { id: string; entryNo: string } | null = null;
		if (entry.reversalId) {
			reversalEntry = await db.journalEntry.findUnique({
				where: { id: entry.reversalId },
				select: { id: true, entryNo: true },
			});
		}

		return {
			...entry,
			totalAmount: Number(entry.totalAmount),
			lines: entry.lines.map((l) => ({
				...l,
				debit: Number(l.debit),
				credit: Number(l.credit),
			})),
			reversalEntry,
		};
	});

// ========== Create Manual Journal Entry ==========

export const createJournalEntryProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/journal",
		tags: ["Accounting", "Journal Entries"],
		summary: "Create a manual journal entry",
	})
	.input(
		z.object({
			organizationId: idString(),
			date: z.string().datetime(),
			description: z.string().trim().min(1).max(MAX_DESC),
			notes: z.string().trim().max(MAX_DESC).optional(),
			lines: z
				.array(
					z.object({
						accountId: idString(),
						description: z.string().trim().max(MAX_DESC).optional(),
						debit: financialAmount(),
						credit: financialAmount(),
						projectId: idString().optional(),
					}),
				)
				.min(2)
				.max(MAX_ARRAY),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "invoices",
		});

		const { Prisma } = await import("@repo/database/prisma/generated/client");

		const entry = await createJournalEntry(db, {
			organizationId: input.organizationId,
			date: new Date(input.date),
			description: input.description,
			referenceType: "MANUAL",
			isAutoGenerated: false,
			lines: input.lines.map((l) => ({
				accountId: l.accountId,
				debit: new Prisma.Decimal(l.debit),
				credit: new Prisma.Decimal(l.credit),
				description: l.description,
				projectId: l.projectId,
			})),
			createdById: context.user.id,
		});

		if (!entry) {
			throw new Error("لا يمكن إنشاء قيد في فترة محاسبية مغلقة");
		}

		if (input.notes) {
			await db.journalEntry.update({
				where: { id: entry.id },
				data: { notes: input.notes },
			});
		}

		const entryWithLines = entry as typeof entry & { lines?: JournalEntryLine[] };
		const entryLines = entryWithLines.lines ?? [];
		return {
			...entry,
			totalAmount: Number(entry.totalAmount),
			lines: entryLines.map((l) => ({
				...l,
				debit: Number(l.debit),
				credit: Number(l.credit),
			})),
		};
	});

// ========== Post Journal Entry ==========

export const postJournalEntryProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/journal/{id}/post",
		tags: ["Accounting", "Journal Entries"],
		summary: "Post a draft journal entry",
	})
	.input(z.object({ organizationId: idString(), id: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "invoices",
		});

		const entry = await db.journalEntry.findUnique({ where: { id: input.id } });
		if (!entry || entry.organizationId !== input.organizationId) {
			throw new Error("Journal entry not found");
		}

		return postJournalEntry(db, input.id, context.user.id);
	});

// ========== Reverse Journal Entry ==========

export const reverseJournalEntryProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/journal/{id}/reverse",
		tags: ["Accounting", "Journal Entries"],
		summary: "Reverse a posted journal entry",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			date: z.string().datetime().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "invoices",
		});

		const entry = await db.journalEntry.findUnique({ where: { id: input.id } });
		if (!entry || entry.organizationId !== input.organizationId) {
			throw new Error("Journal entry not found");
		}

		const reversal = await reverseJournalEntry(
			db,
			input.id,
			context.user.id,
			input.date ? new Date(input.date) : new Date(),
		);

		const reversalWithLines = reversal as typeof reversal & { lines?: JournalEntryLine[] };
		const reversalLines = reversalWithLines.lines ?? [];
		return {
			...reversal,
			totalAmount: Number(reversal.totalAmount),
			lines: reversalLines.map((l) => ({
				...l,
				debit: Number(l.debit),
				credit: Number(l.credit),
			})),
		};
	});

// ========== Delete Draft Journal Entry ==========

export const deleteJournalEntryProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/accounting/journal/{id}",
		tags: ["Accounting", "Journal Entries"],
		summary: "Delete a draft journal entry",
	})
	.input(z.object({ organizationId: idString(), id: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "invoices",
		});

		const entry = await db.journalEntry.findUnique({ where: { id: input.id } });
		if (!entry || entry.organizationId !== input.organizationId) {
			throw new Error("Journal entry not found");
		}
		if (entry.status !== "DRAFT") {
			throw new Error("Only draft entries can be deleted");
		}

		await db.journalEntry.delete({ where: { id: input.id } });
		return { success: true };
	});

// ========== Trial Balance ==========

export const getTrialBalanceProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/reports/trial-balance",
		tags: ["Accounting", "Reports"],
		summary: "Get trial balance report",
	})
	.input(
		z.object({
			organizationId: idString(),
			asOfDate: z.string().datetime().optional(),
			dateFrom: z.string().datetime().optional(),
			includeZeroBalance: z.boolean().optional(),
			level: z.number().int().min(1).max(4).optional(),
			accountType: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "reports",
		});

		return getTrialBalance(db, input.organizationId, {
			asOfDate: input.asOfDate ? new Date(input.asOfDate) : undefined,
			dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
			includeZeroBalance: input.includeZeroBalance,
			level: input.level,
			accountType: input.accountType,
		});
	});

// ========== Balance Sheet ==========

export const getBalanceSheetProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/reports/balance-sheet",
		tags: ["Accounting", "Reports"],
		summary: "Get balance sheet report",
	})
	.input(
		z.object({
			organizationId: idString(),
			asOfDate: z.string().datetime().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "reports",
		});

		return getBalanceSheet(
			db,
			input.organizationId,
			input.asOfDate ? new Date(input.asOfDate) : undefined,
		);
	});

// ========== Journal Income Statement ==========

export const getJournalIncomeStatementProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/reports/income-statement",
		tags: ["Accounting", "Reports"],
		summary: "Get income statement from journal entries",
	})
	.input(
		z.object({
			organizationId: idString(),
			dateFrom: z.string().datetime(),
			dateTo: z.string().datetime(),
			includeComparison: z.boolean().optional().default(false),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "reports",
		});

		return getJournalIncomeStatement(db, input.organizationId, {
			dateFrom: new Date(input.dateFrom),
			dateTo: new Date(input.dateTo),
			includeComparison: input.includeComparison,
		});
	});

// ========== Create Adjustment Entry ==========

export const createAdjustmentEntryProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/journal/adjustment",
		tags: ["Accounting", "Journal Entries"],
		summary: "Create an adjusting journal entry",
	})
	.input(
		z.object({
			organizationId: idString(),
			adjustmentType: z.enum(["ACCRUAL", "PREPAYMENT", "DEPRECIATION", "PROVISION", "CORRECTION"]),
			date: z.string().datetime(),
			description: z.string().trim().min(1).max(MAX_DESC),
			notes: z.string().trim().max(MAX_DESC).optional(),
			autoPost: z.boolean().optional().default(false),
			lines: z
				.array(
					z.object({
						accountId: idString(),
						description: z.string().trim().max(MAX_DESC).optional(),
						debit: financialAmount(),
						credit: financialAmount(),
						projectId: idString().optional(),
					}),
				)
				.min(2)
				.max(MAX_ARRAY),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "invoices",
		});

		const { Prisma } = await import("@repo/database/prisma/generated/client");

		const entry = await createJournalEntry(db, {
			organizationId: input.organizationId,
			date: new Date(input.date),
			description: input.description,
			referenceType: "ADJUSTMENT",
			isAutoGenerated: false,
			lines: input.lines.map((l) => ({
				accountId: l.accountId,
				debit: new Prisma.Decimal(l.debit),
				credit: new Prisma.Decimal(l.credit),
				description: l.description,
				projectId: l.projectId,
			})),
			createdById: context.user.id,
		});

		if (!entry) {
			throw new Error("لا يمكن إنشاء قيد تسوية في فترة محاسبية مغلقة");
		}

		// Set adjustment type and notes
		await db.journalEntry.update({
			where: { id: entry.id },
			data: {
				adjustmentType: input.adjustmentType,
				notes: input.notes,
			},
		});

		// Auto-post if requested
		if (input.autoPost) {
			await postJournalEntry(db, entry.id, context.user.id);
		}

		const adjEntryWithLines = entry as typeof entry & { lines?: JournalEntryLine[] };
		const adjLines = adjEntryWithLines.lines ?? [];
		return {
			...entry,
			totalAmount: Number(entry.totalAmount),
			lines: adjLines.map((l) => ({
				...l,
				debit: Number(l.debit),
				credit: Number(l.credit),
			})),
		};
	});

// ========== Accounting Periods ==========

export const listPeriodsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/periods",
		tags: ["Accounting", "Periods"],
		summary: "List accounting periods",
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

		const where: Prisma.AccountingPeriodWhereInput = { organizationId: input.organizationId };
		if (input.year) {
			where.startDate = { gte: new Date(input.year, 0, 1) };
			where.endDate = { lte: new Date(input.year, 11, 31) };
		}

		const periods = await db.accountingPeriod.findMany({
			where,
			orderBy: { startDate: "asc" },
		});

		// Count posted entries per period
		const result = await Promise.all(
			periods.map(async (p) => {
				const entryCount = await db.journalEntry.count({
					where: {
						organizationId: input.organizationId,
						status: "POSTED",
						date: { gte: p.startDate, lte: p.endDate },
					},
				});
				return { ...p, entryCount };
			}),
		);

		return result;
	});

export const generatePeriodsProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/periods/generate",
		tags: ["Accounting", "Periods"],
		summary: "Generate monthly periods for a year",
	})
	.input(
		z.object({
			organizationId: idString(),
			year: z.number().int().min(2000).max(2100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "settings",
		});

		return generateMonthlyPeriods(db, input.organizationId, input.year);
	});

export const closePeriodProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/periods/{id}/close",
		tags: ["Accounting", "Periods"],
		summary: "Close an accounting period",
	})
	.input(z.object({
		organizationId: idString(),
		id: idString(),
		generateClosingEntry: z.boolean().optional().default(false),
	}))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "settings",
		});

		const period = await db.accountingPeriod.findUnique({ where: { id: input.id } });
		if (!period || period.organizationId !== input.organizationId) {
			throw new Error("Period not found");
		}

		return closePeriod(db, input.id, context.user.id, {
			generateClosingEntry: input.generateClosingEntry,
		});
	});

export const reopenPeriodProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/periods/{id}/reopen",
		tags: ["Accounting", "Periods"],
		summary: "Reopen the last closed accounting period",
	})
	.input(z.object({ organizationId: idString(), id: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "settings",
		});

		const period = await db.accountingPeriod.findUnique({ where: { id: input.id } });
		if (!period || period.organizationId !== input.organizationId) {
			throw new Error("Period not found");
		}

		await reopenPeriod(db, input.id);
		return { success: true };
	});

// ========== Bulk Post Journal Entries ==========

export const bulkPostJournalEntriesProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/journal/bulk-post",
		tags: ["Accounting", "Journal Entries"],
		summary: "Post multiple draft journal entries at once",
	})
	.input(
		z.object({
			organizationId: idString(),
			entryIds: z.array(idString()).min(1).max(500),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "edit",
		});

		return bulkPostJournalEntries(db, input.organizationId, input.entryIds, context.user.id);
	});

export const postAllDraftsProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/journal/post-all-drafts",
		tags: ["Accounting", "Journal Entries"],
		summary: "Post all draft journal entries",
	})
	.input(z.object({ organizationId: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "edit",
		});

		return bulkPostAllDrafts(db, input.organizationId, context.user.id);
	});

// ========== Find Journal Entry by Reference ==========

export const findJournalEntryByReferenceProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/journal/by-reference",
		tags: ["Accounting", "Journal Entries"],
		summary: "Find journal entry by reference type and ID",
	})
	.input(
		z.object({
			organizationId: idString(),
			referenceType: z.string().trim().max(MAX_ID),
			referenceId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return findJournalEntryByReference(db, input.organizationId, input.referenceType, input.referenceId);
	});

// ========== Cost Center Report ==========

export const getCostCenterReportProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/reports/cost-center",
		tags: ["Accounting", "Reports"],
		summary: "Get project cost center report",
	})
	.input(
		z.object({
			organizationId: idString(),
			dateFrom: z.string().datetime().optional(),
			dateTo: z.string().datetime().optional(),
			projectId: idString().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return getCostCenterByProject(db, input.organizationId, {
			dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
			dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
			projectId: input.projectId,
		});
	});

// ========== Accounting Dashboard ==========

export const getAccountingDashboardProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/dashboard",
		tags: ["Accounting", "Dashboard"],
		summary: "Get accounting dashboard KPIs",
	})
	.input(z.object({ organizationId: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return getAccountingDashboard(db, input.organizationId);
	});
