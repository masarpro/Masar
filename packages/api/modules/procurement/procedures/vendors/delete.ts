import { db, orgAuditLog } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const vendorsDelete = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/procurement/vendors/{vendorId}",
		tags: ["Procurement", "Vendors"],
		summary: "Soft-delete a vendor (set isActive=false)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			vendorId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "vendors",
		});

		const existing = await db.vendor.findFirst({
			where: { id: input.vendorId, organizationId: input.organizationId },
		});
		if (!existing) {
			throw new ORPCError("NOT_FOUND", { message: "المورد غير موجود" });
		}

		await db.vendor.update({
			where: { id: input.vendorId },
			data: { isActive: false },
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "VENDOR_DELETED",
			entityType: "Vendor",
			entityId: input.vendorId,
			metadata: { name: existing.name },
		});

		return { success: true };
	});
