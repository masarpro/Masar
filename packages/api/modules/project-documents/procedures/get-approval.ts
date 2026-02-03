import { ORPCError } from "@orpc/server";
import { getApproval, getEntityAuditLogs } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const getApprovalProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/approvals/{approvalId}",
		tags: ["Project Documents"],
		summary: "Get an approval request by ID",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			approvalId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const approval = await getApproval(
			input.organizationId,
			input.projectId,
			input.approvalId,
		);

		if (!approval) {
			throw new ORPCError("NOT_FOUND", { message: "طلب الاعتماد غير موجود" });
		}

		// Get audit logs for this approval
		const auditLogs = await getEntityAuditLogs(
			input.organizationId,
			input.projectId,
			"approval",
			input.approvalId,
			{ limit: 10 },
		);

		return {
			...approval,
			auditLogs,
		};
	});
