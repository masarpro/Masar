import { ORPCError } from "@orpc/server";
import { createDocumentFolder, db, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const createFolderProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/document-folders",
		tags: ["Project Documents"],
		summary: "Create a new dynamic document folder",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100).min(1),
			projectId: z.string().trim().max(100).min(1),
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

		// منع تكرار الاسم داخل نفس المشروع (مطابقة للقيد الفريد)
		const existing = await db.projectDocumentFolder.findFirst({
			where: {
				organizationId: input.organizationId,
				projectId: input.projectId,
				name: input.name,
			},
			select: { id: true },
		});
		if (existing) {
			throw new ORPCError("CONFLICT", {
				message: "يوجد مجلد بنفس الاسم بالفعل",
			});
		}

		const folder = await createDocumentFolder(
			input.organizationId,
			input.projectId,
			{
				name: input.name,
				color: input.color,
				createdById: context.user.id,
			},
		);

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "FOLDER_CREATED",
			entityType: "document_folder",
			entityId: folder.id,
			metadata: { name: folder.name },
		});

		return folder;
	});
