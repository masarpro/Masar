import {
	getOrganizationEmployees,
	getEmployeeById,
	createEmployee,
	updateEmployee,
	terminateEmployee,
	getEmployeeSummary,
	generateEmployeeNo,
	db,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import { logEmployeeChanges } from "../lib/log-employee-change";
import {
	idString,
	trimmedString,
	optionalTrimmed,
	nullishTrimmed,
	searchQuery,
	financialAmount,
	paginationLimit,
	paginationOffset,
	MAX_NAME,
	MAX_DESC,
	MAX_CODE,
	MAX_PHONE,
	MAX_EMAIL,
} from "../../../lib/validation-constants";

const employeeTypeEnum = z.enum([
	"PROJECT_MANAGER", "SITE_ENGINEER", "SUPERVISOR", "ACCOUNTANT",
	"ADMIN", "DRIVER", "TECHNICIAN", "LABORER", "SECURITY", "OTHER",
]);
const salaryTypeEnum = z.enum(["MONTHLY", "DAILY"]);
const employeeStatusEnum = z.enum(["ACTIVE", "ON_LEAVE", "TERMINATED"]);

// ═══════════════════════════════════════════════════════════════════════════
// LIST EMPLOYEES
// ═══════════════════════════════════════════════════════════════════════════
export const listEmployees = protectedProcedure
	.route({
		method: "GET",
		path: "/company/employees",
		tags: ["Company", "Employees"],
		summary: "List company employees",
	})
	.input(
		z.object({
			organizationId: idString(),
			status: employeeStatusEnum.optional(),
			type: employeeTypeEnum.optional(),
			query: searchQuery(),
			limit: paginationLimit(),
			offset: paginationOffset(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "view",
		});

		return getOrganizationEmployees(input.organizationId, {
			status: input.status,
			type: input.type,
			query: input.query,
			limit: input.limit,
			offset: input.offset,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET EMPLOYEE BY ID
// ═══════════════════════════════════════════════════════════════════════════
export const getEmployeeByIdProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/company/employees/{id}",
		tags: ["Company", "Employees"],
		summary: "Get a single employee",
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
			action: "view",
		});

		const employee = await getEmployeeById(input.id, input.organizationId);
		if (!employee) throw new Error("Employee not found");
		return employee;
	});

// ═══════════════════════════════════════════════════════════════════════════
// CREATE EMPLOYEE
// ═══════════════════════════════════════════════════════════════════════════
export const createEmployeeProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/employees",
		tags: ["Company", "Employees"],
		summary: "Create a new employee",
	})
	.input(
		z.object({
			organizationId: idString(),
			name: trimmedString(MAX_NAME),
			employeeNo: optionalTrimmed(MAX_CODE),
			type: employeeTypeEnum,
			phone: optionalTrimmed(MAX_PHONE),
			email: z.string().trim().max(MAX_EMAIL).email().optional().or(z.literal("")),
			nationalId: optionalTrimmed(MAX_CODE),
			salaryType: salaryTypeEnum.optional(),
			baseSalary: financialAmount().optional(),
			housingAllowance: financialAmount().optional(),
			transportAllowance: financialAmount().optional(),
			otherAllowances: financialAmount().optional(),
			gosiSubscription: financialAmount().optional(),
			joinDate: z.coerce.date(),
			linkedUserId: optionalTrimmed(MAX_CODE),
			notes: optionalTrimmed(MAX_DESC),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "create",
		});

		const employeeNo = await generateEmployeeNo(input.organizationId);

		return createEmployee({
			...input,
			employeeNo,
			email: input.email || undefined,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE EMPLOYEE
// ═══════════════════════════════════════════════════════════════════════════
export const updateEmployeeProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/company/employees/{id}",
		tags: ["Company", "Employees"],
		summary: "Update an employee",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			name: trimmedString(MAX_NAME).optional(),
			employeeNo: optionalTrimmed(MAX_CODE),
			type: employeeTypeEnum.optional(),
			phone: optionalTrimmed(MAX_PHONE),
			email: z.string().trim().max(MAX_EMAIL).email().optional().or(z.literal("")),
			nationalId: optionalTrimmed(MAX_CODE),
			salaryType: salaryTypeEnum.optional(),
			baseSalary: financialAmount().optional(),
			housingAllowance: financialAmount().optional(),
			transportAllowance: financialAmount().optional(),
			otherAllowances: financialAmount().optional(),
			gosiSubscription: financialAmount().optional(),
			joinDate: z.coerce.date().optional(),
			endDate: z.coerce.date().nullable().optional(),
			status: employeeStatusEnum.optional(),
			linkedUserId: z.string().trim().max(MAX_CODE).nullable().optional(),
			notes: nullishTrimmed(MAX_DESC),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "edit",
		});

		const { organizationId, id, ...data } = input;

		// Fetch old data before update for change logging
		const oldEmployee = await db.employee.findFirst({
			where: { id, organizationId },
		});

		const updated = await updateEmployee(id, organizationId, data);

		// Log changes (fire-and-forget)
		if (oldEmployee) {
			logEmployeeChanges({
				employeeId: id,
				organizationId,
				changedBy: context.user.id,
				oldData: oldEmployee,
				newData: updated,
			});
		}

		return updated;
	});

// ═══════════════════════════════════════════════════════════════════════════
// TERMINATE EMPLOYEE
// ═══════════════════════════════════════════════════════════════════════════
export const terminateEmployeeProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/employees/{id}/terminate",
		tags: ["Company", "Employees"],
		summary: "Terminate an employee",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			endDate: z.coerce.date(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "delete",
		});

		return terminateEmployee(input.id, input.organizationId, input.endDate);
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET EMPLOYEE SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
export const getEmployeeSummaryProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/company/employees/summary",
		tags: ["Company", "Employees"],
		summary: "Get employee summary statistics",
	})
	.input(z.object({ organizationId: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "view",
		});

		return getEmployeeSummary(input.organizationId);
	});
