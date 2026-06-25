import { ORPCError } from "@orpc/server";
import { bulkUpdatePhotos } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const bulkUpdatePhotosProcedure = subscriptionProcedure
	.route({
		method: "PATCH",
		path: "/project-field/photos/bulk",
		tags: ["Project Field"],
		summary: "Bulk update photo metadata (category, milestone, date)",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			photoIds: z.array(z.string().trim().max(100)).min(1).max(500),
			category: z
				.enum(["PROGRESS", "ISSUE", "EQUIPMENT", "MATERIAL", "SAFETY", "OTHER"])
				.optional(),
			// "none" => detach from current milestone; undefined => no change; id => attach
			milestoneId: z
				.union([z.literal("none"), z.string().trim().max(100)])
				.optional(),
			takenAt: z.coerce.date().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		const milestoneValue =
			input.milestoneId === undefined
				? undefined
				: input.milestoneId === "none"
					? null
					: input.milestoneId;

		try {
			const result = await bulkUpdatePhotos(input.photoIds, input.projectId, {
				category: input.category,
				milestoneId: milestoneValue,
				takenAt: input.takenAt,
			});
			return { success: true, count: result.count };
		} catch (error) {
			if (error instanceof Error) {
				throw new ORPCError("BAD_REQUEST", { message: error.message });
			}
			throw error;
		}
	});
