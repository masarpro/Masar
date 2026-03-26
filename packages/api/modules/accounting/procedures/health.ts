import { checkAccountingHealth } from "@repo/database";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const checkAccountingHealthProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/health",
		tags: ["Accounting"],
		summary: "Check accounting data health and integrity",
	})
	.input(z.object({ organizationId: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return checkAccountingHealth(db, input.organizationId);
	});
