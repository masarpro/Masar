import { db, generateAtomicNo } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyProjectAccess } from "../../../../lib/permissions";

export const rfqCreate = subscriptionProcedure
	.route({
		method: "POST",
		path: "/procurement/rfq",
		tags: ["Procurement", "RFQ"],
		summary: "Create a new RFQ",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			purchaseRequestId: z.string().optional(),
			title: z.string().min(1, "العنوان مطلوب"),
			description: z.string().optional(),
			responseDeadline: z.coerce.date().optional(),
			notes: z.string().optional(),
			items: z
				.array(
					z.object({
						name: z.string().min(1),
						description: z.string().optional(),
						unit: z.string().min(1),
						quantity: z.number().positive(),
					}),
				)
				.min(1, "يجب إضافة بند واحد على الأقل"),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "procurement", action: "order" },
		);

		const rfqNumber = await generateAtomicNo(input.organizationId, "RFQ");

		const rfq = await db.rFQ.create({
			data: {
				organizationId: input.organizationId,
				projectId: input.projectId,
				purchaseRequestId: input.purchaseRequestId,
				rfqNumber,
				title: input.title,
				description: input.description,
				responseDeadline: input.responseDeadline,
				notes: input.notes,
				createdById: context.user.id,
				items: {
					create: input.items.map((item, index) => ({
						name: item.name,
						description: item.description,
						unit: item.unit,
						quantity: item.quantity,
						sortOrder: index,
					})),
				},
			},
			include: { items: true },
		});

		return {
			...rfq,
			items: rfq.items.map((item) => ({
				...item,
				quantity: Number(item.quantity),
			})),
		};
	});
