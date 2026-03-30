import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { getSignedUploadUrl } from "@repo/storage";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../../lib/permissions";
import { subscriptionProcedure } from "../../../../../orpc/procedures";

const ATTACHMENTS_BUCKET = process.env.S3_ATTACHMENTS_BUCKET || "attachments";
const MAX_FILE_SIZE = 52428800; // 50MB

export const getUploadUrl = subscriptionProcedure
	.route({
		method: "POST",
		path: "/pricing/leads/{leadId}/files/upload-url",
		tags: ["Leads"],
		summary: "Get a signed upload URL for a lead file",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			leadId: z.string().trim().max(100),
			fileName: z.string().trim().min(1).max(255),
			mimeType: z.string().trim().min(1).max(200),
			fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "leads" },
		);

		const lead = await db.lead.findFirst({
			where: { id: input.leadId, organizationId: input.organizationId },
		});
		if (!lead) {
			throw new ORPCError("NOT_FOUND", {
				message: "العميل المحتمل غير موجود",
			});
		}

		const ext = input.fileName.split(".").pop() || "";
		const uniqueId = crypto.randomUUID();
		const storagePath = `leads/${input.organizationId}/${input.leadId}/${uniqueId}.${ext}`;

		const uploadUrl = await getSignedUploadUrl(storagePath, {
			bucket: ATTACHMENTS_BUCKET,
			contentType: input.mimeType,
		});

		return {
			uploadUrl,
			storagePath,
			expiresIn: 60,
		};
	});
