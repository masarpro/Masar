// Receipt Vouchers — سندات القبض
// CRUD + Issue + Cancel + Print + Summary

import { db, orgAuditLog, generateAtomicNo } from "@repo/database";
import { numberToArabicWords } from "@repo/utils";
import { z } from "zod";
import {
	protectedProcedure,
	subscriptionProcedure,
} from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { ORPCError } from "@orpc/server";
import {
	MAX_NAME, MAX_DESC, MAX_CODE, MAX_PHONE,
	idString, optionalTrimmed, nullishTrimmed, searchQuery,
	positiveAmount, paginationLimit, paginationOffset,
} from "../../../lib/validation-constants";
import { notifyEvent } from "../../notifications/lib/notify";

// ═══ Shared enums ═══
const paymentMethodEnum = z.enum([
	"CASH",
	"BANK_TRANSFER",
	"CHEQUE",
	"CREDIT_CARD",
	"OTHER",
]);

const voucherStatusEnum = z.enum(["DRAFT", "ISSUED", "CANCELLED"]);

// ═══════════════════════════════════════════════════════════════════════════
// LIST RECEIPT VOUCHERS
// ═══════════════════════════════════════════════════════════════════════════
export const listReceiptVouchers = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/receipt-vouchers",
		tags: ["Finance", "Receipt Vouchers"],
		summary: "List receipt vouchers for an organization",
	})
	.input(
		z.object({
			organizationId: idString(),
			status: voucherStatusEnum.optional(),
			clientId: z.string().trim().max(100).optional(),
			projectId: z.string().trim().max(100).optional(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
			search: searchQuery(),
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

		if (input.status) where.status = input.status;
		if (input.clientId) where.clientId = input.clientId;
		if (input.projectId) where.projectId = input.projectId;
		if (input.dateFrom || input.dateTo) {
			where.date = {};
			if (input.dateFrom) where.date.gte = input.dateFrom;
			if (input.dateTo) where.date.lte = input.dateTo;
		}
		if (input.search) {
			where.OR = [
				{ voucherNo: { contains: input.search, mode: "insensitive" } },
				{ receivedFrom: { contains: input.search, mode: "insensitive" } },
				{ description: { contains: input.search, mode: "insensitive" } },
			];
		}

		const [items, total] = await Promise.all([
			db.receiptVoucher.findMany({
				where,
				include: {
					client: { select: { id: true, name: true } },
					project: { select: { id: true, name: true } },
					destinationAccount: { select: { id: true, name: true } },
					createdBy: { select: { id: true, name: true } },
				},
				orderBy: { date: "desc" },
				take: input.limit,
				skip: input.offset,
			}),
			db.receiptVoucher.count({ where }),
		]);

		return { items, total };
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET RECEIPT VOUCHER BY ID
// ═══════════════════════════════════════════════════════════════════════════
export const getReceiptVoucher = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/receipt-vouchers/{id}",
		tags: ["Finance", "Receipt Vouchers"],
		summary: "Get a single receipt voucher",
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

		const voucher = await db.receiptVoucher.findFirst({
			where: {
				id: input.id,
				organizationId: input.organizationId,
			},
			include: {
				client: { select: { id: true, name: true } },
				project: { select: { id: true, name: true } },
				payment: { select: { id: true, paymentNo: true, amount: true } },
				invoicePayment: {
					select: {
						id: true,
						amount: true,
						invoice: { select: { id: true, invoiceNo: true, clientName: true } },
					},
				},
				projectPayment: {
					select: { id: true, paymentNo: true, amount: true },
				},
				destinationAccount: { select: { id: true, name: true, bankName: true } },
				createdBy: { select: { id: true, name: true } },
			},
		});

		if (!voucher) {
			throw new ORPCError("NOT_FOUND", {
				message: "سند القبض غير موجود",
			});
		}

		return voucher;
	});

// ═══════════════════════════════════════════════════════════════════════════
// CREATE RECEIPT VOUCHER
// ═══════════════════════════════════════════════════════════════════════════
export const createReceiptVoucher = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/receipt-vouchers",
		tags: ["Finance", "Receipt Vouchers"],
		summary: "Create a new receipt voucher",
	})
	.input(
		z.object({
			organizationId: idString(),
			date: z.coerce.date(),
			amount: positiveAmount(),
			receivedFrom: z.string().trim().min(1).max(MAX_NAME),
			paymentMethod: paymentMethodEnum.default("BANK_TRANSFER"),
			clientId: z.string().trim().max(100).optional(),
			projectId: z.string().trim().max(100).optional(),
			destinationAccountId: z.string().trim().max(100).optional(),
			checkNumber: z.string().trim().max(MAX_CODE).optional(),
			checkDate: z.coerce.date().optional(),
			checkBank: optionalTrimmed(MAX_NAME),
			bankName: optionalTrimmed(MAX_NAME),
			transferRef: z.string().trim().max(MAX_CODE).optional(),
			description: optionalTrimmed(MAX_DESC),
			notes: optionalTrimmed(MAX_DESC),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		// Validate that related entities belong to the same organization
		if (input.clientId) {
			const client = await db.client.findFirst({
				where: { id: input.clientId, organizationId: input.organizationId },
				select: { id: true },
			});
			if (!client) throw new ORPCError("BAD_REQUEST", { message: "العميل غير موجود" });
		}

		if (input.projectId) {
			const project = await db.project.findFirst({
				where: { id: input.projectId, organizationId: input.organizationId },
				select: { id: true },
			});
			if (!project) throw new ORPCError("BAD_REQUEST", { message: "المشروع غير موجود" });
		}

		if (input.destinationAccountId) {
			const bank = await db.organizationBank.findFirst({
				where: { id: input.destinationAccountId, organizationId: input.organizationId },
				select: { id: true },
			});
			if (!bank) throw new ORPCError("BAD_REQUEST", { message: "الحساب البنكي غير موجود" });
		}

		const voucherNo = await generateAtomicNo(input.organizationId, "RCV");
		const amountInWords = numberToArabicWords(input.amount);

		const voucher = await db.receiptVoucher.create({
			data: {
				organizationId: input.organizationId,
				voucherNo,
				date: input.date,
				amount: input.amount,
				amountInWords,
				receivedFrom: input.receivedFrom,
				paymentMethod: input.paymentMethod,
				clientId: input.clientId,
				projectId: input.projectId,
				destinationAccountId: input.destinationAccountId,
				checkNumber: input.checkNumber,
				checkDate: input.checkDate,
				checkBank: input.checkBank,
				bankName: input.bankName,
				transferRef: input.transferRef,
				description: input.description,
				notes: input.notes,
				status: "DRAFT",
				createdById: context.user.id,
			},
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "RECEIPT_VOUCHER_CREATED",
			entityType: "receipt_voucher",
			entityId: voucher.id,
			metadata: { voucherNo, amount: input.amount },
		});

		return voucher;
	});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE RECEIPT VOUCHER (DRAFT only)
// ═══════════════════════════════════════════════════════════════════════════
export const updateReceiptVoucher = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/finance/receipt-vouchers/{id}",
		tags: ["Finance", "Receipt Vouchers"],
		summary: "Update a receipt voucher (DRAFT only)",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			date: z.coerce.date().optional(),
			amount: positiveAmount().optional(),
			receivedFrom: z.string().trim().min(1).max(MAX_NAME).optional(),
			paymentMethod: paymentMethodEnum.optional(),
			clientId: z.string().trim().max(100).nullable().optional(),
			projectId: z.string().trim().max(100).nullable().optional(),
			destinationAccountId: z.string().trim().max(100).nullable().optional(),
			checkNumber: z.string().trim().max(MAX_CODE).nullable().optional(),
			checkDate: z.coerce.date().nullable().optional(),
			checkBank: nullishTrimmed(MAX_NAME),
			bankName: nullishTrimmed(MAX_NAME),
			transferRef: z.string().trim().max(MAX_CODE).nullable().optional(),
			description: nullishTrimmed(MAX_DESC),
			notes: nullishTrimmed(MAX_DESC),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		const existing = await db.receiptVoucher.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			select: { id: true, status: true },
		});

		if (!existing) {
			throw new ORPCError("NOT_FOUND", { message: "سند القبض غير موجود" });
		}
		if (existing.status !== "DRAFT") {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن تعديل سند قبض بعد إصداره",
			});
		}

		const { organizationId, id, ...data } = input;

		// Recalculate amountInWords if amount changed
		const updateData: any = { ...data };
		if (data.amount !== undefined) {
			updateData.amountInWords = numberToArabicWords(data.amount);
		}

		const voucher = await db.receiptVoucher.update({
			where: { id },
			data: updateData,
		});

		orgAuditLog({
			organizationId,
			actorId: context.user.id,
			action: "RECEIPT_VOUCHER_UPDATED",
			entityType: "receipt_voucher",
			entityId: id,
			metadata: data,
		});

		return voucher;
	});

// ═══════════════════════════════════════════════════════════════════════════
// ISSUE RECEIPT VOUCHER (DRAFT → ISSUED)
// ═══════════════════════════════════════════════════════════════════════════
export const issueReceiptVoucher = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/receipt-vouchers/{id}/issue",
		tags: ["Finance", "Receipt Vouchers"],
		summary: "Issue a receipt voucher (DRAFT → ISSUED)",
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

		const voucher = await db.receiptVoucher.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
		});

		if (!voucher) {
			throw new ORPCError("NOT_FOUND", { message: "سند القبض غير موجود" });
		}
		if (voucher.status !== "DRAFT") {
			throw new ORPCError("BAD_REQUEST", {
				message: "يمكن إصدار السندات بحالة مسودة فقط",
			});
		}

		const isManual = !voucher.paymentId && !voucher.invoicePaymentId && !voucher.projectPaymentId;

		// Status flip + bank move run in ONE transaction with an optimistic guard,
		// so a losing issue race rolls back and can't double-credit the balance.
		const updated = await db.$transaction(async (tx) => {
			const flip = await tx.receiptVoucher.updateMany({
				where: {
					id: input.id,
					organizationId: input.organizationId,
					status: "DRAFT",
				},
				data: { status: "ISSUED" },
			});
			if (flip.count === 0) {
				throw new ORPCError("CONFLICT", {
					message: "يمكن إصدار السندات بحالة مسودة فقط",
				});
			}

			// Money received in → increase the destination bank balance so the
			// operational balance matches the GL entry onReceiptVoucherIssued posts.
			if (isManual && voucher.destinationAccountId) {
				await tx.organizationBank.updateMany({
					where: {
						id: voucher.destinationAccountId,
						organizationId: input.organizationId,
					},
					data: { balance: { increment: Number(voucher.amount) } },
				});
			}

			return tx.receiptVoucher.findFirstOrThrow({
				where: { id: input.id, organizationId: input.organizationId },
			});
		});

		// Generate accounting entry ONLY for manual (standalone) vouchers.
		// Auto vouchers are created already-ISSUED and never reach this handler,
		// so moving the balance here can't double-count their source payment.
		if (isManual) {
			try {
				const { onReceiptVoucherIssued } = await import(
					"../../../lib/accounting/auto-journal"
				);
				await onReceiptVoucherIssued(db, {
					id: voucher.id,
					organizationId: voucher.organizationId,
					voucherNo: voucher.voucherNo,
					amount: voucher.amount,
					date: voucher.date,
					receivedFrom: voucher.receivedFrom,
					destinationAccountId: voucher.destinationAccountId,
					projectId: voucher.projectId,
					userId: context.user.id,
				});
			} catch (e) {
				console.error("[AutoJournal] Failed to generate entry for receipt voucher:", e);
				await orgAuditLog({
					organizationId: input.organizationId,
					actorId: context.user.id,
					action: "JOURNAL_ENTRY_FAILED",
					entityType: "journal_entry",
					entityId: input.id,
					metadata: { error: String(e), referenceType: "RECEIPT_VOUCHER" },
				});
			}
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "RECEIPT_VOUCHER_ISSUED",
			entityType: "receipt_voucher",
			entityId: input.id,
			metadata: { voucherNo: voucher.voucherNo, isManual },
		});

		await notifyEvent({
			event: "finance.receiptVoucherIssued",
			organizationId: input.organizationId,
			actorId: context.user.id,
			entity: { type: "receiptVoucher", id: voucher.id },
			data: {
				voucherNo: voucher.voucherNo,
				amount: `${new Intl.NumberFormat("en-US").format(Number(voucher.amount))} ر.س`,
			},
		});

		return updated;
	});

// ═══════════════════════════════════════════════════════════════════════════
// CANCEL RECEIPT VOUCHER
// ═══════════════════════════════════════════════════════════════════════════
export const cancelReceiptVoucher = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/receipt-vouchers/{id}/cancel",
		tags: ["Finance", "Receipt Vouchers"],
		summary: "Cancel a receipt voucher",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			cancelReason: z.string().trim().min(1).max(MAX_DESC),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		const voucher = await db.receiptVoucher.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			select: { id: true, status: true, paymentId: true, invoicePaymentId: true, projectPaymentId: true, voucherNo: true, destinationAccountId: true, amount: true },
		});

		if (!voucher) {
			throw new ORPCError("NOT_FOUND", { message: "سند القبض غير موجود" });
		}
		if (voucher.status === "CANCELLED") {
			throw new ORPCError("BAD_REQUEST", { message: "السند ملغي بالفعل" });
		}

		const isManual = !voucher.paymentId && !voucher.invoicePaymentId && !voucher.projectPaymentId;
		const wasIssued = voucher.status === "ISSUED";

		// Status flip + balance reversal run in ONE transaction with an optimistic
		// guard, so a losing cancel race rolls back and can't double-reverse.
		const updated = await db.$transaction(async (tx) => {
			const flip = await tx.receiptVoucher.updateMany({
				where: {
					id: input.id,
					organizationId: input.organizationId,
					status: voucher.status,
				},
				data: {
					status: "CANCELLED",
					cancelledAt: new Date(),
					cancelReason: input.cancelReason,
				},
			});
			if (flip.count === 0) {
				throw new ORPCError("CONFLICT", { message: "السند ملغي بالفعل" });
			}

			// Reverse the balance increment applied at issue time.
			if (wasIssued && isManual && voucher.destinationAccountId) {
				await tx.organizationBank.updateMany({
					where: {
						id: voucher.destinationAccountId,
						organizationId: input.organizationId,
					},
					data: { balance: { decrement: Number(voucher.amount) } },
				});
			}

			return tx.receiptVoucher.findFirstOrThrow({
				where: { id: input.id, organizationId: input.organizationId },
			});
		});

		// Reverse accounting entry if voucher was ISSUED and is manual
		if (wasIssued && isManual) {
			try {
				const { reverseAutoJournalEntry } = await import(
					"../../../lib/accounting/auto-journal"
				);
				await reverseAutoJournalEntry(db, {
					organizationId: input.organizationId,
					referenceType: "RECEIPT_VOUCHER",
					referenceId: input.id,
					userId: context.user.id,
				});
			} catch (e) {
				console.error("[AutoJournal] Failed to reverse entry for cancelled receipt voucher:", e);
				await orgAuditLog({
					organizationId: input.organizationId,
					actorId: context.user.id,
					action: "JOURNAL_ENTRY_FAILED",
					entityType: "journal_entry",
					entityId: input.id,
					metadata: { error: String(e), referenceType: "RECEIPT_VOUCHER" },
				});
			}
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "RECEIPT_VOUCHER_CANCELLED",
			entityType: "receipt_voucher",
			entityId: input.id,
			metadata: { voucherNo: voucher.voucherNo, cancelReason: input.cancelReason },
		});

		return updated;
	});

// ═══════════════════════════════════════════════════════════════════════════
// PRINT RECEIPT VOUCHER — record print event
// ═══════════════════════════════════════════════════════════════════════════
export const printReceiptVoucher = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/receipt-vouchers/{id}/print",
		tags: ["Finance", "Receipt Vouchers"],
		summary: "Record a print event for a receipt voucher",
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

		const owned = await db.receiptVoucher.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			select: { id: true },
		});
		if (!owned) {
			throw new ORPCError("NOT_FOUND", { message: "سند القبض غير موجود" });
		}

		return db.receiptVoucher.update({
			where: { id: input.id },
			data: {
				printCount: { increment: 1 },
				lastPrintedAt: new Date(),
			},
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET RECEIPT VOUCHER SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
export const getReceiptVoucherSummary = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/receipt-vouchers/summary",
		tags: ["Finance", "Receipt Vouchers"],
		summary: "Get receipt voucher summary stats",
	})
	.input(
		z.object({
			organizationId: idString(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
			projectId: z.string().trim().max(100).optional(),
			clientId: z.string().trim().max(100).optional(),
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

		if (input.dateFrom || input.dateTo) {
			where.date = {};
			if (input.dateFrom) where.date.gte = input.dateFrom;
			if (input.dateTo) where.date.lte = input.dateTo;
		}
		if (input.projectId) where.projectId = input.projectId;
		if (input.clientId) where.clientId = input.clientId;

		const [byStatus, byPaymentMethod] = await Promise.all([
			db.receiptVoucher.groupBy({
				by: ["status"],
				where,
				_sum: { amount: true },
				_count: { id: true },
			}),
			db.receiptVoucher.groupBy({
				by: ["paymentMethod"],
				where: { ...where, status: "ISSUED" },
				_sum: { amount: true },
				_count: { id: true },
			}),
		]);

		const issuedGroup = byStatus.find((g) => g.status === "ISSUED");

		return {
			totalAmount: Number(issuedGroup?._sum?.amount ?? 0),
			count: issuedGroup?._count?.id ?? 0,
			byStatus: byStatus.map((g) => ({
				status: g.status,
				total: Number(g._sum?.amount ?? 0),
				count: g._count?.id ?? 0,
			})),
			byPaymentMethod: byPaymentMethod.map((g) => ({
				method: g.paymentMethod,
				total: Number(g._sum?.amount ?? 0),
				count: g._count?.id ?? 0,
			})),
		};
	});
