import {
	getExpenseRuns,
	getExpenseRunById,
	createExpenseRun,
	populateExpenseRun,
	postExpenseRun,
	cancelExpenseRun,
	getExpenseRunSummary,
	updateExpenseRunItem,
	deleteExpenseRunItem,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

const expenseRunStatusEnum = z.enum([
	"DRAFT",
	"POSTED",
	"CANCELLED",
]);

// ═══════════════════════════════════════════════════════════════════════════
// LIST EXPENSE RUNS
// ═══════════════════════════════════════════════════════════════════════════
export const listExpenseRuns = protectedProcedure
	.route({
		method: "GET",
		path: "/company/expense-runs",
		tags: ["Company", "ExpenseRuns"],
		summary: "List expense runs for an organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
			status: expenseRunStatusEnum.optional(),
			year: z.number().optional(),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "view",
		});

		return getExpenseRuns(input.organizationId, {
			status: input.status,
			year: input.year,
			limit: input.limit,
			offset: input.offset,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET EXPENSE RUN BY ID
// ═══════════════════════════════════════════════════════════════════════════
export const getExpenseRunByIdProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/company/expense-runs/{id}",
		tags: ["Company", "ExpenseRuns"],
		summary: "Get a single expense run with items",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "view",
		});

		const run = await getExpenseRunById(input.id, input.organizationId);
		if (!run) {
			throw new Error("Expense run not found");
		}
		return run;
	});

// ═══════════════════════════════════════════════════════════════════════════
// CREATE EXPENSE RUN
// ═══════════════════════════════════════════════════════════════════════════
export const createExpenseRunProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/company/expense-runs",
		tags: ["Company", "ExpenseRuns"],
		summary: "Create a new expense run",
	})
	.input(
		z.object({
			organizationId: z.string(),
			month: z.number().min(1).max(12),
			year: z.number().min(2020).max(2100),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		try {
			return await createExpenseRun({
				organizationId: input.organizationId,
				createdById: context.user.id,
				month: input.month,
				year: input.year,
				notes: input.notes,
			});
		} catch (err: any) {
			if (err?.code === "P2002") {
				throw new Error(`دورة مصروفات لشهر ${input.month}/${input.year} موجودة بالفعل`);
			}
			throw err;
		}
	});

// ═══════════════════════════════════════════════════════════════════════════
// POPULATE EXPENSE RUN
// ═══════════════════════════════════════════════════════════════════════════
export const populateExpenseRunProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/company/expense-runs/{id}/populate",
		tags: ["Company", "ExpenseRuns"],
		summary: "Populate expense run with active recurring expenses",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		return populateExpenseRun(input.id, input.organizationId);
	});

// ═══════════════════════════════════════════════════════════════════════════
// POST EXPENSE RUN TO FINANCE
// ═══════════════════════════════════════════════════════════════════════════
export const postExpenseRunProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/company/expense-runs/{id}/post",
		tags: ["Company", "ExpenseRuns"],
		summary: "Post expense run to finance (create PENDING expenses)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		return postExpenseRun(input.id, {
			organizationId: input.organizationId,
			postedById: context.user.id,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// CANCEL EXPENSE RUN
// ═══════════════════════════════════════════════════════════════════════════
export const cancelExpenseRunProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/company/expense-runs/{id}/cancel",
		tags: ["Company", "ExpenseRuns"],
		summary: "Cancel an expense run and linked expenses",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		return cancelExpenseRun(input.id, input.organizationId);
	});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE EXPENSE RUN ITEM
// ═══════════════════════════════════════════════════════════════════════════
export const updateExpenseRunItemProcedure = protectedProcedure
	.route({
		method: "PATCH",
		path: "/company/expense-runs/items/{itemId}",
		tags: ["Company", "ExpenseRuns"],
		summary: "Update an expense run item (DRAFT only)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			itemId: z.string(),
			amount: z.number().min(0).optional(),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		return updateExpenseRunItem(input.itemId, input.organizationId, {
			amount: input.amount,
			notes: input.notes,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE EXPENSE RUN ITEM
// ═══════════════════════════════════════════════════════════════════════════
export const deleteExpenseRunItemProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/company/expense-runs/items/{itemId}",
		tags: ["Company", "ExpenseRuns"],
		summary: "Delete an expense run item (DRAFT only)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			itemId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		return deleteExpenseRunItem(input.itemId, input.organizationId);
	});

// ═══════════════════════════════════════════════════════════════════════════
// EXPENSE RUN SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
export const expenseRunSummaryProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/company/expense-runs/summary",
		tags: ["Company", "ExpenseRuns"],
		summary: "Get expense run summary (current month status)",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "view",
		});

		return getExpenseRunSummary(input.organizationId);
	});
