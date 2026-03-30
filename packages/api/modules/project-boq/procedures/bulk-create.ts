import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const bulkCreate = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/boq/bulk",
		tags: ["Project BOQ"],
		summary: "Create multiple BOQ items at once",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			items: z
				.array(
					z.object({
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
							.enum([
								"MANUAL",
								"COST_STUDY",
								"IMPORTED",
								"CONTRACT",
								"QUOTATION",
							])
							.default("MANUAL"),
					}),
				)
				.min(1)
				.max(200),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "create" },
		);

		// Get last sortOrder
		const lastItem = await db.projectBOQItem.findFirst({
			where: {
				projectId: input.projectId,
				organizationId: input.organizationId,
			},
			orderBy: { sortOrder: "desc" },
			select: { sortOrder: true },
		});
		let nextSortOrder = (lastItem?.sortOrder ?? -1) + 1;

		const created = await db.$transaction(
			input.items.map((item) => {
				const totalPrice =
					item.unitPrice != null ? item.quantity * item.unitPrice : null;
				const sortOrder = nextSortOrder++;
				return db.projectBOQItem.create({
					data: {
						projectId: input.projectId,
						organizationId: input.organizationId,
						section: item.section,
						category: item.category,
						code: item.code,
						description: item.description,
						specifications: item.specifications,
						unit: item.unit,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						totalPrice,
						projectPhaseId: item.projectPhaseId,
						notes: item.notes,
						sourceType: item.sourceType,
						sortOrder,
						createdById: context.user.id,
					},
				});
			}),
		);

		return { createdCount: created.length };
	});
