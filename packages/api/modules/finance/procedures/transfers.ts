import {
	getOrganizationTransfers,
	getTransferById,
	createTransfer,
	cancelTransfer,
	orgAuditLog,
	db,
} from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import {
	MAX_DESC, MAX_CODE,
	idString, optionalTrimmed, searchQuery,
	positiveAmount, paginationLimit, paginationOffset,
} from "../../../lib/validation-constants";
import { notifyEvent } from "../../notifications/lib/notify";

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
			organizationId: idString(),
			fromAccountId: z.string().trim().max(100).optional(),
			toAccountId: z.string().trim().max(100).optional(),
			status: financeTransactionStatusEnum.optional(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
			query: searchQuery(),
			limit: paginationLimit(),
			offset: paginationOffset(),
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
			organizationId: idString(),
			id: idString(),
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
export const createTransferProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/transfers",
		tags: ["Finance", "Transfers"],
		summary: "Create a transfer between accounts",
	})
	.input(
		z.object({
			organizationId: idString(),
			amount: positiveAmount(),
			date: z.coerce.date(),
			fromAccountId: idString(),
			toAccountId: idString(),
			description: optionalTrimmed(MAX_DESC),
			notes: optionalTrimmed(MAX_DESC),
			referenceNo: z.string().trim().max(MAX_CODE).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		let transfer: Awaited<ReturnType<typeof createTransfer>>;
		try {
			transfer = await createTransfer({
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
		} catch (e) {
			// Surface validation errors (e.g. insufficient balance) to the client as
			// a proper 400 instead of an opaque 500 that hides the Arabic message.
			const msg = e instanceof Error ? e.message : "فشل إنشاء التحويل";
			if (msg.includes("الرصيد غير كافي") || msg.includes("insufficient")) {
				throw new ORPCError("BAD_REQUEST", { message: msg });
			}
			throw e;
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "TRANSFER_CREATED",
			entityType: "transfer",
			entityId: transfer.id,
			metadata: { amount: input.amount, fromAccountId: input.fromAccountId, toAccountId: input.toAccountId },
		});

		// Auto-Journal: generate accounting entry for transfer
		try {
			const { onTransferCompleted } = await import("../../../lib/accounting/auto-journal");
			await onTransferCompleted(db, {
				id: transfer.id,
				organizationId: input.organizationId,
				amount: transfer.amount,
				date: transfer.date,
				fromAccountId: input.fromAccountId,
				toAccountId: input.toAccountId,
				description: input.description,
				userId: context.user.id,
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to generate entry for transfer:", e);
			orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: transfer.id,
				metadata: { error: String(e), referenceType: "TRANSFER" },
			});
		}

		const transferAccounts = await db.organizationBank.findMany({
			where: {
				id: { in: [input.fromAccountId, input.toAccountId] },
				organizationId: input.organizationId,
			},
			select: { id: true, name: true },
		});
		await notifyEvent({
			event: "finance.transferCompleted",
			organizationId: input.organizationId,
			actorId: context.user.id,
			entity: { type: "transfer", id: transfer.id },
			data: {
				amount: `${new Intl.NumberFormat("en-US").format(Number(transfer.amount))} ر.س`,
				fromAccount: transferAccounts.find((a) => a.id === input.fromAccountId)?.name,
				toAccount: transferAccounts.find((a) => a.id === input.toAccountId)?.name,
			},
		});

		return transfer;
	});

// ═══════════════════════════════════════════════════════════════════════════
// CANCEL TRANSFER
// ═══════════════════════════════════════════════════════════════════════════
export const cancelTransferProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/transfers/{id}/cancel",
		tags: ["Finance", "Transfers"],
		summary: "Cancel a transfer",
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
			action: "payments",
		});

		const transfer = await cancelTransfer(input.id, input.organizationId);

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "TRANSFER_CANCELLED",
			entityType: "transfer",
			entityId: input.id,
		});

		// Auto-Journal: reverse accounting entry for cancelled transfer
		try {
			const { reverseAutoJournalEntry } = await import("../../../lib/accounting/auto-journal");
			await reverseAutoJournalEntry(db, {
				organizationId: input.organizationId,
				referenceType: "TRANSFER",
				referenceId: input.id,
				userId: context.user.id,
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to reverse entry for cancelled transfer:", e);
			orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: input.id,
				metadata: { error: String(e), referenceType: "TRANSFER" },
			});
		}

		return transfer;
	});
