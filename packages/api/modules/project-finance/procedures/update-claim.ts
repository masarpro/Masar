import { ORPCError } from "@orpc/server";
import { updateProjectClaim, getContractSummary, db } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const updateClaim = subscriptionProcedure
	.route({
		method: "PATCH",
		path: "/projects/{projectId}/finance/claims/{claimId}",
		tags: ["Project Finance"],
		summary: "Update a project claim",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			claimId: z.string(),
			periodStart: z.coerce.date().nullable().optional(),
			periodEnd: z.coerce.date().nullable().optional(),
			amount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر").optional(),
			dueDate: z.coerce.date().nullable().optional(),
			note: z.string().nullable().optional(),
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

		// Validate updated claim amount doesn't exceed contract value
		if (input.amount !== undefined) {
			const contractSummary = await getContractSummary(input.organizationId, input.projectId);
			if (contractSummary.adjustedValue > 0) {
				const existingClaims = await db.projectClaim.aggregate({
					where: {
						projectId: input.projectId,
						organizationId: input.organizationId,
						status: { not: "REJECTED" },
						id: { not: input.claimId },
					},
					_sum: { amount: true },
				});
				const existingTotal = Number(existingClaims._sum.amount ?? 0);
				if (existingTotal + input.amount > contractSummary.adjustedValue) {
					throw new ORPCError("BAD_REQUEST", {
						message: "إجمالي المستخلصات يتجاوز قيمة العقد المعدلة",
					});
				}
			}
		}

		try {
			const claim = await updateProjectClaim(
				input.claimId,
				input.organizationId,
				input.projectId,
				{
					periodStart: input.periodStart,
					periodEnd: input.periodEnd,
					amount: input.amount,
					dueDate: input.dueDate,
					note: input.note,
				},
			);

			return {
				...claim,
				amount: Number(claim.amount),
			};
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "المستخلص غير موجود") {
					throw new ORPCError("NOT_FOUND", {
						message: error.message,
					});
				}
				if (error.message === "لا يمكن تعديل المستخلص إلا في حالة المسودة") {
					throw new ORPCError("BAD_REQUEST", {
						message: error.message,
					});
				}
			}
			throw new ORPCError("NOT_FOUND", {
				message: "المستخلص غير موجود",
			});
		}
	});
