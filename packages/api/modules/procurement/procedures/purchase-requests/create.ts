import { db, generateAtomicNo, orgAuditLog } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyProjectAccess } from "../../../../lib/permissions";

export const prCreate = subscriptionProcedure
	.route({
		method: "POST",
		path: "/procurement/purchase-requests",
		tags: ["Procurement", "Purchase Requests"],
		summary: "Create a new purchase request",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			title: z.string().min(1, "عنوان الطلب مطلوب"),
			description: z.string().optional(),
			priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
			requiredDate: z.coerce.date().optional(),
			notes: z.string().optional(),
			items: z
				.array(
					z.object({
						name: z.string().min(1, "اسم المادة مطلوب"),
						description: z.string().optional(),
						unit: z.string().min(1, "الوحدة مطلوبة"),
						quantity: z.number().positive("الكمية يجب أن تكون أكبر من صفر"),
						estimatedPrice: z.number().min(0).default(0),
						costStudyItemId: z.string().optional(),
						costStudyItemType: z.string().optional(),
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
			{ section: "procurement", action: "request" },
		);

		const prNumber = await generateAtomicNo(input.organizationId, "PR");

		const estimatedTotal = input.items.reduce(
			(sum, item) => sum + item.quantity * item.estimatedPrice,
			0,
		);

		const pr = await db.purchaseRequest.create({
			data: {
				organizationId: input.organizationId,
				projectId: input.projectId,
				prNumber,
				title: input.title,
				description: input.description,
				priority: input.priority,
				requiredDate: input.requiredDate,
				estimatedTotal,
				requestedById: context.user.id,
				createdById: context.user.id,
				notes: input.notes,
				items: {
					create: input.items.map((item, index) => ({
						name: item.name,
						description: item.description,
						unit: item.unit,
						quantity: item.quantity,
						estimatedPrice: item.estimatedPrice,
						totalEstimate: item.quantity * item.estimatedPrice,
						costStudyItemId: item.costStudyItemId,
						costStudyItemType: item.costStudyItemType,
						sortOrder: index,
					})),
				},
			},
			include: {
				items: true,
				project: { select: { id: true, name: true } },
			},
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "PR_CREATED",
			entityType: "PurchaseRequest",
			entityId: pr.id,
			metadata: { prNumber, projectId: input.projectId, title: input.title },
		});

		return {
			...pr,
			estimatedTotal: Number(pr.estimatedTotal),
			items: pr.items.map((item) => ({
				...item,
				quantity: Number(item.quantity),
				estimatedPrice: Number(item.estimatedPrice),
				totalEstimate: Number(item.totalEstimate),
				orderedQuantity: Number(item.orderedQuantity),
				receivedQuantity: Number(item.receivedQuantity),
			})),
		};
	});
