import { ORPCError } from "@orpc/server";
import { setProjectCoverPhoto, unsetProjectCoverPhoto } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const setCoverPhotoProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-field/photos/cover",
		tags: ["Project Field"],
		summary: "Set a photo as the project's cover image",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			photoId: z.string().trim().max(100),
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
			const project = await setProjectCoverPhoto(input.projectId, input.photoId);
			return { success: true, coverPhotoId: project.coverPhotoId };
		} catch (error) {
			if (error instanceof Error) {
				throw new ORPCError("BAD_REQUEST", { message: error.message });
			}
			throw error;
		}
	});

export const unsetCoverPhotoProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/project-field/photos/cover",
		tags: ["Project Field"],
		summary: "Remove the project's cover image",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		const project = await unsetProjectCoverPhoto(input.projectId);
		return { success: true, coverPhotoId: project.coverPhotoId };
	});
