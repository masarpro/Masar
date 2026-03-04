import { db, orgAuditLog } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const vendorsUpdate = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/procurement/vendors/{vendorId}",
		tags: ["Procurement", "Vendors"],
		summary: "Update a vendor",
	})
	.input(
		z.object({
			organizationId: z.string(),
			vendorId: z.string(),
			name: z.string().min(1).optional(),
			nameEn: z.string().nullish(),
			type: z
				.enum([
					"SUPPLIER",
					"SUBCONTRACTOR_VENDOR",
					"EQUIPMENT_VENDOR",
					"SERVICE_VENDOR",
				])
				.optional(),
			contactPerson: z.string().nullish(),
			phone: z.string().nullish(),
			mobile: z.string().nullish(),
			email: z.string().email().nullish().or(z.literal("")),
			website: z.string().nullish(),
			address: z.string().nullish(),
			city: z.string().nullish(),
			region: z.string().nullish(),
			postalCode: z.string().nullish(),
			country: z.string().optional(),
			taxNumber: z.string().nullish(),
			crNumber: z.string().nullish(),
			iban: z.string().nullish(),
			bankName: z.string().nullish(),
			categories: z.array(z.string()).optional(),
			rating: z.number().min(1).max(5).nullish(),
			isActive: z.boolean().optional(),
			notes: z.string().nullish(),
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

		const { organizationId, vendorId, ...data } = input;
		const vendor = await db.vendor.update({
			where: { id: vendorId },
			data: {
				...data,
				email: data.email || undefined,
			},
		});

		orgAuditLog({
			organizationId,
			actorId: context.user.id,
			action: "VENDOR_UPDATED",
			entityType: "Vendor",
			entityId: vendorId,
			metadata: { name: vendor.name },
		});

		return { ...vendor, rating: vendor.rating ? Number(vendor.rating) : null };
	});
