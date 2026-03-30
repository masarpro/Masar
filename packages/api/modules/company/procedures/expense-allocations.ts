import {
	getExpenseAllocations,
	setExpenseAllocations,
	getProjectAllocatedExpenses,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import {
	idString,
	optionalTrimmed,
	percentage,
	MAX_DESC,
	MAX_ARRAY,
} from "../../../lib/validation-constants";

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
			organizationId: idString(),
			expenseId: idString(),
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
export const setExpenseAllocationsProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/company/expenses/{expenseId}/allocations",
		tags: ["Company", "Expense Allocations"],
		summary: "Set expense allocations to projects",
	})
	.input(
		z.object({
			organizationId: idString(),
			expenseId: idString(),
			allocations: z.array(
				z.object({
					projectId: idString(),
					percentage: percentage(),
					notes: optionalTrimmed(MAX_DESC),
				}),
			).max(MAX_ARRAY),
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
			organizationId: idString(),
			projectId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "view",
		});

		return getProjectAllocatedExpenses(input.projectId);
	});
