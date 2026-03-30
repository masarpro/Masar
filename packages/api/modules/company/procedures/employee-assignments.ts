import {
	getEmployeeAssignments,
	getProjectEmployeeAssignments,
	createEmployeeAssignment,
	updateEmployeeAssignment,
	removeEmployeeAssignment,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import {
	idString,
	nullishTrimmed,
	optionalTrimmed,
	percentage,
	MAX_DESC,
} from "../../../lib/validation-constants";

// ═══════════════════════════════════════════════════════════════════════════
// LIST EMPLOYEE ASSIGNMENTS
// ═══════════════════════════════════════════════════════════════════════════
export const listEmployeeAssignments = protectedProcedure
	.route({
		method: "GET",
		path: "/company/employees/{employeeId}/assignments",
		tags: ["Company", "Employee Assignments"],
		summary: "List assignments for an employee",
	})
	.input(
		z.object({
			organizationId: idString(),
			employeeId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "view",
		});

		return getEmployeeAssignments(input.employeeId);
	});

// ═══════════════════════════════════════════════════════════════════════════
// LIST PROJECT EMPLOYEE ASSIGNMENTS
// ═══════════════════════════════════════════════════════════════════════════
export const listProjectAssignments = protectedProcedure
	.route({
		method: "GET",
		path: "/company/projects/{projectId}/employee-assignments",
		tags: ["Company", "Employee Assignments"],
		summary: "List employee assignments for a project",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "view",
		});

		return getProjectEmployeeAssignments(input.projectId);
	});

// ═══════════════════════════════════════════════════════════════════════════
// CREATE ASSIGNMENT
// ═══════════════════════════════════════════════════════════════════════════
export const createAssignmentProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/employees/{employeeId}/assignments",
		tags: ["Company", "Employee Assignments"],
		summary: "Assign an employee to a project",
	})
	.input(
		z.object({
			organizationId: idString(),
			employeeId: idString(),
			projectId: idString(),
			percentage: percentage().min(1),
			startDate: z.coerce.date(),
			notes: optionalTrimmed(MAX_DESC),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "edit",
		});

		return createEmployeeAssignment({
			employeeId: input.employeeId,
			projectId: input.projectId,
			percentage: input.percentage,
			startDate: input.startDate,
			notes: input.notes,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE ASSIGNMENT
// ═══════════════════════════════════════════════════════════════════════════
export const updateAssignmentProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/company/employee-assignments/{id}",
		tags: ["Company", "Employee Assignments"],
		summary: "Update an employee assignment",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			percentage: percentage().min(1).optional(),
			startDate: z.coerce.date().optional(),
			endDate: z.coerce.date().nullable().optional(),
			isActive: z.boolean().optional(),
			notes: nullishTrimmed(MAX_DESC),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "edit",
		});

		const { organizationId, id, ...data } = input;
		return updateEmployeeAssignment(id, data);
	});

// ═══════════════════════════════════════════════════════════════════════════
// REMOVE ASSIGNMENT
// ═══════════════════════════════════════════════════════════════════════════
export const removeAssignmentProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/company/employee-assignments/{id}",
		tags: ["Company", "Employee Assignments"],
		summary: "Remove an employee assignment",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "edit",
		});

		return removeEmployeeAssignment(input.id);
	});
