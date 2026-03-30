import { ORPCError } from "@orpc/server";
import { deleteProject, db } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";

export const deleteProjectProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/projects/{id}",
		tags: ["Projects"],
		summary: "Delete a project (only if no financial data)",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission to delete (OWNER only per permission matrix)
		await verifyProjectAccess(
			input.id,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "delete" },
		);

		// Check for financial data before allowing hard delete
		const [
			expenseCount,
			claimCount,
			subcontractCount,
			invoiceCount,
			paymentCount,
		] = await Promise.all([
			db.financeExpense.count({
				where: { organizationId: input.organizationId, projectId: input.id },
			}),
			db.projectClaim.count({
				where: { organizationId: input.organizationId, projectId: input.id },
			}),
			db.subcontractContract.count({
				where: { organizationId: input.organizationId, projectId: input.id },
			}),
			db.financeInvoice.count({
				where: { organizationId: input.organizationId, projectId: input.id },
			}),
			db.projectPayment.count({
				where: { organizationId: input.organizationId, projectId: input.id },
			}),
		]);

		const totalRecords =
			expenseCount + claimCount + subcontractCount + invoiceCount + paymentCount;

		if (totalRecords > 0) {
			throw new ORPCError("BAD_REQUEST", {
				message:
					"لا يمكن حذف مشروع يحتوي على بيانات مالية. استخدم الأرشفة بدلاً من ذلك.",
				data: {
					hasFinancialData: true,
					counts: {
						expenses: expenseCount,
						claims: claimCount,
						subcontracts: subcontractCount,
						invoices: invoiceCount,
						payments: paymentCount,
					},
				},
			});
		}

		// No financial data — safe to hard delete
		try {
			await deleteProject(input.id, input.organizationId);

			return {
				success: true,
				message: "تم حذف المشروع بنجاح",
			};
		} catch (error) {
			throw new ORPCError("BAD_REQUEST", {
				message: "فشل في حذف المشروع",
			});
		}
	});
