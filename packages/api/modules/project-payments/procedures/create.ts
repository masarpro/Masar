import { createProjectPayment, logAuditEvent } from "@repo/database";
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

		return { ...payment, amount: Number(payment.amount) };
	});
