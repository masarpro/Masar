import { ORPCError } from "@orpc/server";
import { deleteProjectExpense } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";

export const deleteExpense = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/projects/{projectId}/finance/expenses/{expenseId}",
		tags: ["Project Finance"],
		summary: "Delete a project expense",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			expenseId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission to manage payments
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		try {
			await deleteProjectExpense(
				input.expenseId,
				input.organizationId,
				input.projectId,
			);

			return {
				success: true,
				message: "تم حذف المصروف بنجاح",
			};
		} catch (error) {
			throw new ORPCError("NOT_FOUND", {
				message: "المصروف غير موجود",
			});
		}
	});
