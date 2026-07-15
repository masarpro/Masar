import { createProjectPayment, db, isPeriodClosed } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { emitProjectPaymentCreated } from "../lib/payment-side-effects";
import { notifyEvent } from "../../notifications/lib/notify";

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

		// A project payment moves the bank and posts a PRJ-JE. Reject a
		// closed-period date so the bank can't move while the journal is silently
		// skipped (matches the guard already on the edit path).
		if (await isPeriodClosed(db, input.organizationId, input.date)) {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن تسجيل دفعة بتاريخ داخل فترة محاسبية مغلقة",
			});
		}

		let result: Awaited<ReturnType<typeof createProjectPayment>>;
		try {
			result = await createProjectPayment({
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
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.startsWith("PAYMENT_EXCEEDS_CONTRACT:")
			) {
				const [, ceiling, collected, available] = error.message.split(":");
				const fmt = (v?: string) =>
					new Intl.NumberFormat("en-US").format(Number(v ?? 0));
				throw new ORPCError("BAD_REQUEST", {
					message: `مبلغ الدفعة يتجاوز المتبقي من قيمة العقد — قيمة العقد المعدّلة: ${fmt(ceiling)} ريال، المحصّل: ${fmt(collected)} ريال، المتاح: ${fmt(available)} ريال`,
				});
			}
			throw error;
		}
		const { payments, primary, splitCount } = result;

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

		const project = await db.project.findFirst({
			where: { id: input.projectId, organizationId: input.organizationId },
			select: { name: true },
		});
		await notifyEvent({
			event: "projects.paymentReceived",
			organizationId: input.organizationId,
			actorId: context.user.id,
			projectId: input.projectId,
			entity: { type: "projectPayment", id: primary.id },
			data: {
				projectName: project?.name,
				amount: `${new Intl.NumberFormat("en-US").format(Number(input.amount))} ر.س`,
			},
		});

		return { ...primary, amount: Number(primary.amount), splitCount };
	});
