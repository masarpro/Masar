import { createPhoto } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const createPhotoProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-field/photos",
		tags: ["Project Field"],
		summary: "Create a new photo entry",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			url: z.string().url("رابط الصورة غير صالح"),
			caption: z.string().optional(),
			category: z
				.enum(["PROGRESS", "ISSUE", "EQUIPMENT", "MATERIAL", "SAFETY", "OTHER"])
				.optional()
				.default("PROGRESS"),
			takenAt: z.coerce.date().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		// Create the photo
		const photo = await createPhoto({
			projectId: input.projectId,
			uploadedById: context.user.id,
			url: input.url,
			caption: input.caption,
			category: input.category,
			takenAt: input.takenAt,
		});

		return photo;
	});
