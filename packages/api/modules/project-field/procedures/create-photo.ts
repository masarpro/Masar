import { ORPCError } from "@orpc/server";
import { createPhoto, getProjectById } from "@repo/database";
import { hasPermission } from "@repo/database/prisma/permissions";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { notifyEvent } from "../../notifications/lib/notify";

export const createPhotoProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-field/photos",
		tags: ["Project Field"],
		summary: "Create a new photo entry",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			url: z.string().trim().url("رابط الوسيط غير صالح").max(2048),
			caption: z.string().trim().max(200).optional(),
			category: z
				.enum(["PROGRESS", "ISSUE", "EQUIPMENT", "MATERIAL", "SAFETY", "OTHER"])
				.optional()
				.default("PROGRESS"),
			mediaType: z.enum(["PHOTO", "VIDEO"]).optional().default("PHOTO"),
			mimeType: z.string().trim().max(200).optional(),
			milestoneId: z.string().trim().max(100).optional(),
			takenAt: z.coerce.date().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Upload rate limit (10/min)
		const { rateLimitChecker, RATE_LIMITS } = await import("../../../lib/rate-limit");
		await rateLimitChecker(context.user.id, "project-field.createPhoto", RATE_LIMITS.UPLOAD);

		// Verify membership + project access, then allow either projects.edit OR
		// reports.create — field supervisors attach photos to their daily
		// reports without having projects.edit.
		const { permissions } = await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
		);
		if (
			!hasPermission(permissions, "projects", "edit") &&
			!hasPermission(permissions, "reports", "create")
		) {
			throw new ORPCError("FORBIDDEN", {
				message: "ليس لديك صلاحية رفع صور المشروع",
			});
		}

		// Create the photo / video
		const photo = await createPhoto({
			projectId: input.projectId,
			uploadedById: context.user.id,
			url: input.url,
			caption: input.caption,
			category: input.category,
			mediaType: input.mediaType,
			mimeType: input.mimeType,
			milestoneId: input.milestoneId,
			takenAt: input.takenAt,
		});

		// إشعار مديري المشروع + مسؤولي المنظمة (dedupe لكل دقيقة يمنع الضجيج عند الرفع المتعدد)
		const project = await getProjectById(input.projectId, input.organizationId);
		await notifyEvent({
			event: "projects.photoUploaded",
			organizationId: input.organizationId,
			actorId: context.user.id,
			projectId: input.projectId,
			entity: { type: "photo", id: photo.id },
			data: {
				projectName: project?.name,
			},
		});

		return photo;
	});
