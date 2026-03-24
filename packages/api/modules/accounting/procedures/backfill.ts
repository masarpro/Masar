import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { db } from "@repo/database";

export const backfillJournalEntriesProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/backfill",
		tags: ["Accounting"],
		summary: "Generate journal entries for historical financial operations",
	})
	.input(z.object({ organizationId: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "settings",
		});

		const { backfillJournalEntries } = await import("../../../lib/accounting/backfill");
		return backfillJournalEntries(db, input.organizationId);
	});
