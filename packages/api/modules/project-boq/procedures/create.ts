import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const create = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/boq",
		tags: ["Project BOQ"],
		summary: "Create a single BOQ item",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			section: z
				.enum(["STRUCTURAL", "FINISHING", "MEP", "LABOR", "GENERAL"])
				.default("GENERAL"),
			category: z.string().trim().max(200).optional(),
			code: z.string().trim().max(50).optional(),
			description: z.string().trim().min(1).max(1000),
			specifications: z.string().trim().max(2000).optional(),
			unit: z.string().trim().min(1).max(50),
			quantity: z.number().min(0),
			unitPrice: z.number().min(0).optional().nullable(),
			projectPhaseId: z.string().trim().max(100).optional().nullable(),
			notes: z.string().trim().max(1000).optional(),
			sourceType: z
				.enum(["MANUAL", "COST_STUDY", "IMPORTED", "CONTRACT", "QUOTATION"])
				.default("MANUAL"),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "create" },
		);

		// Verify phase belongs to this project
		if (input.projectPhaseId) {
			const milestone = await db.projectMilestone.findFirst({
				where: {
					id: input.projectPhaseId,
					projectId: input.projectId,
					organizationId: input.organizationId,
				},
			});
			if (!milestone) {
				throw new ORPCError("NOT_FOUND", {
					message: "المرحلة غير موجودة أو لا تنتمي لهذا المشروع",
				});
			}
		}

		// Calculate totalPrice
		const totalPrice =
			input.unitPrice != null ? input.quantity * input.unitPrice : null;

		// Get next sortOrder
		const lastItem = await db.projectBOQItem.findFirst({
			where: {
				projectId: input.projectId,
				organizationId: input.organizationId,
			},
			orderBy: { sortOrder: "desc" },
			select: { sortOrder: true },
		});
		const sortOrder = (lastItem?.sortOrder ?? -1) + 1;

		const item = await db.projectBOQItem.create({
			data: {
				projectId: input.projectId,
				organizationId: input.organizationId,
				section: input.section,
				category: input.category,
				code: input.code,
				description: input.description,
				specifications: input.specifications,
				unit: input.unit,
				quantity: input.quantity,
				unitPrice: input.unitPrice,
				totalPrice,
				projectPhaseId: input.projectPhaseId,
				notes: input.notes,
				sourceType: input.sourceType,
				sortOrder,
				createdById: context.user.id,
			},
		});

		return {
			...item,
			quantity: Number(item.quantity),
			unitPrice: item.unitPrice != null ? Number(item.unitPrice) : null,
			totalPrice: item.totalPrice != null ? Number(item.totalPrice) : null,
		};
	});
