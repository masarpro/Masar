import { createSubcontractChangeOrder, getSubcontractById, logAuditEvent } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const createSubcontractChangeOrderProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/subcontracts/{contractId}/change-orders",
		tags: ["Subcontracts"],
		summary: "Create a change order for a subcontract",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			contractId: z.string(),
			description: z.string().min(1, "وصف أمر التغيير مطلوب"),
			amount: z.number(),
			status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]).optional(),
			approvedDate: z.coerce.date().nullish(),
			attachmentUrl: z.string().nullish(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		const contract = await getSubcontractById(
			input.contractId,
			input.organizationId,
			input.projectId,
		);

		if (!contract) {
			throw new ORPCError("NOT_FOUND", {
				message: "عقد الباطن غير موجود",
			});
		}

		const co = await createSubcontractChangeOrder({
			contractId: input.contractId,
			createdById: context.user.id,
			description: input.description,
			amount: input.amount,
			status: input.status,
			approvedDate: input.approvedDate,
			attachmentUrl: input.attachmentUrl,
		});

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "SUBCONTRACT_CO_CREATED",
			entityType: "subcontract_change_order",
			entityId: co.id,
			metadata: { contractId: input.contractId, amount: input.amount },
		}).catch(() => {});

		return { ...co, amount: Number(co.amount) };
	});
