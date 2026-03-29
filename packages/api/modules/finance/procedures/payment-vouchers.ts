// Payment Vouchers — سندات الصرف
// CRUD + Submit + Approve + Reject + Cancel + Print + Summary

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

const payeeTypeEnum = z.enum([
	"SUBCONTRACTOR",
	"SUPPLIER",
	"EMPLOYEE",
	"OTHER",
]);

const voucherStatusEnum = z.enum([
	"DRAFT",
	"PENDING_APPROVAL",
	"ISSUED",
	"CANCELLED",
]);

// ═══════════════════════════════════════════════════════════════════════════
// LIST PAYMENT VOUCHERS
// ═══════════════════════════════════════════════════════════════════════════
export const listPaymentVouchers = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/payment-vouchers",
		tags: ["Finance", "Payment Vouchers"],
		summary: "List payment vouchers for an organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
			status: voucherStatusEnum.optional(),
			payeeType: payeeTypeEnum.optional(),
			projectId: z.string().optional(),
			subcontractContractId: z.string().optional(),
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
		if (input.payeeType) where.payeeType = input.payeeType;
		if (input.projectId) where.projectId = input.projectId;
		if (input.subcontractContractId) where.subcontractContractId = input.subcontractContractId;
		if (input.dateFrom || input.dateTo) {
			where.date = {};
			if (input.dateFrom) where.date.gte = input.dateFrom;
			if (input.dateTo) where.date.lte = input.dateTo;
		}
		if (input.search) {
			where.OR = [
				{ voucherNo: { contains: input.search, mode: "insensitive" } },
				{ payeeName: { contains: input.search, mode: "insensitive" } },
				{ description: { contains: input.search, mode: "insensitive" } },
			];
		}

		const [items, total] = await Promise.all([
			db.paymentVoucher.findMany({
				where,
				include: {
					project: { select: { id: true, name: true } },
					subcontractContract: { select: { id: true, name: true } },
					sourceAccount: { select: { id: true, name: true } },
					preparedBy: { select: { id: true, name: true } },
					approvedBy: { select: { id: true, name: true } },
				},
				orderBy: { date: "desc" },
				take: input.limit,
				skip: input.offset,
			}),
			db.paymentVoucher.count({ where }),
		]);

		return { items, total };
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET PAYMENT VOUCHER BY ID
// ═══════════════════════════════════════════════════════════════════════════
export const getPaymentVoucher = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/payment-vouchers/{id}",
		tags: ["Finance", "Payment Vouchers"],
		summary: "Get a single payment voucher",
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

		const voucher = await db.paymentVoucher.findFirst({
			where: {
				id: input.id,
				organizationId: input.organizationId,
			},
			include: {
				project: { select: { id: true, name: true } },
				subcontractContract: { select: { id: true, name: true } },
				expense: { select: { id: true, expenseNo: true, amount: true, category: true } },
				subcontractPayment: { select: { id: true, paymentNo: true, amount: true } },
				sourceAccount: { select: { id: true, name: true, bankName: true } },
				preparedBy: { select: { id: true, name: true, image: true } },
				approvedBy: { select: { id: true, name: true, image: true } },
			},
		});

		if (!voucher) {
			throw new ORPCError("NOT_FOUND", {
				message: "سند الصرف غير موجود",
			});
		}

		return voucher;
	});

// ═══════════════════════════════════════════════════════════════════════════
// CREATE PAYMENT VOUCHER
// ═══════════════════════════════════════════════════════════════════════════
export const createPaymentVoucher = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/payment-vouchers",
		tags: ["Finance", "Payment Vouchers"],
		summary: "Create a new payment voucher",
	})
	.input(
		z.object({
			organizationId: z.string(),
			date: z.coerce.date(),
			amount: z.number().positive(),
			payeeName: z.string().min(1).max(200),
			payeeType: payeeTypeEnum.default("OTHER"),
			paymentMethod: paymentMethodEnum.default("BANK_TRANSFER"),
			projectId: z.string().optional(),
			subcontractContractId: z.string().optional(),
			sourceAccountId: z.string().optional(),
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

		if (input.projectId) {
			const project = await db.project.findFirst({
				where: { id: input.projectId, organizationId: input.organizationId },
				select: { id: true },
			});
			if (!project) throw new ORPCError("BAD_REQUEST", { message: "المشروع غير موجود" });
		}

		if (input.subcontractContractId) {
			const contract = await db.subcontractContract.findFirst({
				where: { id: input.subcontractContractId, organizationId: input.organizationId },
				select: { id: true },
			});
			if (!contract) throw new ORPCError("BAD_REQUEST", { message: "عقد الباطن غير موجود" });
		}

		if (input.sourceAccountId) {
			const bank = await db.organizationBank.findFirst({
				where: { id: input.sourceAccountId, organizationId: input.organizationId },
				select: { id: true },
			});
			if (!bank) throw new ORPCError("BAD_REQUEST", { message: "الحساب البنكي غير موجود" });
		}

		const voucherNo = await generateAtomicNo(input.organizationId, "PMT");
		const amountInWords = numberToArabicWords(input.amount);

		const voucher = await db.paymentVoucher.create({
			data: {
				organizationId: input.organizationId,
				voucherNo,
				date: input.date,
				amount: input.amount,
				amountInWords,
				payeeName: input.payeeName,
				payeeType: input.payeeType,
				paymentMethod: input.paymentMethod,
				projectId: input.projectId,
				subcontractContractId: input.subcontractContractId,
				sourceAccountId: input.sourceAccountId,
				checkNumber: input.checkNumber,
				checkDate: input.checkDate,
				checkBank: input.checkBank,
				bankName: input.bankName,
				transferRef: input.transferRef,
				description: input.description,
				notes: input.notes,
				status: "DRAFT",
				preparedById: context.user.id,
			},
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "PAYMENT_VOUCHER_CREATED",
			entityType: "payment_voucher",
			entityId: voucher.id,
			metadata: { voucherNo, amount: input.amount, payeeType: input.payeeType },
		});

		return voucher;
	});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE PAYMENT VOUCHER (DRAFT only)
// ═══════════════════════════════════════════════════════════════════════════
export const updatePaymentVoucher = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/finance/payment-vouchers/{id}",
		tags: ["Finance", "Payment Vouchers"],
		summary: "Update a payment voucher (DRAFT only)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			date: z.coerce.date().optional(),
			amount: z.number().positive().optional(),
			payeeName: z.string().min(1).max(200).optional(),
			payeeType: payeeTypeEnum.optional(),
			paymentMethod: paymentMethodEnum.optional(),
			projectId: z.string().nullable().optional(),
			subcontractContractId: z.string().nullable().optional(),
			sourceAccountId: z.string().nullable().optional(),
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

		const existing = await db.paymentVoucher.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			select: { id: true, status: true },
		});

		if (!existing) {
			throw new ORPCError("NOT_FOUND", { message: "سند الصرف غير موجود" });
		}
		if (existing.status !== "DRAFT") {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن تعديل سند صرف بعد تقديمه للاعتماد",
			});
		}

		const { organizationId, id, ...data } = input;
		const updateData: any = { ...data };
		if (data.amount !== undefined) {
			updateData.amountInWords = numberToArabicWords(data.amount);
		}

		const voucher = await db.paymentVoucher.update({
			where: { id },
			data: updateData,
		});

		orgAuditLog({
			organizationId,
			actorId: context.user.id,
			action: "PAYMENT_VOUCHER_UPDATED",
			entityType: "payment_voucher",
			entityId: id,
			metadata: data,
		});

		return voucher;
	});

// ═══════════════════════════════════════════════════════════════════════════
// SUBMIT PAYMENT VOUCHER (DRAFT → PENDING_APPROVAL)
// ═══════════════════════════════════════════════════════════════════════════
export const submitPaymentVoucher = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/payment-vouchers/{id}/submit",
		tags: ["Finance", "Payment Vouchers"],
		summary: "Submit a payment voucher for approval",
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

		const voucher = await db.paymentVoucher.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			select: { id: true, status: true, voucherNo: true },
		});

		if (!voucher) {
			throw new ORPCError("NOT_FOUND", { message: "سند الصرف غير موجود" });
		}
		if (voucher.status !== "DRAFT") {
			throw new ORPCError("BAD_REQUEST", {
				message: "يمكن تقديم السندات بحالة مسودة فقط",
			});
		}

		const updated = await db.paymentVoucher.update({
			where: { id: input.id },
			data: { status: "PENDING_APPROVAL" },
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "PAYMENT_VOUCHER_SUBMITTED",
			entityType: "payment_voucher",
			entityId: input.id,
			metadata: { voucherNo: voucher.voucherNo },
		});

		return updated;
	});

// ═══════════════════════════════════════════════════════════════════════════
// APPROVE PAYMENT VOUCHER (PENDING_APPROVAL → ISSUED)
// ═══════════════════════════════════════════════════════════════════════════
export const approvePaymentVoucher = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/payment-vouchers/{id}/approve",
		tags: ["Finance", "Payment Vouchers"],
		summary: "Approve a payment voucher (PENDING_APPROVAL → ISSUED)",
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

		const voucher = await db.paymentVoucher.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
		});

		if (!voucher) {
			throw new ORPCError("NOT_FOUND", { message: "سند الصرف غير موجود" });
		}
		if (voucher.status !== "PENDING_APPROVAL") {
			throw new ORPCError("BAD_REQUEST", {
				message: "يمكن اعتماد السندات المعلّقة فقط",
			});
		}

		// Separation of duties — المُعدّ لا يعتمد سنده
		if (voucher.preparedById === context.user.id) {
			throw new ORPCError("FORBIDDEN", {
				message: "لا يمكنك اعتماد سند صرف أنشأته بنفسك",
			});
		}

		const updated = await db.paymentVoucher.update({
			where: { id: input.id },
			data: {
				status: "ISSUED",
				approvedById: context.user.id,
				approvedAt: new Date(),
			},
		});

		// Generate accounting entry ONLY for manual (standalone) vouchers
		const isManual = !voucher.expenseId && !voucher.subcontractPaymentId;
		if (isManual) {
			try {
				const { onPaymentVoucherApproved } = await import(
					"../../../lib/accounting/auto-journal"
				);
				await onPaymentVoucherApproved(db, {
					id: voucher.id,
					organizationId: voucher.organizationId,
					voucherNo: voucher.voucherNo,
					amount: voucher.amount,
					date: voucher.date,
					payeeName: voucher.payeeName,
					payeeType: voucher.payeeType,
					sourceAccountId: voucher.sourceAccountId,
					projectId: voucher.projectId,
					userId: context.user.id,
				});
			} catch (e) {
				console.error("[AutoJournal] Failed to generate entry for payment voucher:", e);
				orgAuditLog({
					organizationId: input.organizationId,
					actorId: context.user.id,
					action: "JOURNAL_ENTRY_FAILED",
					entityType: "journal_entry",
					entityId: input.id,
					metadata: { error: String(e), referenceType: "PAYMENT_VOUCHER" },
				});
			}
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "PAYMENT_VOUCHER_APPROVED",
			entityType: "payment_voucher",
			entityId: input.id,
			metadata: {
				voucherNo: voucher.voucherNo,
				isManual,
				amount: Number(voucher.amount),
				payeeName: voucher.payeeName,
				preparedById: voucher.preparedById,
			},
		});

		return updated;
	});

// ═══════════════════════════════════════════════════════════════════════════
// REJECT PAYMENT VOUCHER (PENDING_APPROVAL → DRAFT)
// ═══════════════════════════════════════════════════════════════════════════
export const rejectPaymentVoucher = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/payment-vouchers/{id}/reject",
		tags: ["Finance", "Payment Vouchers"],
		summary: "Reject a payment voucher (returns to DRAFT)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			rejectionReason: z.string().min(1),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		const voucher = await db.paymentVoucher.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			select: { id: true, status: true, voucherNo: true },
		});

		if (!voucher) {
			throw new ORPCError("NOT_FOUND", { message: "سند الصرف غير موجود" });
		}
		if (voucher.status !== "PENDING_APPROVAL") {
			throw new ORPCError("BAD_REQUEST", {
				message: "يمكن رفض السندات المعلّقة فقط",
			});
		}

		const updated = await db.paymentVoucher.update({
			where: { id: input.id },
			data: {
				status: "DRAFT",
				approvedById: null,
				approvedAt: null,
				rejectionReason: input.rejectionReason,
			},
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "PAYMENT_VOUCHER_REJECTED",
			entityType: "payment_voucher",
			entityId: input.id,
			metadata: { voucherNo: voucher.voucherNo, rejectionReason: input.rejectionReason },
		});

		return updated;
	});

// ═══════════════════════════════════════════════════════════════════════════
// CANCEL PAYMENT VOUCHER
// ═══════════════════════════════════════════════════════════════════════════
export const cancelPaymentVoucher = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/payment-vouchers/{id}/cancel",
		tags: ["Finance", "Payment Vouchers"],
		summary: "Cancel a payment voucher",
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

		const voucher = await db.paymentVoucher.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			select: { id: true, status: true, expenseId: true, subcontractPaymentId: true, voucherNo: true },
		});

		if (!voucher) {
			throw new ORPCError("NOT_FOUND", { message: "سند الصرف غير موجود" });
		}
		if (!["DRAFT", "PENDING_APPROVAL", "ISSUED"].includes(voucher.status)) {
			throw new ORPCError("BAD_REQUEST", { message: "لا يمكن إلغاء هذا السند" });
		}

		const updated = await db.paymentVoucher.update({
			where: { id: input.id },
			data: {
				status: "CANCELLED",
				cancelledAt: new Date(),
				cancelReason: input.cancelReason,
			},
		});

		// Reverse accounting entry if voucher was ISSUED and is manual
		const isManual = !voucher.expenseId && !voucher.subcontractPaymentId;
		if (voucher.status === "ISSUED" && isManual) {
			try {
				const { reverseAutoJournalEntry } = await import(
					"../../../lib/accounting/auto-journal"
				);
				await reverseAutoJournalEntry(db, {
					organizationId: input.organizationId,
					referenceType: "PAYMENT_VOUCHER",
					referenceId: input.id,
					userId: context.user.id,
				});
			} catch (e) {
				console.error("[AutoJournal] Failed to reverse entry for cancelled payment voucher:", e);
				orgAuditLog({
					organizationId: input.organizationId,
					actorId: context.user.id,
					action: "JOURNAL_ENTRY_FAILED",
					entityType: "journal_entry",
					entityId: input.id,
					metadata: { error: String(e), referenceType: "PAYMENT_VOUCHER" },
				});
			}
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "PAYMENT_VOUCHER_CANCELLED",
			entityType: "payment_voucher",
			entityId: input.id,
			metadata: { voucherNo: voucher.voucherNo, cancelReason: input.cancelReason },
		});

		return updated;
	});

// ═══════════════════════════════════════════════════════════════════════════
// PRINT PAYMENT VOUCHER
// ═══════════════════════════════════════════════════════════════════════════
export const printPaymentVoucher = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/payment-vouchers/{id}/print",
		tags: ["Finance", "Payment Vouchers"],
		summary: "Record a print event for a payment voucher",
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

		return db.paymentVoucher.update({
			where: { id: input.id },
			data: {
				printCount: { increment: 1 },
				lastPrintedAt: new Date(),
			},
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET PAYMENT VOUCHER SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
export const getPaymentVoucherSummary = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/payment-vouchers/summary",
		tags: ["Finance", "Payment Vouchers"],
		summary: "Get payment voucher summary stats",
	})
	.input(
		z.object({
			organizationId: z.string(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
			projectId: z.string().optional(),
			payeeType: payeeTypeEnum.optional(),
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
		if (input.payeeType) where.payeeType = input.payeeType;

		const [byStatus, byPayeeType, pendingApproval] = await Promise.all([
			db.paymentVoucher.groupBy({
				by: ["status"],
				where,
				_sum: { amount: true },
				_count: { id: true },
			}),
			db.paymentVoucher.groupBy({
				by: ["payeeType"],
				where: { ...where, status: "ISSUED" },
				_sum: { amount: true },
				_count: { id: true },
			}),
			db.paymentVoucher.aggregate({
				where: { ...where, status: "PENDING_APPROVAL" },
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
			byPayeeType: byPayeeType.map((g) => ({
				type: g.payeeType,
				total: Number(g._sum?.amount ?? 0),
				count: g._count?.id ?? 0,
			})),
			pendingApproval: {
				total: Number(pendingApproval._sum?.amount ?? 0),
				count: pendingApproval._count?.id ?? 0,
			},
		};
	});
