import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { getSignedUrl } from "@repo/storage";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

const DOCUMENTS_BUCKET = process.env.S3_ATTACHMENTS_BUCKET || "attachments";

export const getVersionDownloadUrlProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/documents/{documentId}/versions/{versionId}/download",
		tags: ["Project Documents"],
		summary: "Get a signed download URL for a specific document version",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			documentId: z.string().trim().max(100),
			versionId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const version = await db.documentVersion.findFirst({
			where: {
				id: input.versionId,
				documentId: input.documentId,
				document: {
					organizationId: input.organizationId,
					projectId: input.projectId,
				},
			},
		});

		if (!version) {
			throw new ORPCError("NOT_FOUND", {
				message: "إصدار الوثيقة غير موجود",
			});
		}

		const downloadUrl = await getSignedUrl(version.storagePath, {
			bucket: DOCUMENTS_BUCKET,
			expiresIn: 3600,
		});

		return {
			downloadUrl,
			fileName: version.fileName,
			fileType: version.fileType,
			fileSize: version.fileSize,
			versionNumber: version.versionNumber,
		};
	});
