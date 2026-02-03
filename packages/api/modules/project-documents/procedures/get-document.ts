import { ORPCError } from "@orpc/server";
import { getDocument, getEntityAuditLogs } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const getDocumentProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/documents/{documentId}",
		tags: ["Project Documents"],
		summary: "Get a document by ID",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			documentId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const document = await getDocument(
			input.organizationId,
			input.projectId,
			input.documentId,
		);

		if (!document) {
			throw new ORPCError("NOT_FOUND", { message: "الوثيقة غير موجودة" });
		}

		// Get audit logs for this document
		const auditLogs = await getEntityAuditLogs(
			input.organizationId,
			input.projectId,
			"document",
			input.documentId,
			{ limit: 10 },
		);

		return {
			...document,
			auditLogs,
		};
	});
