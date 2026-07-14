import { ORPCError } from "@orpc/server";
import { getProjectsForUser, globalOrganizationSearch } from "@repo/database";
import { z } from "zod";
import {
	getCachedOrganizationMembership,
	getCachedUserPermissions,
	getCachedUserProjectScope,
} from "../../lib/permissions";
import { protectedProcedure } from "../../orpc/procedures";

// ═══════════════════════════════════════════════════════════════════════════
// Global Search Router - البحث الشامل
// Cross-entity, organization-scoped search. Sections are gated by the member's
// effective permissions so results never leak data the user can't already see.
// ═══════════════════════════════════════════════════════════════════════════

const global = protectedProcedure
	.input(
		z.object({
			organizationId: z.string(),
			query: z.string().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		const membership = await getCachedOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) {
			throw new ORPCError("FORBIDDEN", { message: "Unauthorized" });
		}

		const query = input.query.trim();
		if (query.length < 2) {
			return { results: [] };
		}

		const [permissions, scope] = await Promise.all([
			getCachedUserPermissions(context.user.id, input.organizationId),
			getCachedUserProjectScope(context.user.id, input.organizationId),
		]);

		const sections = {
			projects: permissions?.projects?.view ?? false,
			finance: permissions?.finance?.view ?? false,
			pricing: permissions?.pricing?.view ?? false,
			company: permissions?.company?.view ?? false,
		};

		// Per-member project visibility: unless the member can see all projects,
		// restrict the projects section to their assigned projects — mirrors
		// projects.list so search never leaks unassigned project data. Only the
		// projects entity is project-scoped; the other sections are org-level and
		// already gated by their section permission above.
		let restrictToProjectIds: string[] | undefined;
		if (sections.projects && !scope.allProjects) {
			const assigned = await getProjectsForUser(
				context.user.id,
				input.organizationId,
			);
			restrictToProjectIds = assigned.map((p) => p.id);
		}

		const results = await globalOrganizationSearch({
			organizationId: input.organizationId,
			query,
			sections,
			restrictToProjectIds,
		});

		return { results };
	});

export const searchRouter = {
	global,
};
