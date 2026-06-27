import { ORPCError } from "@orpc/server";
import { db, logAuditEvent, updateDocumentFolder } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const renameFolderProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/document-folders/{folderId}/rename",
		tags: ["Project Documents"],
		summary: "Rename a dynamic document folder",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100).min(1),
			projectId: z.string().trim().max(100).min(1),
			folderId: z.string().trim().max(100).min(1),
			name: z.string().trim().min(1, "اسم المجلد مطلوب").max(100),
			color: z.string().trim().max(30).optional(),
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
			select: { id: true, name: true },
		});
		if (!folder) {
			throw new ORPCError("NOT_FOUND", { message: "المجلد غير موجود" });
		}

		// منع تعارض الاسم مع مجلد آخر بنفس المشروع
		if (input.name !== folder.name) {
			const conflict = await db.projectDocumentFolder.findFirst({
				where: {
					organizationId: input.organizationId,
					projectId: input.projectId,
					name: input.name,
					id: { not: input.folderId },
				},
				select: { id: true },
			});
			if (conflict) {
				throw new ORPCError("CONFLICT", {
					message: "يوجد مجلد بنفس الاسم بالفعل",
				});
			}
		}

		const updated = await updateDocumentFolder(input.folderId, {
			name: input.name,
			color: input.color,
		});

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "FOLDER_RENAMED",
			entityType: "document_folder",
			entityId: input.folderId,
			metadata: { from: folder.name, to: updated.name },
		});

		return updated;
	});
