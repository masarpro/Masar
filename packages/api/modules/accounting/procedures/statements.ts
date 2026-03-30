import { getClientStatement, getVendorStatement } from "@repo/database";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";

// ========== Client Statement ==========

export const getClientStatementProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/statements/client",
		tags: ["Accounting", "Statements"],
		summary: "Get client account statement",
	})
	.input(
		z.object({
			organizationId: idString(),
			clientId: idString(),
			dateFrom: z.string().datetime(),
			dateTo: z.string().datetime(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return getClientStatement(
			db,
			input.organizationId,
			input.clientId,
			new Date(input.dateFrom),
			new Date(input.dateTo),
		);
	});

// ========== Vendor Statement ==========

export const getVendorStatementProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/statements/vendor",
		tags: ["Accounting", "Statements"],
		summary: "Get vendor (subcontractor) account statement",
	})
	.input(
		z.object({
			organizationId: idString(),
			contractId: idString(),
			dateFrom: z.string().datetime(),
			dateTo: z.string().datetime(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return getVendorStatement(
			db,
			input.organizationId,
			input.contractId,
			new Date(input.dateFrom),
			new Date(input.dateTo),
		);
	});
