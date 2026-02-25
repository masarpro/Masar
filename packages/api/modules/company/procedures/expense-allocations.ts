import {
	getExpenseAllocations,
	setExpenseAllocations,
	getProjectAllocatedExpenses,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

// ═══════════════════════════════════════════════════════════════════════════
// LIST EXPENSE ALLOCATIONS
// ═══════════════════════════════════════════════════════════════════════════
export const listExpenseAllocations = protectedProcedure
	.route({
		method: "GET",
		path: "/company/expenses/{expenseId}/allocations",
		tags: ["Company", "Expense Allocations"],
		summary: "List allocations for an expense",
	})
	.input(
		z.object({
			organizationId: z.string(),
			expenseId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "view",
		});

		return getExpenseAllocations(input.expenseId);
	});

// ═══════════════════════════════════════════════════════════════════════════
// SET EXPENSE ALLOCATIONS (replace all)
// ═══════════════════════════════════════════════════════════════════════════
export const setExpenseAllocationsProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/company/expenses/{expenseId}/allocations",
		tags: ["Company", "Expense Allocations"],
		summary: "Set expense allocations to projects",
	})
	.input(
		z.object({
			organizationId: z.string(),
			expenseId: z.string(),
			allocations: z.array(
				z.object({
					projectId: z.string(),
					percentage: z.number().min(0).max(100),
					notes: z.string().optional(),
				}),
			),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		return setExpenseAllocations(input.expenseId, input.allocations);
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET PROJECT ALLOCATED EXPENSES
// ═══════════════════════════════════════════════════════════════════════════
export const getProjectAllocatedExpensesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/company/projects/{projectId}/allocated-expenses",
		tags: ["Company", "Expense Allocations"],
		summary: "Get expenses allocated to a project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "view",
		});

		return getProjectAllocatedExpenses(input.projectId);
	});
