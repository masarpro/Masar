import {
	getOrganizationEmployees,
	getEmployeeById,
	createEmployee,
	updateEmployee,
	terminateEmployee,
	getEmployeeSummary,
	generateEmployeeNo,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

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
			organizationId: z.string(),
			status: employeeStatusEnum.optional(),
			type: employeeTypeEnum.optional(),
			query: z.string().optional(),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
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
			organizationId: z.string(),
			id: z.string(),
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
export const createEmployeeProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/company/employees",
		tags: ["Company", "Employees"],
		summary: "Create a new employee",
	})
	.input(
		z.object({
			organizationId: z.string(),
			name: z.string().min(1, "اسم الموظف مطلوب"),
			employeeNo: z.string().optional(),
			type: employeeTypeEnum,
			phone: z.string().optional(),
			email: z.string().email().optional().or(z.literal("")),
			nationalId: z.string().optional(),
			salaryType: salaryTypeEnum.optional(),
			baseSalary: z.number().min(0).optional(),
			housingAllowance: z.number().min(0).optional(),
			transportAllowance: z.number().min(0).optional(),
			otherAllowances: z.number().min(0).optional(),
			gosiSubscription: z.number().min(0).optional(),
			joinDate: z.coerce.date(),
			linkedUserId: z.string().optional(),
			notes: z.string().optional(),
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
export const updateEmployeeProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/company/employees/{id}",
		tags: ["Company", "Employees"],
		summary: "Update an employee",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			name: z.string().min(1).optional(),
			employeeNo: z.string().optional(),
			type: employeeTypeEnum.optional(),
			phone: z.string().optional(),
			email: z.string().email().optional().or(z.literal("")),
			nationalId: z.string().optional(),
			salaryType: salaryTypeEnum.optional(),
			baseSalary: z.number().min(0).optional(),
			housingAllowance: z.number().min(0).optional(),
			transportAllowance: z.number().min(0).optional(),
			otherAllowances: z.number().min(0).optional(),
			gosiSubscription: z.number().min(0).optional(),
			joinDate: z.coerce.date().optional(),
			endDate: z.coerce.date().nullable().optional(),
			status: employeeStatusEnum.optional(),
			linkedUserId: z.string().nullable().optional(),
			notes: z.string().nullable().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "edit",
		});

		const { organizationId, id, ...data } = input;
		return updateEmployee(id, organizationId, data);
	});

// ═══════════════════════════════════════════════════════════════════════════
// TERMINATE EMPLOYEE
// ═══════════════════════════════════════════════════════════════════════════
export const terminateEmployeeProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/company/employees/{id}/terminate",
		tags: ["Company", "Employees"],
		summary: "Terminate an employee",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
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
	.input(z.object({ organizationId: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "view",
		});

		return getEmployeeSummary(input.organizationId);
	});
