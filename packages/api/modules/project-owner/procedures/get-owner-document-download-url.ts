import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { getSignedUrl } from "@repo/storage";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { rateLimitToken } from "../../../lib/rate-limit";
import { resolveOwnerContext, throwOwnerTokenError } from "../helpers";

const DOCUMENTS_BUCKET = process.env.S3_ATTACHMENTS_BUCKET || "attachments";

export const getOwnerDocumentDownloadUrlProcedure = publicProcedure
	.route({
		method: "POST",
		path: "/owner-portal/documents/{documentId}/download",
		tags: ["Owner Portal"],
		summary: "Get a signed download URL for a document (owner portal, read-only)",
	})
	.input(
		z
			.object({
				token: z.string().trim().min(1).max(200).optional(),
				sessionToken: z.string().trim().min(1).max(200).optional(),
				documentId: z.string().trim().min(1).max(100),
			})
			.refine((d) => d.token || d.sessionToken, {
				message: "token or sessionToken is required",
			}),
	)
	.handler(async ({ input }) => {
		await rateLimitToken(
			input.token || input.sessionToken!,
			"getOwnerDocumentDownloadUrl",
		);

		const result = await resolveOwnerContext(input);
		if (!result.ok) {
			throwOwnerTokenError(result.reason);
		}

		// عزل: المستند يجب أن يخص مشروع/منظمة هذا الرمز فقط
		const document = await db.projectDocument.findFirst({
			where: {
				id: input.documentId,
				organizationId: result.organizationId,
				projectId: result.projectId,
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

		if (document.uploadType === "URL" || !document.storagePath) {
			return {
				downloadUrl: document.fileUrl || "",
				fileName: document.fileName,
				mimeType: document.mimeType,
				fileSize: document.fileSize,
				isExternal: true,
			};
		}

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
