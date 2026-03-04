import { updateProjectPayment, logAuditEvent } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const updateProjectPaymentProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/projects/{projectId}/payments/{paymentId}",
		tags: ["Project Payments"],
		summary: "Update a project payment",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			paymentId: z.string(),
			amount: z.number().positive("مبلغ الدفعة يجب أن يكون أكبر من صفر").optional(),
			date: z.coerce.date().optional(),
			paymentMethod: z
				.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "CREDIT_CARD", "OTHER"])
				.optional(),
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

		try {
			const payment = await updateProjectPayment(
				input.paymentId,
				input.organizationId,
				{
					amount: input.amount,
					date: input.date,
					paymentMethod: input.paymentMethod,
					referenceNo: input.referenceNo,
					description: input.description,
					destinationAccountId: input.destinationAccountId,
					note: input.note,
				},
			);

			logAuditEvent(input.organizationId, input.projectId, {
				actorId: context.user.id,
				action: "PROJECT_PAYMENT_UPDATED",
				entityType: "project_payment",
				entityId: payment.id,
				metadata: { amount: Number(payment.amount) },
			}).catch(() => {});

			return { ...payment, amount: Number(payment.amount) };
		} catch (error) {
			if (error instanceof Error && error.message === "PAYMENT_NOT_FOUND") {
				throw new ORPCError("NOT_FOUND", { message: "الدفعة غير موجودة" });
			}
			throw error;
		}
	});
