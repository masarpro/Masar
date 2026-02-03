import {
	getOrganizationTransfers,
	getTransferById,
	createTransfer,
	cancelTransfer,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

// Enums
const financeTransactionStatusEnum = z.enum([
	"PENDING",
	"COMPLETED",
	"CANCELLED",
]);

// ═══════════════════════════════════════════════════════════════════════════
// LIST TRANSFERS
// ═══════════════════════════════════════════════════════════════════════════
export const listTransfers = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/transfers",
		tags: ["Finance", "Transfers"],
		summary: "List transfers between accounts",
	})
	.input(
		z.object({
			organizationId: z.string(),
			fromAccountId: z.string().optional(),
			toAccountId: z.string().optional(),
			status: financeTransactionStatusEnum.optional(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
			query: z.string().optional(),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return getOrganizationTransfers(input.organizationId, {
			fromAccountId: input.fromAccountId,
			toAccountId: input.toAccountId,
			status: input.status,
			dateFrom: input.dateFrom,
			dateTo: input.dateTo,
			query: input.query,
			limit: input.limit,
			offset: input.offset,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET SINGLE TRANSFER
// ═══════════════════════════════════════════════════════════════════════════
export const getTransfer = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/transfers/{id}",
		tags: ["Finance", "Transfers"],
		summary: "Get a single transfer",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const transfer = await getTransferById(input.id, input.organizationId);

		if (!transfer) {
			throw new Error("Transfer not found");
		}

		return transfer;
	});

// ═══════════════════════════════════════════════════════════════════════════
// CREATE TRANSFER
// ═══════════════════════════════════════════════════════════════════════════
export const createTransferProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/transfers",
		tags: ["Finance", "Transfers"],
		summary: "Create a transfer between accounts",
	})
	.input(
		z.object({
			organizationId: z.string(),
			amount: z.number().positive(),
			date: z.coerce.date(),
			fromAccountId: z.string(),
			toAccountId: z.string(),
			description: z.string().optional(),
			notes: z.string().optional(),
			referenceNo: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "create",
		});

		return createTransfer({
			organizationId: input.organizationId,
			createdById: context.user.id,
			amount: input.amount,
			date: input.date,
			fromAccountId: input.fromAccountId,
			toAccountId: input.toAccountId,
			description: input.description,
			notes: input.notes,
			referenceNo: input.referenceNo,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// CANCEL TRANSFER
// ═══════════════════════════════════════════════════════════════════════════
export const cancelTransferProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/transfers/{id}/cancel",
		tags: ["Finance", "Transfers"],
		summary: "Cancel a transfer",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "delete",
		});

		return cancelTransfer(input.id, input.organizationId);
	});
