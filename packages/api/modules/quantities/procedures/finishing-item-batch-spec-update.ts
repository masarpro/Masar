import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
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
			organizationId: z.string().trim().max(100),
			costStudyId: z.string().trim().max(100),
			items: z.array(
				z.object({
					id: z.string().trim().max(100),
					specData: z.record(z.string(), z.unknown()),
					qualityLevel: z.string().trim().max(100).optional(),
					brand: z.string().trim().max(100).optional(),
					specifications: z.string().trim().max(100).optional(),
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

		await batchUpdateFinishingItemSpecs(input.costStudyId, input.items);

		return { success: true, count: input.items.length };
	});
