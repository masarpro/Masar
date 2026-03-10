import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

const boqSectionEnum = z.enum([
	"STRUCTURAL",
	"FINISHING",
	"MEP",
	"LABOR",
	"GENERAL",
]);

const boqSourceTypeEnum = z.enum([
	"MANUAL",
	"COST_STUDY",
	"IMPORTED",
	"CONTRACT",
	"QUOTATION",
]);

export const importFromData = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/boq/import",
		tags: ["Project BOQ"],
		summary: "Import BOQ items from parsed Excel data (JSON)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			defaultSection: boqSectionEnum.default("GENERAL"),
			defaultSourceType: boqSourceTypeEnum.default("IMPORTED"),
			items: z
				.array(
					z.object({
						code: z.string().max(50).optional(),
						description: z.string().min(1).max(1000),
						specifications: z.string().max(2000).optional(),
						unit: z.string().min(1).max(50),
						quantity: z.number().min(0),
						unitPrice: z.number().min(0).optional().nullable(),
						section: boqSectionEnum.optional(),
						category: z.string().max(200).optional(),
						notes: z.string().max(1000).optional(),
					}),
				)
				.min(1)
				.max(500),
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

		let pricedCount = 0;
		let unpricedCount = 0;

		const created = await db.$transaction(
			input.items.map((item) => {
				const unitPrice = item.unitPrice ?? null;
				const totalPrice =
					unitPrice != null ? item.quantity * unitPrice : null;

				if (unitPrice != null) {
					pricedCount++;
				} else {
					unpricedCount++;
				}

				return db.projectBOQItem.create({
					data: {
						projectId: input.projectId,
						organizationId: input.organizationId,
						section: item.section || input.defaultSection,
						category: item.category,
						code: item.code,
						description: item.description,
						specifications: item.specifications,
						unit: item.unit,
						quantity: item.quantity,
						unitPrice,
						totalPrice,
						sourceType: input.defaultSourceType,
						notes: item.notes,
						sortOrder: nextSortOrder++,
						createdById: context.user.id,
					},
				});
			}),
		);

		return {
			importedCount: created.length,
			pricedCount,
			unpricedCount,
		};
	});
