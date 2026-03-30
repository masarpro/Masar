import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { reorderFinishingItems, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const finishingItemReorder = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/{costStudyId}/finishing-items/reorder",
		tags: ["Quantities"],
		summary: "Reorder finishing items",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			costStudyId: z.string().trim().max(100),
			items: z.array(
				z.object({
					id: z.string().trim().max(100),
					sortOrder: z.number().nonnegative(),
				}),
			),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		const study = await getCostStudyById(input.costStudyId, input.organizationId);
		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}

		await reorderFinishingItems(input.costStudyId, input.items);

		return { success: true, count: input.items.length };
	});
