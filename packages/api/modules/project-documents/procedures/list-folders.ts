import { listDocumentFolders } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const listFoldersProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/document-folders",
		tags: ["Project Documents"],
		summary: "List dynamic document folders for a project",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100).min(1),
			projectId: z.string().trim().max(100).min(1),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		return listDocumentFolders(input.organizationId, input.projectId);
	});
