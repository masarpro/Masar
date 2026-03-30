import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const update = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/boq/update",
		tags: ["Project BOQ"],
		summary: "Update a single BOQ item",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			itemId: z.string().trim().max(100),
			section: z
				.enum(["STRUCTURAL", "FINISHING", "MEP", "LABOR", "GENERAL"])
				.optional(),
			category: z.string().trim().max(200).optional().nullable(),
			code: z.string().trim().max(50).optional().nullable(),
			description: z.string().trim().min(1).max(1000).optional(),
			specifications: z.string().trim().max(2000).optional().nullable(),
			unit: z.string().trim().min(1).max(50).optional(),
			quantity: z.number().min(0).optional(),
			unitPrice: z.number().min(0).optional().nullable(),
			projectPhaseId: z.string().trim().max(100).optional().nullable(),
			notes: z.string().trim().max(1000).optional().nullable(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "edit" },
		);

		// Verify item belongs to this project and organization
		const existing = await db.projectBOQItem.findFirst({
			where: {
				id: input.itemId,
				projectId: input.projectId,
				organizationId: input.organizationId,
			},
		});
		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "البند غير موجود أو لا ينتمي لهذا المشروع",
			});
		}

		// Build update data
		const {
			organizationId: _org,
			projectId: _proj,
			itemId: _id,
			...changes
		} = input;

		// Recalculate totalPrice if quantity or unitPrice changed
		const newQuantity =
			changes.quantity !== undefined
				? changes.quantity
				: Number(existing.quantity);
		const newUnitPrice =
			changes.unitPrice !== undefined
				? changes.unitPrice
				: existing.unitPrice != null
					? Number(existing.unitPrice)
					: null;

		let totalPrice: number | null = null;
		if (newUnitPrice != null) {
			totalPrice = newQuantity * newUnitPrice;
		}

		const updated = await db.projectBOQItem.update({
			where: { id: input.itemId },
			data: {
				...changes,
				totalPrice,
			},
		});

		return {
			...updated,
			quantity: Number(updated.quantity),
			unitPrice: updated.unitPrice != null ? Number(updated.unitPrice) : null,
			totalPrice:
				updated.totalPrice != null ? Number(updated.totalPrice) : null,
		};
	});
