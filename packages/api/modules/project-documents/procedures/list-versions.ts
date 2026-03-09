import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const listVersionsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/documents/{documentId}/versions",
		tags: ["Project Documents"],
		summary: "List all versions of a document",
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

		// Verify document exists
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

		const versions = await db.documentVersion.findMany({
			where: { documentId: input.documentId },
			orderBy: { versionNumber: "desc" },
		});

		return { versions, currentVersion: document.version };
	});
