import { getPricingDashboardStats } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const getPricingDashboard = protectedProcedure
	.route({
		method: "GET",
		path: "/pricing/dashboard",
		tags: ["Pricing", "Dashboard"],
		summary: "Get pricing dashboard stats",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "pricing",
			action: "view",
		});

		const stats = await getPricingDashboardStats(input.organizationId);

		return stats;
	});
