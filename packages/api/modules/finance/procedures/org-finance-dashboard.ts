import { getOrgFinanceDashboard } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

// ═══════════════════════════════════════════════════════════════════════════
// GET ORGANIZATION FINANCE DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export const getOrgFinanceDashboardProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/org-dashboard",
		tags: ["Finance", "Dashboard"],
		summary: "Get organization finance dashboard summary",
	})
	.input(
		z.object({
			organizationId: z.string(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return getOrgFinanceDashboard(input.organizationId, {
			dateFrom: input.dateFrom,
			dateTo: input.dateTo,
		});
	});
