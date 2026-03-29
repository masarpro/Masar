import { createProjectClaim, getProjectById } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import {
	notifyClaimCreated,
	getProjectAccountants,
	getProjectManagers,
} from "../../notifications/lib/notification-service";

export const createClaim = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/finance/claims",
		tags: ["Project Finance"],
		summary: "Create a new project claim",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			periodStart: z.coerce.date().optional(),
			periodEnd: z.coerce.date().optional(),
			amount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
			dueDate: z.coerce.date().optional(),
			note: z.string().optional(),
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
			const claim = await createProjectClaim({
				organizationId: input.organizationId,
				projectId: input.projectId,
				createdById: context.user.id,
				periodStart: input.periodStart,
				periodEnd: input.periodEnd,
				amount: input.amount,
				dueDate: input.dueDate,
				note: input.note,
			});

			// Notify accountants and managers about new claim (fire and forget)
			getProjectById(input.projectId, input.organizationId)
				.then(async (project) => {
					if (project) {
						const [accountantIds, managerIds] = await Promise.all([
							getProjectAccountants(input.projectId),
							getProjectManagers(input.projectId),
						]);
						const recipientIds = [...new Set([...accountantIds, ...managerIds])];

						if (recipientIds.length > 0) {
							notifyClaimCreated({
								organizationId: input.organizationId,
								projectId: input.projectId,
								projectName: project.name,
								claimId: claim.id,
								claimNo: claim.claimNo,
								amount: input.amount.toLocaleString("en-US"),
								creatorId: context.user.id,
								recipientIds,
							}).catch(() => {
								// Silently ignore notification errors
							});
						}
					}
				})
				.catch(() => {
					// Silently ignore errors
				});

			return {
				...claim,
				amount: Number(claim.amount),
			};
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "CLAIMS_EXCEED_CONTRACT_VALUE") {
					throw new ORPCError("BAD_REQUEST", {
						message: "إجمالي المستخلصات يتجاوز قيمة العقد المعدلة",
					});
				}
			}
			throw error;
		}
	});
