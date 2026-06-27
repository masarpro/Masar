import { listDocuments } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

const DocumentFolderEnum = z.enum([
	"CONTRACT",
	"DRAWINGS",
	"CLAIMS",
	"LETTERS",
	"PHOTOS",
	"OTHER",
]);

export const listDocumentsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/documents",
		tags: ["Project Documents"],
		summary: "List project documents",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			// legacy enum filter
			folder: DocumentFolderEnum.optional(),
			// المجلد الديناميكي الجديد
			folderId: z.string().trim().max(100).optional(),
			uncategorized: z.boolean().optional(),
			search: z.string().trim().max(100).optional(),
			page: z.number().int().positive().optional().default(1),
			pageSize: z.number().int().positive().max(100).optional().default(20),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const result = await listDocuments(
			input.organizationId,
			input.projectId,
			{
				folder: input.folder,
				folderId: input.folderId,
				uncategorized: input.uncategorized,
				search: input.search,
				page: input.page,
				pageSize: input.pageSize,
			},
		);

		return result;
	});
