import { ORPCError } from "@orpc/server";
import { db, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const uploadVersionProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/documents/{documentId}/versions",
		tags: ["Project Documents"],
		summary: "Upload a new version of a document",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			documentId: z.string(),
			fileName: z.string(),
			fileSize: z.number().int(),
			fileType: z.string(),
			storagePath: z.string(),
			changeNotes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		// Get the document and verify it exists
		const document = await db.projectDocument.findFirst({
			where: {
				id: input.documentId,
				organizationId: input.organizationId,
				projectId: input.projectId,
			},
			select: { id: true, version: true, uploadType: true },
		});

		if (!document) {
			throw new ORPCError("NOT_FOUND", {
				message: "الوثيقة غير موجودة",
			});
		}

		if (document.uploadType === "URL") {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن إضافة إصدار لوثيقة من نوع رابط",
			});
		}

		const newVersionNumber = document.version + 1;

		// Create the version record and update the document in a transaction
		const [version] = await db.$transaction([
			db.documentVersion.create({
				data: {
					documentId: input.documentId,
					versionNumber: newVersionNumber,
					fileName: input.fileName,
					fileSize: input.fileSize,
					fileType: input.fileType,
					storagePath: input.storagePath,
					uploadedBy: context.user.id,
					changeNotes: input.changeNotes,
				},
			}),
			db.projectDocument.update({
				where: { id: input.documentId },
				data: {
					version: newVersionNumber,
					fileName: input.fileName,
					fileSize: input.fileSize,
					mimeType: input.fileType,
					storagePath: input.storagePath,
				},
			}),
		]);

		// Log audit event
		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "DOC_CREATED",
			entityType: "document_version",
			entityId: version.id,
			metadata: {
				documentId: input.documentId,
				versionNumber: newVersionNumber,
				changeNotes: input.changeNotes,
			},
		});

		return version;
	});
