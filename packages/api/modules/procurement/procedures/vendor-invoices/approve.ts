import { db, orgAuditLog } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const viApprove = subscriptionProcedure
	.route({
		method: "POST",
		path: "/procurement/vendor-invoices/{invoiceId}/approve",
		tags: ["Procurement", "Vendor Invoices"],
		summary: "Approve a vendor invoice",
	})
	.input(
		z.object({
			organizationId: z.string(),
			invoiceId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "approve",
		});

		const existing = await db.vendorInvoice.findFirst({
			where: { id: input.invoiceId, organizationId: input.organizationId },
		});
		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "فاتورة المورد غير موجودة",
			});
		}
		if (
			existing.status !== "VI_DRAFT" &&
			existing.status !== "VI_PENDING_APPROVAL"
		) {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن اعتماد الفاتورة في حالتها الحالية",
			});
		}

		const vi = await db.vendorInvoice.update({
			where: { id: input.invoiceId },
			data: {
				status: "VI_APPROVED",
				approvedById: context.user.id,
				approvalDate: new Date(),
			},
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "VENDOR_INVOICE_APPROVED",
			entityType: "VendorInvoice",
			entityId: vi.id,
			metadata: { invoiceNumber: vi.invoiceNumber },
		});

		return {
			...vi,
			totalAmount: Number(vi.totalAmount),
			paidAmount: Number(vi.paidAmount),
		};
	});
