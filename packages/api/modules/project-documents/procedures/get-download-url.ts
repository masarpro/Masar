import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { getSignedUrl } from "@repo/storage";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

const DOCUMENTS_BUCKET = process.env.S3_ATTACHMENTS_BUCKET || "attachments";

export const getDownloadUrlProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/documents/{documentId}/download",
		tags: ["Project Documents"],
		summary: "Get a signed download URL for a document file",
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
			{ section: "projects", action: "view" },
		);

		const document = await db.projectDocument.findFirst({
			where: {
				id: input.documentId,
				organizationId: input.organizationId,
				projectId: input.projectId,
			},
			select: {
				storagePath: true,
				fileName: true,
				mimeType: true,
				fileSize: true,
				uploadType: true,
				fileUrl: true,
			},
		});

		if (!document) {
			throw new ORPCError("NOT_FOUND", { message: "الوثيقة غير موجودة" });
		}

		// If it's a URL-type document, return the URL directly
		if (document.uploadType === "URL" || !document.storagePath) {
			return {
				downloadUrl: document.fileUrl || "",
				fileName: document.fileName,
				mimeType: document.mimeType,
				fileSize: document.fileSize,
				isExternal: true,
			};
		}

		// Get signed download URL (1 hour)
		const downloadUrl = await getSignedUrl(document.storagePath, {
			bucket: DOCUMENTS_BUCKET,
			expiresIn: 3600,
		});

		return {
			downloadUrl,
			fileName: document.fileName,
			mimeType: document.mimeType,
			fileSize: document.fileSize,
			isExternal: false,
		};
	});
