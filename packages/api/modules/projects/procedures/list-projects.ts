import {
	getOrganizationProjects,
	getProjectStats,
	getProjectsForUser,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import {
	getCachedUserProjectScope,
	verifyOrganizationAccess,
} from "../../../lib/permissions";
import { idString, searchQuery, paginationLimit, paginationOffset } from "../../../lib/validation-constants";

export const listProjects = protectedProcedure
	.route({
		method: "GET",
		path: "/projects",
		tags: ["Projects"],
		summary: "List projects for an organization",
	})
	.input(
		z.object({
			organizationId: idString(),
			status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).optional(),
			query: searchQuery(),
			limit: paginationLimit(),
			offset: paginationOffset(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Per-member visibility: managerial roles / explicit grant see all
		// projects; everyone else is restricted to their ProjectMember
		// assignments. Filtering happens at the query level — unassigned project
		// data is never returned to the client.
		// Runs in parallel with the access check: the scope read is org+user
		// scoped and its result is only used after the check has passed.
		const [, scope] = await Promise.all([
			verifyOrganizationAccess(input.organizationId, context.user.id, {
				section: "projects",
				action: "view",
			}),
			getCachedUserProjectScope(context.user.id, input.organizationId),
		]);

		let restrictToProjectIds: string[] | undefined;
		if (!scope.allProjects) {
			const assigned = await getProjectsForUser(
				context.user.id,
				input.organizationId,
			);
			restrictToProjectIds = assigned.map((p) => p.id);
		}

		const [result, stats] = await Promise.all([
			getOrganizationProjects(input.organizationId, {
				status: input.status,
				query: input.query,
				limit: input.limit,
				offset: input.offset,
				restrictToProjectIds,
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
				coverPhoto: (project as any).coverPhoto ?? null,
			})),
			total: result.total,
			stats,
		};
	});
