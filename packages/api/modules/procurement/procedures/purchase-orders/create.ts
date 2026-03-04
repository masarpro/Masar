import { db, generateAtomicNo, orgAuditLog } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyProjectAccess } from "../../../../lib/permissions";

export const poCreate = subscriptionProcedure
	.route({
		method: "POST",
		path: "/procurement/purchase-orders",
		tags: ["Procurement", "Purchase Orders"],
		summary: "Create a new purchase order",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			vendorId: z.string(),
			purchaseRequestId: z.string().optional(),
			expectedDelivery: z.coerce.date().optional(),
			vatPercent: z.number().min(0).max(100).default(15),
			discountPercent: z.number().min(0).max(100).default(0),
			paymentTerms: z.string().optional(),
			deliveryTerms: z.string().optional(),
			warrantyTerms: z.string().optional(),
			notes: z.string().optional(),
			items: z
				.array(
					z.object({
						name: z.string().min(1),
						description: z.string().optional(),
						unit: z.string().min(1),
						quantity: z.number().positive(),
						unitPrice: z.number().min(0),
						prItemId: z.string().optional(),
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

		// Verify vendor exists
		const vendor = await db.vendor.findFirst({
			where: {
				id: input.vendorId,
				organizationId: input.organizationId,
				isActive: true,
			},
		});
		if (!vendor) {
			throw new ORPCError("NOT_FOUND", { message: "المورد غير موجود" });
		}

		const poNumber = await generateAtomicNo(input.organizationId, "PO");

		// Calculate totals
		const subtotal = input.items.reduce(
			(sum, item) => sum + item.quantity * item.unitPrice,
			0,
		);
		const discountAmount = subtotal * (input.discountPercent / 100);
		const afterDiscount = subtotal - discountAmount;
		const vatAmount = afterDiscount * (input.vatPercent / 100);
		const totalAmount = afterDiscount + vatAmount;

		const po = await db.purchaseOrder.create({
			data: {
				organizationId: input.organizationId,
				projectId: input.projectId,
				vendorId: input.vendorId,
				purchaseRequestId: input.purchaseRequestId,
				poNumber,
				expectedDelivery: input.expectedDelivery,
				subtotal,
				discountPercent: input.discountPercent,
				discountAmount,
				vatPercent: input.vatPercent,
				vatAmount,
				totalAmount,
				paymentTerms: input.paymentTerms,
				deliveryTerms: input.deliveryTerms,
				warrantyTerms: input.warrantyTerms,
				notes: input.notes,
				createdById: context.user.id,
				items: {
					create: input.items.map((item, index) => ({
						name: item.name,
						description: item.description,
						unit: item.unit,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						totalPrice: item.quantity * item.unitPrice,
						prItemId: item.prItemId,
						sortOrder: index,
					})),
				},
			},
			include: {
				items: true,
				vendor: { select: { id: true, name: true } },
			},
		});

		// Update PR item ordered quantities if linked
		if (input.purchaseRequestId) {
			for (const item of input.items) {
				if (item.prItemId) {
					await db.purchaseRequestItem.update({
						where: { id: item.prItemId },
						data: {
							orderedQuantity: { increment: item.quantity },
						},
					});
				}
			}
			// Check if PR is fully ordered
			const prItems = await db.purchaseRequestItem.findMany({
				where: { purchaseRequestId: input.purchaseRequestId },
			});
			const allOrdered = prItems.every(
				(i) => Number(i.orderedQuantity) >= Number(i.quantity),
			);
			const someOrdered = prItems.some((i) => Number(i.orderedQuantity) > 0);
			if (allOrdered) {
				await db.purchaseRequest.update({
					where: { id: input.purchaseRequestId },
					data: { status: "FULLY_ORDERED" },
				});
			} else if (someOrdered) {
				await db.purchaseRequest.update({
					where: { id: input.purchaseRequestId },
					data: { status: "PARTIALLY_ORDERED" },
				});
			}
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "PO_CREATED",
			entityType: "PurchaseOrder",
			entityId: po.id,
			metadata: { poNumber, vendorName: vendor.name, totalAmount },
		});

		return {
			...po,
			subtotal: Number(po.subtotal),
			discountPercent: Number(po.discountPercent),
			discountAmount: Number(po.discountAmount),
			vatPercent: Number(po.vatPercent),
			vatAmount: Number(po.vatAmount),
			totalAmount: Number(po.totalAmount),
			items: po.items.map((item) => ({
				...item,
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
				totalPrice: Number(item.totalPrice),
				receivedQuantity: Number(item.receivedQuantity),
			})),
		};
	});
