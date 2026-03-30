import { ORPCError } from "@orpc/server";
import { db, logAuditEvent } from "@repo/database";
import { deleteFile } from "@repo/storage";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

const DOCUMENTS_BUCKET = process.env.S3_ATTACHMENTS_BUCKET || "attachments";

export const deleteDocumentProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/documents/{documentId}/delete",
		tags: ["Project Documents"],
		summary: "Delete a document and its files from storage",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100).min(1),
			projectId: z.string().trim().max(100).min(1),
			documentId: z.string().trim().max(100).min(1),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		const document = await db.projectDocument.findFirst({
			where: {
				id: input.documentId,
				organizationId: input.organizationId,
				projectId: input.projectId,
			},
		});

		if (!document) {
			throw new ORPCError("NOT_FOUND", { message: "الوثيقة غير موجودة" });
		}

		// Delete files from storage if they exist
		if (document.storagePath) {
			try {
				await deleteFile(document.storagePath, { bucket: DOCUMENTS_BUCKET });
			} catch {
				// Continue even if storage delete fails
			}
		}

		if (document.thumbnailPath) {
			try {
				await deleteFile(document.thumbnailPath, { bucket: DOCUMENTS_BUCKET });
			} catch {
				// Continue even if thumbnail delete fails
			}
		}

		// Delete from database (cascades to approvals)
		await db.projectDocument.delete({
			where: { id: input.documentId },
		});

		// Audit log
		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "DOC_DELETED",
			entityType: "document",
			entityId: input.documentId,
			metadata: { title: document.title, folder: document.folder },
		});

		return { success: true };
	});
