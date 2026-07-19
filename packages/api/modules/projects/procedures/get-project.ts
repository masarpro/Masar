import { ORPCError } from "@orpc/server";
import { getProjectById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { normalizePhotoRecord } from "../../../lib/media/photo-url";
import { idString } from "../../../lib/validation-constants";

export const getProject = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{id}",
		tags: ["Projects"],
		summary: "Get a project by ID",
	})
	.input(
		z.object({
			id: idString(),
			organizationId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission
		const { permissions } = await verifyProjectAccess(
			input.id,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		// Fetch full project details
		const project = await getProjectById(input.id, input.organizationId);

		if (!project) {
			throw new ORPCError("NOT_FOUND", {
				message: "المشروع غير موجود",
			});
		}

		// Contract value is financial data — only members with viewFinance get it
		const canViewFinance = permissions.projects?.viewFinance ?? false;

		return {
			...project,
			contractValue:
				canViewFinance && project.contractValue
					? Number(project.contractValue)
					: null,
			progress: Number(project.progress),
			coverPhoto: normalizePhotoRecord(project.coverPhoto),
		};
	});
