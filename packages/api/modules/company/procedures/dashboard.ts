import { getCompanyDashboardData } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getCompanyDashboard = protectedProcedure
	.route({
		method: "GET",
		path: "/company/dashboard",
		tags: ["Company", "Dashboard"],
		summary: "Get company management dashboard data",
	})
	.input(z.object({ organizationId: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "view",
		});

		return getCompanyDashboardData(input.organizationId);
	});
