import { deleteContractPaymentTerm } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const deletePaymentTerm = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/projects/{projectId}/contract/payment-terms/{termId}",
		tags: ["Project Contract"],
		summary: "Delete a single contract payment term",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			termId: z.string().trim().max(100),
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
			await deleteContractPaymentTerm(
				input.organizationId,
				input.projectId,
				input.termId,
			);
			return { success: true };
		} catch (error) {
			if (error instanceof ORPCError) throw error;
			if (error instanceof Error && error.message === "TERM_NOT_FOUND") {
				throw new ORPCError("NOT_FOUND", {
					message: "مرحلة الدفع غير موجودة",
				});
			}
			if (error instanceof Error && error.message === "TERM_HAS_PAYMENTS") {
				throw new ORPCError("BAD_REQUEST", {
					message:
						"لا يمكن حذف مرحلة مرتبطة بدفعات مسجلة. احذف أو انقل دفعاتها أولاً.",
				});
			}
			throw error;
		}
	});
