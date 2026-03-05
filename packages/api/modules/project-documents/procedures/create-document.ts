import { createDocument, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

const DocumentFolderEnum = z.enum([
	"CONTRACT",
	"DRAWINGS",
	"CLAIMS",
	"LETTERS",
	"PHOTOS",
	"OTHER",
]);

export const createDocumentProcedure = subscriptionProcedure
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
			uploadType: z.enum(["FILE", "URL"]).default("FILE"),
			fileUrl: z.string().url().optional(),
			fileName: z.string().optional(),
			fileSize: z.number().int().optional(),
			mimeType: z.string().optional(),
			storagePath: z.string().optional(),
			thumbnailPath: z.string().optional(),
		}).refine(
			(data) => {
				if (data.uploadType === "URL") return !!data.fileUrl;
				if (data.uploadType === "FILE") return !!data.storagePath;
				return false;
			},
			{ message: "يجب رفع ملف" },
		),
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
				fileUrl: input.fileUrl || null,
				uploadType: input.uploadType,
				fileName: input.fileName,
				fileSize: input.fileSize,
				mimeType: input.mimeType,
				storagePath: input.storagePath,
				thumbnailPath: input.thumbnailPath,
				createdById: context.user.id,
			},
		);

		// Log audit event
		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "DOC_CREATED",
			entityType: "document",
			entityId: document.id,
			metadata: { title: document.title, folder: document.folder },
		});

		return document;
	});
