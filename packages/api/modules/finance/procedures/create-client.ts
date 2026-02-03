import { createClient } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

// نوع العميل
const clientTypeEnum = z.enum(["INDIVIDUAL", "COMMERCIAL"]);

// العنوان الثانوي
const secondaryAddressSchema = z
	.object({
		streetAddress1: z.string().optional(),
		streetAddress2: z.string().optional(),
		city: z.string().optional(),
		region: z.string().optional(),
		postalCode: z.string().optional(),
		country: z.string().optional(),
	})
	.optional();

export const createClientProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/clients",
		tags: ["Finance", "Clients"],
		summary: "Create a new client",
	})
	.input(
		z.object({
			organizationId: z.string(),
			// نوع العميل
			clientType: clientTypeEnum.optional().default("INDIVIDUAL"),
			// الأسماء
			firstName: z.string().optional(),
			lastName: z.string().optional(),
			businessName: z.string().optional(),
			name: z.string().min(1, "اسم العميل مطلوب"),
			company: z.string().optional(),
			// الاتصال
			phone: z.string().optional(),
			mobile: z.string().optional(),
			email: z.string().email().optional().or(z.literal("")),
			// العنوان
			address: z.string().optional(),
			streetAddress1: z.string().optional(),
			streetAddress2: z.string().optional(),
			city: z.string().optional(),
			region: z.string().optional(),
			postalCode: z.string().optional(),
			country: z.string().optional().default("SA"),
			secondaryAddress: secondaryAddressSchema,
			// الحساب
			code: z.string().optional(),
			currency: z.string().optional().default("SAR"),
			displayLanguage: z.string().optional().default("ar"),
			classification: z.array(z.string()).optional().default([]),
			// الضريبة
			taxNumber: z.string().optional(),
			crNumber: z.string().optional(),
			// أخرى
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		const client = await createClient({
			organizationId: input.organizationId,
			createdById: context.user.id,
			clientType: input.clientType,
			firstName: input.firstName,
			lastName: input.lastName,
			businessName: input.businessName,
			name: input.name,
			company: input.company,
			phone: input.phone,
			mobile: input.mobile,
			email: input.email || undefined,
			address: input.address,
			streetAddress1: input.streetAddress1,
			streetAddress2: input.streetAddress2,
			city: input.city,
			region: input.region,
			postalCode: input.postalCode,
			country: input.country,
			secondaryAddress: input.secondaryAddress,
			code: input.code,
			currency: input.currency,
			displayLanguage: input.displayLanguage,
			classification: input.classification,
			taxNumber: input.taxNumber,
			crNumber: input.crNumber,
			notes: input.notes,
		});

		return client;
	});
