import { ORPCError } from "@orpc/server";
import { updatePhoto } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const updatePhotoProcedure = subscriptionProcedure
	.route({
		method: "PATCH",
		path: "/project-field/photos/{photoId}",
		tags: ["Project Field"],
		summary: "Update photo metadata (caption, category, milestone)",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			photoId: z.string().trim().max(100),
			caption: z
				.string()
				.trim()
				.max(200)
				.optional()
				.transform((v) => (v === undefined ? undefined : v === "" ? null : v)),
			category: z
				.enum(["PROGRESS", "ISSUE", "EQUIPMENT", "MATERIAL", "SAFETY", "OTHER"])
				.optional(),
			// "none" => detach from current milestone; undefined => no change; id => attach
			milestoneId: z
				.union([z.literal("none"), z.string().trim().max(100)])
				.optional(),
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
			const photo = await updatePhoto(input.photoId, input.projectId, {
				caption: input.caption,
				category: input.category,
				milestoneId: milestoneValue,
			});
			return photo;
		} catch (error) {
			if (error instanceof Error) {
				throw new ORPCError("BAD_REQUEST", { message: error.message });
			}
			throw error;
		}
	});
