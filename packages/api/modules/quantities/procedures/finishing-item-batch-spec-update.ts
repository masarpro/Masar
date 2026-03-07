import { ORPCError } from "@orpc/server";
import { batchUpdateFinishingItemSpecs, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const finishingItemBatchSpecUpdate = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/{costStudyId}/finishing-items/batch-spec",
		tags: ["Quantities"],
		summary: "Batch update finishing item specs",
	})
	.input(
		z.object({
			organizationId: z.string(),
			costStudyId: z.string(),
			items: z.array(
				z.object({
					id: z.string(),
					specData: z.any(),
					qualityLevel: z.string().optional(),
					brand: z.string().optional(),
					specifications: z.string().optional(),
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
				message: "دراسة التكلفة غير موجودة",
			});
		}

		await batchUpdateFinishingItemSpecs(input.costStudyId, input.items);

		return { success: true };
	});
