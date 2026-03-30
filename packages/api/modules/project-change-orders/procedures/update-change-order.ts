import { ORPCError } from "@orpc/server";
import { updateChangeOrder, deleteChangeOrder } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const updateChangeOrderProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-change-orders/{changeOrderId}/update",
		tags: ["Project Change Orders"],
		summary: "Update a change order (only in DRAFT status)",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			changeOrderId: z.string().trim().max(100),
			title: z.string().trim().min(1).max(200).optional(),
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
			milestoneId: z.string().trim().max(100).nullable().optional(),
			claimId: z.string().trim().max(100).nullable().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		try {
			const changeOrder = await updateChangeOrder(
				input.organizationId,
				input.projectId,
				input.changeOrderId,
				{
					title: input.title,
					description: input.description,
					category: input.category,
					costImpact: input.costImpact,
					currency: input.currency,
					timeImpactDays: input.timeImpactDays,
					milestoneId: input.milestoneId,
					claimId: input.claimId,
				},
			);

			return changeOrder;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "Change order not found") {
					throw new ORPCError("NOT_FOUND", { message: "أمر التغيير غير موجود" });
				}
				if (error.message === "Can only edit change orders in DRAFT status") {
					throw new ORPCError("BAD_REQUEST", {
						message: "يمكن تعديل أوامر التغيير في حالة المسودة فقط",
					});
				}
			}
			throw error;
		}
	});

export const deleteChangeOrderProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-change-orders/{changeOrderId}/delete",
		tags: ["Project Change Orders"],
		summary: "Delete a change order (only in DRAFT status)",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			changeOrderId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		try {
			await deleteChangeOrder(
				input.organizationId,
				input.projectId,
				input.changeOrderId,
			);

			return { success: true };
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "Change order not found") {
					throw new ORPCError("NOT_FOUND", { message: "أمر التغيير غير موجود" });
				}
				if (error.message === "Can only delete change orders in DRAFT status") {
					throw new ORPCError("BAD_REQUEST", {
						message: "يمكن حذف أوامر التغيير في حالة المسودة فقط",
					});
				}
			}
			throw error;
		}
	});
