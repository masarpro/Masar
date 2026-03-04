import { deleteProjectPayment, logAuditEvent } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const deleteProjectPaymentProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/projects/{projectId}/payments/{paymentId}",
		tags: ["Project Payments"],
		summary: "Delete a project payment",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			paymentId: z.string(),
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
			await deleteProjectPayment(input.paymentId, input.organizationId);

			logAuditEvent(input.organizationId, input.projectId, {
				actorId: context.user.id,
				action: "PROJECT_PAYMENT_DELETED",
				entityType: "project_payment",
				entityId: input.paymentId,
				metadata: {},
			}).catch(() => {});

			return { success: true };
		} catch (error) {
			if (error instanceof Error && error.message === "PAYMENT_NOT_FOUND") {
				throw new ORPCError("NOT_FOUND", { message: "الدفعة غير موجودة" });
			}
			throw error;
		}
	});
