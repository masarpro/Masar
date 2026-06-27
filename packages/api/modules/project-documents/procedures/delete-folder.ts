import { ORPCError } from "@orpc/server";
import { db, deleteDocumentFolder, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const deleteFolderProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/document-folders/{folderId}/delete",
		tags: ["Project Documents"],
		summary: "Delete a dynamic document folder (documents become uncategorized)",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100).min(1),
			projectId: z.string().trim().max(100).min(1),
			folderId: z.string().trim().max(100).min(1),
			// تأكيد صريح مطلوب عند احتواء المجلد على ملفات
			confirmWithDocuments: z.boolean().optional().default(false),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		// عزل متعدد المستأجرين: تأكد أن المجلد يخص هذه المنظمة والمشروع
		const folder = await db.projectDocumentFolder.findFirst({
			where: {
				id: input.folderId,
				organizationId: input.organizationId,
				projectId: input.projectId,
			},
			include: { _count: { select: { documents: true } } },
		});
		if (!folder) {
			throw new ORPCError("NOT_FOUND", { message: "المجلد غير موجود" });
		}

		const documentCount = folder._count.documents;

		// حماية من الحذف العرضي لمجلد يحتوي ملفات
		if (documentCount > 0 && !input.confirmWithDocuments) {
			throw new ORPCError("BAD_REQUEST", {
				message: `المجلد يحتوي على ${documentCount} ملف. يلزم تأكيد الحذف.`,
				data: { requiresConfirmation: true, documentCount },
			});
		}

		// الملفات بداخله تصبح "غير مصنّفة" (folderId → null عبر onDelete: SetNull)
		await deleteDocumentFolder(input.folderId);

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "FOLDER_DELETED",
			entityType: "document_folder",
			entityId: input.folderId,
			metadata: { name: folder.name, documentCount },
		});

		return { success: true, documentCount };
	});
