import {
	getBankJournalLines,
	createBankReconciliation,
	listBankReconciliations,
} from "@repo/database";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const getBankLinesForReconciliationProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/banks/reconciliation/lines",
		tags: ["Finance", "Bank Reconciliation"],
		summary: "Get journal entry lines for a bank account",
	})
	.input(
		z.object({
			organizationId: z.string(),
			bankAccountId: z.string(),
			dateFrom: z.string().datetime().optional(),
			dateTo: z.string().datetime().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		// Get the bank's chart account ID
		const bank = await db.organizationBank.findFirst({
			where: { id: input.bankAccountId, organizationId: input.organizationId },
			select: { chartAccountId: true },
		});
		if (!bank?.chartAccountId) {
			throw new Error("Bank account is not linked to chart of accounts");
		}

		return getBankJournalLines(
			db,
			input.organizationId,
			bank.chartAccountId,
			input.dateFrom ? new Date(input.dateFrom) : undefined,
			input.dateTo ? new Date(input.dateTo) : undefined,
		);
	});

export const createReconciliationProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/banks/reconciliation",
		tags: ["Finance", "Bank Reconciliation"],
		summary: "Create bank reconciliation",
	})
	.input(
		z.object({
			organizationId: z.string(),
			bankAccountId: z.string(),
			reconciliationDate: z.string().datetime(),
			statementBalance: z.number(),
			bookBalance: z.number(),
			matchedLineIds: z.array(z.string()),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "edit",
		});

		return createBankReconciliation(db, input.organizationId, {
			bankAccountId: input.bankAccountId,
			reconciliationDate: new Date(input.reconciliationDate),
			statementBalance: input.statementBalance,
			bookBalance: input.bookBalance,
			matchedLineIds: input.matchedLineIds,
			notes: input.notes,
			createdById: context.user.id,
		});
	});

export const listReconciliationsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/banks/reconciliation/history",
		tags: ["Finance", "Bank Reconciliation"],
		summary: "List bank reconciliation history",
	})
	.input(
		z.object({
			organizationId: z.string(),
			bankAccountId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const items = await listBankReconciliations(db, input.organizationId, input.bankAccountId);
		return items.map((r) => ({
			...r,
			statementBalance: Number(r.statementBalance),
			bookBalance: Number(r.bookBalance),
			difference: Number(r.difference),
		}));
	});
