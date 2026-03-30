import { checkAccountingHealth, reconcileInvoiceJournals } from "@repo/database";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";

export const checkAccountingHealthProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/health",
		tags: ["Accounting"],
		summary: "Check accounting data health and integrity",
	})
	.input(z.object({ organizationId: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return checkAccountingHealth(db, input.organizationId);
	});

export const reconcileInvoiceJournalsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/health/reconcile-invoices",
		tags: ["Accounting"],
		summary: "Reconcile invoice totals against journal entries",
	})
	.input(z.object({ organizationId: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return reconcileInvoiceJournals(db, input.organizationId);
	});
