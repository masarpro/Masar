import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getEmployeeHistoryProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/company/employees/{employeeId}/history",
		tags: ["Company", "Employees"],
		summary: "Get employee change history",
	})
	.input(
		z.object({
			organizationId: z.string(),
			employeeId: z.string(),
			page: z.number().optional().default(1),
			pageSize: z.number().optional().default(20),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "view",
		});

		const skip = (input.page - 1) * input.pageSize;

		const [changes, total] = await Promise.all([
			db.employeeChangeLog.findMany({
				where: {
					employeeId: input.employeeId,
					organizationId: input.organizationId,
				},
				orderBy: { createdAt: "desc" },
				skip,
				take: input.pageSize,
				select: {
					id: true,
					changeType: true,
					fieldName: true,
					oldValue: true,
					newValue: true,
					notes: true,
					changedBy: true,
					createdAt: true,
				},
			}),
			db.employeeChangeLog.count({
				where: {
					employeeId: input.employeeId,
					organizationId: input.organizationId,
				},
			}),
		]);

		return { changes, total };
	});
