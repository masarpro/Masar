import { createProjectPayment } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { emitProjectPaymentCreated } from "../lib/payment-side-effects";

export const createProjectPaymentProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/payments",
		tags: ["Project Payments"],
		summary: "Create a project payment",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			contractTermId: z.string().trim().max(100).nullish(),
			amount: z.number().positive("مبلغ الدفعة يجب أن يكون أكبر من صفر"),
			date: z.coerce.date(),
			paymentMethod: z
				.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "CREDIT_CARD", "OTHER"])
				.default("BANK_TRANSFER"),
			referenceNo: z.string().trim().max(100).nullish(),
			description: z.string().trim().max(2000).nullish(),
			destinationAccountId: z.string().trim().max(100).nullish(),
			note: z.string().trim().max(100).nullish(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		const { payments, primary, splitCount } = await createProjectPayment({
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

		// Each spillover allocation is its own payment row → log + journal +
		// receipt voucher per row, consistent with edit/delete reversal.
		await emitProjectPaymentCreated(payments, {
			organizationId: input.organizationId,
			projectId: input.projectId,
			date: input.date,
			paymentMethod: input.paymentMethod,
			destinationAccountId: input.destinationAccountId,
			description: input.description,
			userId: context.user.id,
		});

		return { ...primary, amount: Number(primary.amount), splitCount };
	});
