import { ORPCError } from "@orpc/server";
import { createDocument, getProjectById, logAuditEvent, db } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { notifyEvent } from "../../notifications/lib/notify";

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
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			// legacy: نظام المجلدات الثابت — اختياري الآن
			folder: DocumentFolderEnum.optional(),
			// المجلد الديناميكي الجديد — null/غياب = غير مصنّف
			folderId: z.string().trim().max(100).optional(),
			title: z.string().trim().min(1, "العنوان مطلوب").max(200),
			description: z.string().trim().max(2000).optional(),
			uploadType: z.enum(["FILE", "URL"]).default("FILE"),
			fileUrl: z.string().url().optional(),
			fileName: z.string().trim().max(100).optional(),
			fileSize: z.number().int().optional(),
			mimeType: z.string().trim().max(100).optional(),
			storagePath: z.string().trim().max(100).optional(),
			thumbnailPath: z.string().trim().max(100).optional(),
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

		// عزل متعدد المستأجرين: تأكد أن المجلد (إن وُجد) يخص هذه المنظمة والمشروع
		if (input.folderId) {
			const folder = await db.projectDocumentFolder.findFirst({
				where: {
					id: input.folderId,
					organizationId: input.organizationId,
					projectId: input.projectId,
				},
				select: { id: true },
			});
			if (!folder) {
				throw new ORPCError("NOT_FOUND", { message: "المجلد غير موجود" });
			}
		}

		// Create document + initial version record atomically. The first version
		// row must not be fire-and-forget: a failed create previously left the
		// document with no version history and swallowed the error.
		const document = await db.$transaction(async (tx) => {
			const created = await createDocument(
				input.organizationId,
				input.projectId,
				{
					folder: input.folder,
					folderId: input.folderId,
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
				tx,
			);

			// Create initial version record for FILE uploads
			if (input.uploadType === "FILE" && input.storagePath && input.fileName) {
				await tx.documentVersion.create({
					data: {
						documentId: created.id,
						versionNumber: 1,
						fileName: input.fileName,
						fileSize: input.fileSize ?? 0,
						fileType: input.mimeType ?? "",
						storagePath: input.storagePath,
						uploadedBy: context.user.id,
						changeNotes: null,
					},
				});
			}

			return created;
		});

		// Log audit event
		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "DOC_CREATED",
			entityType: "document",
			entityId: document.id,
			metadata: { title: document.title, folder: document.folder },
		});

		// إشعار مديري ومهندسي المشروع + مسؤولي المنظمة
		const project = await getProjectById(input.projectId, input.organizationId);
		await notifyEvent({
			event: "documents.documentUploaded",
			organizationId: input.organizationId,
			actorId: context.user.id,
			projectId: input.projectId,
			entity: { type: "document", id: document.id },
			data: {
				projectName: project?.name,
				documentTitle: document.title,
			},
		});

		return document;
	});
