import { db, generateAtomicNo, orgAuditLog } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const viCreate = subscriptionProcedure
	.route({
		method: "POST",
		path: "/procurement/vendor-invoices",
		tags: ["Procurement", "Vendor Invoices"],
		summary: "Create a vendor invoice (auto-creates FinanceExpense)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			vendorId: z.string(),
			projectId: z.string(),
			purchaseOrderId: z.string().optional(),
			vendorInvoiceNo: z.string().optional(),
			invoiceDate: z.coerce.date(),
			dueDate: z.coerce.date().optional(),
			vatPercent: z.number().min(0).max(100).default(15),
			notes: z.string().optional(),
			items: z
				.array(
					z.object({
						name: z.string().min(1),
						description: z.string().optional(),
						unit: z.string().min(1),
						quantity: z.number().positive(),
						unitPrice: z.number().min(0),
						poItemId: z.string().optional(),
					}),
				)
				.min(1, "يجب إضافة بند واحد على الأقل"),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "invoice",
		});

		// Verify vendor
		const vendor = await db.vendor.findFirst({
			where: { id: input.vendorId, organizationId: input.organizationId },
		});
		if (!vendor) {
			throw new ORPCError("NOT_FOUND", { message: "المورد غير موجود" });
		}

		const invoiceNumber = await generateAtomicNo(input.organizationId, "VI");

		// Calculate totals
		const subtotal = input.items.reduce(
			(sum, item) => sum + item.quantity * item.unitPrice,
			0,
		);
		const vatAmount = subtotal * (input.vatPercent / 100);
		const totalAmount = subtotal + vatAmount;

		// Create vendor invoice + FinanceExpense in a transaction
		const result = await db.$transaction(async (tx) => {
			// 1. Create VendorInvoice
			const vi = await tx.vendorInvoice.create({
				data: {
					organizationId: input.organizationId,
					vendorId: input.vendorId,
					projectId: input.projectId,
					purchaseOrderId: input.purchaseOrderId,
					invoiceNumber,
					vendorInvoiceNo: input.vendorInvoiceNo,
					invoiceDate: input.invoiceDate,
					dueDate: input.dueDate,
					subtotal,
					vatPercent: input.vatPercent,
					vatAmount,
					totalAmount,
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
							poItemId: item.poItemId,
							sortOrder: index,
						})),
					},
				},
				include: { items: true },
			});

			// 2. Auto-create FinanceExpense
			const expenseNo = await generateAtomicNo(
				input.organizationId,
				"EXP",
			);
			const financeExpense = await tx.financeExpense.create({
				data: {
					organizationId: input.organizationId,
					expenseNo,
					category: "MATERIALS",
					description: `فاتورة مورد: ${vendor.name} - ${invoiceNumber}`,
					amount: totalAmount,
					date: input.invoiceDate,
					vendorName: vendor.name,
					vendorTaxNumber: vendor.taxNumber,
					projectId: input.projectId,
					status: "PENDING",
					sourceType: "VENDOR_INVOICE",
					sourceId: vi.id,
					dueDate: input.dueDate,
					createdById: context.user.id,
				},
			});

			// 3. Link vendor invoice to finance expense
			await tx.vendorInvoice.update({
				where: { id: vi.id },
				data: { financeExpenseId: financeExpense.id },
			});

			return { vi, financeExpense };
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "VENDOR_INVOICE_CREATED",
			entityType: "VendorInvoice",
			entityId: result.vi.id,
			metadata: {
				invoiceNumber,
				vendorName: vendor.name,
				totalAmount,
				financeExpenseId: result.financeExpense.id,
			},
		});

		return {
			...result.vi,
			subtotal: Number(result.vi.subtotal),
			vatPercent: Number(result.vi.vatPercent),
			vatAmount: Number(result.vi.vatAmount),
			totalAmount: Number(result.vi.totalAmount),
			paidAmount: Number(result.vi.paidAmount),
			financeExpenseId: result.financeExpense.id,
			items: result.vi.items.map((item) => ({
				...item,
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
				totalPrice: Number(item.totalPrice),
			})),
		};
	});
