import { ORPCError } from "@orpc/server";
import { db, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const revertToVersionProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/documents/{documentId}/revert",
		tags: ["Project Documents"],
		summary: "Revert document to a previous version (creates a new version as a copy)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			documentId: z.string(),
			versionNumber: z.number().int().positive(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		// Get current document
		const document = await db.projectDocument.findFirst({
			where: {
				id: input.documentId,
				organizationId: input.organizationId,
				projectId: input.projectId,
			},
			select: { id: true, version: true },
		});

		if (!document) {
			throw new ORPCError("NOT_FOUND", {
				message: "الوثيقة غير موجودة",
			});
		}

		// Get the target version
		const targetVersion = await db.documentVersion.findFirst({
			where: {
				documentId: input.documentId,
				versionNumber: input.versionNumber,
			},
		});

		if (!targetVersion) {
			throw new ORPCError("NOT_FOUND", {
				message: "الإصدار المطلوب غير موجود",
			});
		}

		const newVersionNumber = document.version + 1;

		// Create a new version as a copy of the target version
		const [newVersion] = await db.$transaction([
			db.documentVersion.create({
				data: {
					documentId: input.documentId,
					versionNumber: newVersionNumber,
					fileName: targetVersion.fileName,
					fileSize: targetVersion.fileSize,
					fileType: targetVersion.fileType,
					storagePath: targetVersion.storagePath,
					uploadedBy: context.user.id,
					changeNotes: `استعادة من الإصدار ${input.versionNumber}`,
				},
			}),
			db.projectDocument.update({
				where: { id: input.documentId },
				data: {
					version: newVersionNumber,
					fileName: targetVersion.fileName,
					fileSize: targetVersion.fileSize,
					mimeType: targetVersion.fileType,
					storagePath: targetVersion.storagePath,
				},
			}),
		]);

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "DOC_CREATED",
			entityType: "document_version",
			entityId: newVersion.id,
			metadata: {
				documentId: input.documentId,
				versionNumber: newVersionNumber,
				revertedFrom: input.versionNumber,
			},
		});

		return newVersion;
	});
