import { createChangeOrder, logAuditEvent, getProjectById, getProjectContract, db } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import {
	notifyChangeOrderCreated,
	getProjectManagers,
} from "../../notifications/lib/notification-service";

export const createChangeOrderProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-change-orders/create",
		tags: ["Project Change Orders"],
		summary: "Create a new change order",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			title: z.string().trim().min(1).max(200),
			description: z.string().trim().max(2000).optional(),
			category: z
				.enum([
					"SCOPE_CHANGE",
					"CLIENT_REQUEST",
					"SITE_CONDITION",
					"DESIGN_CHANGE",
					"MATERIAL_CHANGE",
					"REGULATORY",
					"OTHER",
				])
				.optional(),
			costImpact: z.number().max(999999999.99).optional(),
			currency: z.string().trim().max(100).optional(),
			timeImpactDays: z.number().int().min(-365).max(365).optional(),
			milestoneId: z.string().trim().max(100).optional(),
			claimId: z.string().trim().max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		const changeOrder = await createChangeOrder(
			input.organizationId,
			input.projectId,
			{
				title: input.title,
				description: input.description,
				category: input.category,
				costImpact: input.costImpact,
				currency: input.currency,
				timeImpactDays: input.timeImpactDays,
				milestoneId: input.milestoneId,
				claimId: input.claimId,
				requestedById: context.user.id,
			},
		);

		// Auto-link CO to project contract if exists (fire and forget)
		getProjectContract(input.organizationId, input.projectId)
			.then(async (contract) => {
				if (contract) {
					await db.projectChangeOrder.update({
						where: { id: changeOrder.id },
						data: { contractId: contract.id },
					});
				}
			})
			.catch(() => {});

		// Log audit event
		await logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "CO_CREATED",
			entityType: "change_order",
			entityId: changeOrder.id,
			metadata: {
				coNo: changeOrder.coNo,
				title: changeOrder.title,
				category: changeOrder.category,
			},
		});

		// Notify project managers (fire and forget)
		getProjectById(input.projectId, input.organizationId)
			.then(async (project) => {
				if (project) {
					const managerIds = await getProjectManagers(input.projectId);
					if (managerIds.length > 0) {
						notifyChangeOrderCreated({
							organizationId: input.organizationId,
							projectId: input.projectId,
							projectName: project.name,
							changeOrderId: changeOrder.id,
							coNo: changeOrder.coNo,
							title: changeOrder.title,
							creatorId: context.user.id,
							managerIds,
						}).catch(() => {
							// Silently ignore notification errors
						});
					}
				}
			})
			.catch(() => {
				// Silently ignore errors
			});

		return changeOrder;
	});
