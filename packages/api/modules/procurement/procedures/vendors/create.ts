import { db, generateAtomicNo, orgAuditLog } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const vendorsCreate = subscriptionProcedure
	.route({
		method: "POST",
		path: "/procurement/vendors",
		tags: ["Procurement", "Vendors"],
		summary: "Create a new vendor",
	})
	.input(
		z.object({
			organizationId: z.string(),
			name: z.string().min(1, "اسم المورد مطلوب"),
			nameEn: z.string().optional(),
			type: z
				.enum([
					"SUPPLIER",
					"SUBCONTRACTOR_VENDOR",
					"EQUIPMENT_VENDOR",
					"SERVICE_VENDOR",
				])
				.optional()
				.default("SUPPLIER"),
			contactPerson: z.string().optional(),
			phone: z.string().optional(),
			mobile: z.string().optional(),
			email: z.string().email().optional().or(z.literal("")),
			website: z.string().optional(),
			address: z.string().optional(),
			city: z.string().optional(),
			region: z.string().optional(),
			postalCode: z.string().optional(),
			country: z.string().optional().default("SA"),
			taxNumber: z.string().optional(),
			crNumber: z.string().optional(),
			iban: z.string().optional(),
			bankName: z.string().optional(),
			categories: z.array(z.string()).optional().default([]),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "vendors",
		});

		const code = await generateAtomicNo(input.organizationId, "VND");

		const vendor = await db.vendor.create({
			data: {
				organizationId: input.organizationId,
				code,
				name: input.name,
				nameEn: input.nameEn,
				type: input.type,
				contactPerson: input.contactPerson,
				phone: input.phone,
				mobile: input.mobile,
				email: input.email || undefined,
				website: input.website,
				address: input.address,
				city: input.city,
				region: input.region,
				postalCode: input.postalCode,
				country: input.country,
				taxNumber: input.taxNumber,
				crNumber: input.crNumber,
				iban: input.iban,
				bankName: input.bankName,
				categories: input.categories,
				notes: input.notes,
				createdById: context.user.id,
			},
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "VENDOR_CREATED",
			entityType: "Vendor",
			entityId: vendor.id,
			metadata: { code, name: input.name },
		});

		return { ...vendor, rating: vendor.rating ? Number(vendor.rating) : null };
	});
