// Account Statements — كشوفات الحساب (journal-based)
// accountLedger by code, subcontract statement, project statement

import {
	db,
	getAccountLedgerByCode,
	getSubcontractStatementData,
	getProjectStatementData,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

// ═══════════════════════════════════════════════════════════════════════════
// Account Ledger by Code
// ═══════════════════════════════════════════════════════════════════════════
export const getAccountLedgerByCodeProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/statements/account-ledger",
		tags: ["Accounting", "Statements"],
		summary: "Get account ledger by account code with optional project filter",
	})
	.input(
		z.object({
			organizationId: z.string(),
			accountCode: z.string(),
			dateFrom: z.string().datetime().optional(),
			dateTo: z.string().datetime().optional(),
			projectId: z.string().optional(),
			page: z.number().min(1).optional().default(1),
			pageSize: z.number().min(10).max(200).optional().default(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return getAccountLedgerByCode(db, input.organizationId, input.accountCode, {
			dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
			dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
			projectId: input.projectId,
			page: input.page,
			pageSize: input.pageSize,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// Subcontract Statement
// ═══════════════════════════════════════════════════════════════════════════
export const getSubcontractStatementProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/statements/subcontract",
		tags: ["Accounting", "Statements"],
		summary: "Get subcontract statement with contract summary",
	})
	.input(
		z.object({
			organizationId: z.string(),
			contractId: z.string(),
			dateFrom: z.string().datetime(),
			dateTo: z.string().datetime(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return getSubcontractStatementData(
			db,
			input.organizationId,
			input.contractId,
			new Date(input.dateFrom),
			new Date(input.dateTo),
		);
	});

// ═══════════════════════════════════════════════════════════════════════════
// Project Statement
// ═══════════════════════════════════════════════════════════════════════════
export const getProjectStatementProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/statements/project",
		tags: ["Accounting", "Statements"],
		summary: "Get project financial statement with revenue, costs, profitability",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			dateFrom: z.string().datetime().optional(),
			dateTo: z.string().datetime().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return getProjectStatementData(db, input.organizationId, input.projectId, {
			dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
			dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
		});
	});
