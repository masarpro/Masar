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
			organizationId: z.string(),
			projectId: z.string(),
			folder: DocumentFolderEnum.optional(),
			search: z.string().optional(),
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
				search: input.search,
				page: input.page,
				pageSize: input.pageSize,
			},
		);

		return result;
	});
