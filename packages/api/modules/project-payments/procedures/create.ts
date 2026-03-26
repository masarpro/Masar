import { createProjectPayment, logAuditEvent, db } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const createProjectPaymentProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/payments",
		tags: ["Project Payments"],
		summary: "Create a project payment",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			contractTermId: z.string().nullish(),
			amount: z.number().positive("مبلغ الدفعة يجب أن يكون أكبر من صفر"),
			date: z.coerce.date(),
			paymentMethod: z
				.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "CREDIT_CARD", "OTHER"])
				.default("BANK_TRANSFER"),
			referenceNo: z.string().nullish(),
			description: z.string().nullish(),
			destinationAccountId: z.string().nullish(),
			note: z.string().nullish(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		const payment = await createProjectPayment({
			organizationId: input.organizationId,
			projectId: input.projectId,
			createdById: context.user.id,
			contractTermId: input.contractTermId,
			amount: input.amount,
			date: input.date,
			paymentMethod: input.paymentMethod,
			referenceNo: input.referenceNo,
			description: input.description,
			destinationAccountId: input.destinationAccountId,
			note: input.note,
		});

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "PROJECT_PAYMENT_CREATED",
			entityType: "project_payment",
			entityId: payment.id,
			metadata: {
				amount: input.amount,
				contractTermId: input.contractTermId,
				paymentNo: payment.paymentNo,
			},
		}).catch(() => {});

		// Auto-Journal: generate accounting entry for project payment
		try {
			const { onProjectPaymentReceived } = await import("../../../lib/accounting/auto-journal");
			await onProjectPaymentReceived(db, {
				id: payment.id,
				organizationId: input.organizationId,
				amount: payment.amount,
				date: input.date,
				destinationAccountId: input.destinationAccountId ?? "",
				projectId: input.projectId,
				paymentNo: payment.paymentNo,
				userId: context.user.id,
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to create ProjectPayment entry:", e);
		}

		// Auto-create receipt voucher from project payment
		try {
			const { generateAtomicNo } = await import("@repo/database");
			const { numberToArabicWords } = await import("@repo/utils");
			const voucherNo = await generateAtomicNo(input.organizationId, "RCV");
			await db.receiptVoucher.create({
				data: {
					organizationId: input.organizationId,
					voucherNo,
					projectPaymentId: payment.id,
					date: input.date,
					amount: payment.amount,
					amountInWords: numberToArabicWords(Number(payment.amount)),
					receivedFrom: input.description || `دفعة مشروع ${payment.paymentNo}`,
					paymentMethod: input.paymentMethod || "BANK_TRANSFER",
					destinationAccountId: input.destinationAccountId || null,
					projectId: input.projectId,
					status: "ISSUED",
					createdById: context.user.id,
				},
			});
		} catch (e) {
			console.error("[ReceiptVoucher] Failed to create auto voucher from project payment:", e);
		}

		return { ...payment, amount: Number(payment.amount) };
	});
