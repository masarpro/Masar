import {
	getPayrollRuns,
	getPayrollRunById,
	createPayrollRun,
	populatePayrollRun,
	approvePayrollRun,
	cancelPayrollRun,
	getPayrollSummary,
	updatePayrollRunItem,
	deletePayrollRunItem,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

const payrollRunStatusEnum = z.enum([
	"DRAFT",
	"APPROVED",
	"PAID",
	"CANCELLED",
]);

// ═══════════════════════════════════════════════════════════════════════════
// LIST PAYROLL RUNS
// ═══════════════════════════════════════════════════════════════════════════
export const listPayrollRuns = protectedProcedure
	.route({
		method: "GET",
		path: "/company/payroll",
		tags: ["Company", "Payroll"],
		summary: "List payroll runs for an organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
			status: payrollRunStatusEnum.optional(),
			year: z.number().optional(),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "view",
		});

		return getPayrollRuns(input.organizationId, {
			status: input.status,
			year: input.year,
			limit: input.limit,
			offset: input.offset,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET PAYROLL RUN BY ID
// ═══════════════════════════════════════════════════════════════════════════
export const getPayrollRun = protectedProcedure
	.route({
		method: "GET",
		path: "/company/payroll/{id}",
		tags: ["Company", "Payroll"],
		summary: "Get a single payroll run with items",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "view",
		});

		const run = await getPayrollRunById(input.id, input.organizationId);
		if (!run) {
			throw new Error("Payroll run not found");
		}
		return run;
	});

// ═══════════════════════════════════════════════════════════════════════════
// CREATE PAYROLL RUN
// ═══════════════════════════════════════════════════════════════════════════
export const createPayrollRunProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/company/payroll",
		tags: ["Company", "Payroll"],
		summary: "Create a new payroll run",
	})
	.input(
		z.object({
			organizationId: z.string(),
			month: z.number().min(1).max(12),
			year: z.number().min(2020).max(2100),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		try {
			return await createPayrollRun({
				organizationId: input.organizationId,
				createdById: context.user.id,
				month: input.month,
				year: input.year,
				notes: input.notes,
			});
		} catch (err: any) {
			// Unique constraint violation (duplicate month/year)
			if (err?.code === "P2002") {
				throw new Error(`دورة رواتب لشهر ${input.month}/${input.year} موجودة بالفعل`);
			}
			throw err;
		}
	});

// ═══════════════════════════════════════════════════════════════════════════
// POPULATE PAYROLL RUN
// ═══════════════════════════════════════════════════════════════════════════
export const populatePayrollRunProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/company/payroll/{id}/populate",
		tags: ["Company", "Payroll"],
		summary: "Populate payroll run with active employees",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		return populatePayrollRun(input.id, input.organizationId);
	});

// ═══════════════════════════════════════════════════════════════════════════
// APPROVE PAYROLL RUN
// ═══════════════════════════════════════════════════════════════════════════
export const approvePayrollRunProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/company/payroll/{id}/approve",
		tags: ["Company", "Payroll"],
		summary: "Approve a payroll run and create finance expenses",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		return approvePayrollRun(input.id, {
			organizationId: input.organizationId,
			approvedById: context.user.id,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// CANCEL PAYROLL RUN
// ═══════════════════════════════════════════════════════════════════════════
export const cancelPayrollRunProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/company/payroll/{id}/cancel",
		tags: ["Company", "Payroll"],
		summary: "Cancel a payroll run and linked expenses",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		return cancelPayrollRun(input.id, input.organizationId);
	});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE PAYROLL RUN ITEM
// ═══════════════════════════════════════════════════════════════════════════
export const updatePayrollRunItemProcedure = protectedProcedure
	.route({
		method: "PATCH",
		path: "/company/payroll/items/{itemId}",
		tags: ["Company", "Payroll"],
		summary: "Update a payroll run item (DRAFT only)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			itemId: z.string(),
			baseSalary: z.number().min(0).optional(),
			housingAllowance: z.number().min(0).optional(),
			transportAllowance: z.number().min(0).optional(),
			otherAllowances: z.number().min(0).optional(),
			gosiDeduction: z.number().min(0).optional(),
			otherDeductions: z.number().min(0).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		return updatePayrollRunItem(input.itemId, input.organizationId, {
			baseSalary: input.baseSalary,
			housingAllowance: input.housingAllowance,
			transportAllowance: input.transportAllowance,
			otherAllowances: input.otherAllowances,
			gosiDeduction: input.gosiDeduction,
			otherDeductions: input.otherDeductions,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE PAYROLL RUN ITEM
// ═══════════════════════════════════════════════════════════════════════════
export const deletePayrollRunItemProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/company/payroll/items/{itemId}",
		tags: ["Company", "Payroll"],
		summary: "Delete a payroll run item (DRAFT only)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			itemId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		return deletePayrollRunItem(input.itemId, input.organizationId);
	});

// ═══════════════════════════════════════════════════════════════════════════
// PAYROLL SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
export const payrollSummaryProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/company/payroll/summary",
		tags: ["Company", "Payroll"],
		summary: "Get payroll summary (current month status)",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "view",
		});

		return getPayrollSummary(input.organizationId);
	});
