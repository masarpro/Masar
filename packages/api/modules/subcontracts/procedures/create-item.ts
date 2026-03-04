import { createSubcontractItem, getSubcontractById, logAuditEvent } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const createSubcontractItemProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/subcontracts/{contractId}/items",
		tags: ["Subcontract Items"],
		summary: "Add a new item to a subcontract",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			contractId: z.string(),
			itemCode: z.string().nullish(),
			description: z.string().min(1, "وصف البند مطلوب"),
			descriptionEn: z.string().nullish(),
			unit: z.string().min(1, "وحدة القياس مطلوبة"),
			contractQty: z.number().positive("الكمية يجب أن تكون أكبر من صفر"),
			unitPrice: z.number().positive("سعر الوحدة يجب أن يكون أكبر من صفر"),
			sortOrder: z.number().optional(),
			category: z.string().nullish(),
			isLumpSum: z.boolean().default(false),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		// Verify contract exists
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

		const item = await createSubcontractItem({
			organizationId: input.organizationId,
			contractId: input.contractId,
			createdById: context.user.id,
			itemCode: input.itemCode,
			description: input.description,
			descriptionEn: input.descriptionEn,
			unit: input.unit,
			contractQty: input.contractQty,
			unitPrice: input.unitPrice,
			sortOrder: input.sortOrder,
			category: input.category,
			isLumpSum: input.isLumpSum,
		});

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "SUBCONTRACT_ITEM_CREATED",
			entityType: "subcontract_item",
			entityId: item.id,
			metadata: { contractId: input.contractId, description: input.description },
		}).catch(() => {});

		return {
			...item,
			contractQty: Number(item.contractQty),
			unitPrice: Number(item.unitPrice),
			totalAmount: Number(item.totalAmount),
		};
	});
