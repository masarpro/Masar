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
	db,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";

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
export const createPayrollRunProcedure = subscriptionProcedure
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
export const populatePayrollRunProcedure = subscriptionProcedure
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
export const approvePayrollRunProcedure = subscriptionProcedure
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

		const payrollRun = await approvePayrollRun(input.id, {
			organizationId: input.organizationId,
			approvedById: context.user.id,
		});

		// Auto-Journal: generate accounting entry for payroll approval
		try {
			const { onPayrollApproved } = await import("../../../lib/accounting/auto-journal");
			const { Prisma } = await import("@repo/database/prisma/generated/client");
			// Calculate actual GOSI from payroll items
			const gosiAgg = await db.payrollRunItem.aggregate({
				where: { payrollRunId: input.id },
				_sum: { gosiDeduction: true },
			});
			await onPayrollApproved(db, {
				id: input.id,
				organizationId: input.organizationId,
				month: (payrollRun as any).month ?? new Date().getMonth() + 1,
				year: (payrollRun as any).year ?? new Date().getFullYear(),
				totalNet: new Prisma.Decimal(Number((payrollRun as any).totalNetSalary ?? 0)),
				totalGosi: new Prisma.Decimal(Number(gosiAgg._sum?.gosiDeduction ?? 0)),
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to generate entry for payroll:", e);
		}

		return payrollRun;
	});

// ═══════════════════════════════════════════════════════════════════════════
// CANCEL PAYROLL RUN
// ═══════════════════════════════════════════════════════════════════════════
export const cancelPayrollRunProcedure = subscriptionProcedure
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

		const result = await cancelPayrollRun(input.id, input.organizationId);

		// Auto-Journal: reverse accounting entry for cancelled payroll
		try {
			const { reverseAutoJournalEntry } = await import("../../../lib/accounting/auto-journal");
			await reverseAutoJournalEntry(db, {
				organizationId: input.organizationId,
				referenceType: "PAYROLL",
				referenceId: input.id,
				userId: context.user.id,
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to reverse entry for cancelled payroll:", e);
		}

		return result;
	});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE PAYROLL RUN ITEM
// ═══════════════════════════════════════════════════════════════════════════
export const updatePayrollRunItemProcedure = subscriptionProcedure
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
export const deletePayrollRunItemProcedure = subscriptionProcedure
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
