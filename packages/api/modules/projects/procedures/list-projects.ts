import { getOrganizationProjects, getProjectStats } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const listProjects = protectedProcedure
	.route({
		method: "GET",
		path: "/projects",
		tags: ["Projects"],
		summary: "List projects for an organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
			status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED"]).optional(),
			query: z.string().optional(),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership and permission
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const [result, stats] = await Promise.all([
			getOrganizationProjects(input.organizationId, {
				status: input.status,
				query: input.query,
				limit: input.limit,
				offset: input.offset,
			}),
			getProjectStats(input.organizationId),
		]);

		// Convert Decimal to number for JSON serialization
		return {
			projects: result.projects.map((project) => ({
				...project,
				contractValue: project.contractValue
					? Number(project.contractValue)
					: null,
				progress: Number(project.progress),
				memberCount: (project as any)._count?.members ?? 0,
				photos: (project as any).photos ?? [],
			})),
			total: result.total,
			stats,
		};
	});
