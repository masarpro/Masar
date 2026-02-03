import { createDocument, createNotifications, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

const DocumentFolderEnum = z.enum([
	"CONTRACT",
	"DRAWINGS",
	"CLAIMS",
	"LETTERS",
	"PHOTOS",
	"OTHER",
]);

export const createDocumentProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/documents",
		tags: ["Project Documents"],
		summary: "Create a new document",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			folder: DocumentFolderEnum,
			title: z.string().min(1, "العنوان مطلوب"),
			description: z.string().optional(),
			fileUrl: z.string().url("رابط الملف غير صحيح"),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		// Create document
		const document = await createDocument(
			input.organizationId,
			input.projectId,
			{
				folder: input.folder,
				title: input.title,
				description: input.description,
				fileUrl: input.fileUrl,
				createdById: context.user.id,
			},
		);

		// Log audit event
		await logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "DOC_CREATED",
			entityType: "document",
			entityId: document.id,
			metadata: { title: document.title, folder: document.folder },
		});

		return document;
	});
