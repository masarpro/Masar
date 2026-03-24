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
			organizationId: z.string(),
			status: voucherStatusEnum.optional(),
			clientId: z.string().optional(),
			projectId: z.string().optional(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
			search: z.string().optional(),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
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
			organizationId: z.string(),
			id: z.string(),
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
			organizationId: z.string(),
			date: z.coerce.date(),
			amount: z.number().positive(),
			receivedFrom: z.string().min(1).max(200),
			paymentMethod: paymentMethodEnum.default("BANK_TRANSFER"),
			clientId: z.string().optional(),
			projectId: z.string().optional(),
			destinationAccountId: z.string().optional(),
			checkNumber: z.string().optional(),
			checkDate: z.coerce.date().optional(),
			checkBank: z.string().optional(),
			bankName: z.string().optional(),
			transferRef: z.string().optional(),
			description: z.string().optional(),
			notes: z.string().optional(),
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
			organizationId: z.string(),
			id: z.string(),
			date: z.coerce.date().optional(),
			amount: z.number().positive().optional(),
			receivedFrom: z.string().min(1).max(200).optional(),
			paymentMethod: paymentMethodEnum.optional(),
			clientId: z.string().nullable().optional(),
			projectId: z.string().nullable().optional(),
			destinationAccountId: z.string().nullable().optional(),
			checkNumber: z.string().nullable().optional(),
			checkDate: z.coerce.date().nullable().optional(),
			checkBank: z.string().nullable().optional(),
			bankName: z.string().nullable().optional(),
			transferRef: z.string().nullable().optional(),
			description: z.string().nullable().optional(),
			notes: z.string().nullable().optional(),
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
			organizationId: z.string(),
			id: z.string(),
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

		const updated = await db.receiptVoucher.update({
			where: { id: input.id },
			data: { status: "ISSUED" },
		});

		// Generate accounting entry ONLY for manual (standalone) vouchers
		const isManual = !voucher.paymentId && !voucher.invoicePaymentId && !voucher.projectPaymentId;
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
				});
			} catch (e) {
				console.error("[AutoJournal] Failed to generate entry for receipt voucher:", e);
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
			organizationId: z.string(),
			id: z.string(),
			cancelReason: z.string().min(1),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		const voucher = await db.receiptVoucher.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			select: { id: true, status: true, paymentId: true, invoicePaymentId: true, projectPaymentId: true, voucherNo: true },
		});

		if (!voucher) {
			throw new ORPCError("NOT_FOUND", { message: "سند القبض غير موجود" });
		}
		if (voucher.status === "CANCELLED") {
			throw new ORPCError("BAD_REQUEST", { message: "السند ملغي بالفعل" });
		}

		const updated = await db.receiptVoucher.update({
			where: { id: input.id },
			data: {
				status: "CANCELLED",
				cancelledAt: new Date(),
				cancelReason: input.cancelReason,
			},
		});

		// Reverse accounting entry if voucher was ISSUED and is manual
		const isManual = !voucher.paymentId && !voucher.invoicePaymentId && !voucher.projectPaymentId;
		if (voucher.status === "ISSUED" && isManual) {
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
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

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
			organizationId: z.string(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
			projectId: z.string().optional(),
			clientId: z.string().optional(),
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
