import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const copyFromQuotation = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/boq/copy-from-quotation",
		tags: ["Project BOQ"],
		summary: "Copy items from a quotation to project BOQ",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			quotationId: z.string().trim().max(100),
			includePrices: z.boolean().default(true),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "create" },
		);

		// Fetch quotation with items
		const quotation = await db.quotation.findFirst({
			where: {
				id: input.quotationId,
				organizationId: input.organizationId,
			},
			include: { items: { orderBy: { sortOrder: "asc" } } },
		});

		if (!quotation) {
			throw new ORPCError("NOT_FOUND", {
				message: "عرض السعر غير موجود أو لا ينتمي لهذه المنظمة",
			});
		}

		if (quotation.items.length === 0) {
			throw new ORPCError("BAD_REQUEST", {
				message: "عرض السعر لا يحتوي على بنود",
			});
		}

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
			quotation.items.map((item) => {
				const unitPrice = input.includePrices ? Number(item.unitPrice) : null;
				const totalPrice = input.includePrices
					? Number(item.totalPrice)
					: null;

				return db.projectBOQItem.create({
					data: {
						projectId: input.projectId,
						organizationId: input.organizationId,
						section: "GENERAL",
						description: item.description,
						unit: item.unit || "وحدة",
						quantity: item.quantity,
						unitPrice:
							unitPrice != null && unitPrice > 0 ? unitPrice : null,
						totalPrice:
							totalPrice != null && totalPrice > 0 ? totalPrice : null,
						sourceType: "QUOTATION",
						quotationId: input.quotationId,
						sourceItemId: item.id,
						sortOrder: nextSortOrder++,
						createdById: context.user.id,
					},
				});
			}),
		);

		return { copiedCount: created.length };
	});
