import { createSubcontractPayment, getSubcontractById, logAuditEvent, db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const createSubcontractPaymentProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/subcontracts/{contractId}/payments",
		tags: ["Subcontracts"],
		summary: "Create a payment for a subcontract",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			contractId: z.string(),
			termId: z.string().nullish(),
			amount: z.number().positive("مبلغ الدفعة يجب أن يكون أكبر من صفر"),
			date: z.coerce.date(),
			sourceAccountId: z.string().min(1, "يجب اختيار الحساب البنكي"),
			paymentMethod: z
				.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "CREDIT_CARD", "OTHER"])
				.nullish(),
			referenceNo: z.string().nullish(),
			description: z.string().nullish(),
			notes: z.string().nullish(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		const contract = await getSubcontractById(
			input.contractId,
			input.organizationId,
			input.projectId,
		);

		if (!contract) {
			throw new ORPCError("NOT_FOUND", {
				message: "عقد الباطن غير موجود",
			});
		}

		const payment = await createSubcontractPayment({
			organizationId: input.organizationId,
			contractId: input.contractId,
			createdById: context.user.id,
			termId: input.termId,
			amount: input.amount,
			date: input.date,
			sourceAccountId: input.sourceAccountId,
			paymentMethod: input.paymentMethod,
			referenceNo: input.referenceNo,
			description: input.description,
			notes: input.notes,
		});

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "SUBCONTRACT_PAYMENT_CREATED",
			entityType: "subcontract_payment",
			entityId: payment.id,
			metadata: {
				contractId: input.contractId,
				amount: input.amount,
				termId: input.termId,
			},
		}).catch(() => {});

		// Auto-Journal: generate accounting entry for subcontract payment
		try {
			const { onSubcontractPayment } = await import("../../../lib/accounting/auto-journal");
			const contract = await db.subcontractContract.findUnique({ where: { id: input.contractId }, select: { name: true } });
			await onSubcontractPayment(db, {
				id: payment.id,
				organizationId: input.organizationId,
				contractorName: contract?.name ?? "",
				amount: payment.amount,
				date: new Date(input.date),
				sourceAccountId: input.sourceAccountId,
				projectId: input.projectId,
				userId: context.user.id,
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to generate entry for subcontract payment:", e);
		}

		// Auto-create payment voucher for subcontract payment
		try {
			const { generateAtomicNo } = await import("@repo/database");
			const { numberToArabicWords } = await import("@repo/utils");
			const voucherNo = await generateAtomicNo(input.organizationId, "PMT");
			await db.paymentVoucher.create({
				data: {
					organizationId: input.organizationId,
					voucherNo,
					subcontractPaymentId: payment.id,
					date: new Date(input.date),
					amount: payment.amount,
					amountInWords: numberToArabicWords(Number(payment.amount)),
					payeeName: contract?.name ?? "مقاول باطن",
					payeeType: "SUBCONTRACTOR",
					paymentMethod: input.paymentMethod || "BANK_TRANSFER",
					sourceAccountId: input.sourceAccountId || null,
					projectId: input.projectId,
					subcontractContractId: input.contractId,
					status: "ISSUED",
					preparedById: context.user.id,
					approvedById: context.user.id,
					approvedAt: new Date(),
				},
			});
		} catch (e) {
			console.error("[PaymentVoucher] Failed to create auto voucher from subcontract payment:", e);
		}

		return { ...payment, amount: Number(payment.amount) };
	});
