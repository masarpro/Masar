import { ORPCError } from "@orpc/server";
import { globalOrganizationSearch } from "@repo/database";
import { z } from "zod";
import {
	getCachedOrganizationMembership,
	getCachedUserPermissions,
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

		const permissions = await getCachedUserPermissions(
			context.user.id,
			input.organizationId,
		);

		const sections = {
			projects: permissions?.projects?.view ?? false,
			finance: permissions?.finance?.view ?? false,
			pricing: permissions?.pricing?.view ?? false,
			company: permissions?.company?.view ?? false,
		};

		const results = await globalOrganizationSearch({
			organizationId: input.organizationId,
			query,
			sections,
		});

		return { results };
	});

export const searchRouter = {
	global,
};
