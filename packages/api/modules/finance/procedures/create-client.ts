import { createClient } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import {
	MAX_NAME, MAX_DESC, MAX_CODE, MAX_PHONE, MAX_ADDRESS,
	idString, optionalTrimmed,
} from "../../../lib/validation-constants";

// نوع العميل
const clientTypeEnum = z.enum(["INDIVIDUAL", "COMMERCIAL"]);

// العنوان الثانوي
const secondaryAddressSchema = z
	.object({
		streetAddress1: z.string().trim().max(MAX_ADDRESS).optional(),
		streetAddress2: z.string().trim().max(MAX_ADDRESS).optional(),
		city: z.string().trim().max(MAX_NAME).optional(),
		region: z.string().trim().max(MAX_NAME).optional(),
		postalCode: z.string().trim().max(20).optional(),
		country: z.string().trim().max(3).optional(),
	})
	.optional();

export const createClientProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/clients",
		tags: ["Finance", "Clients"],
		summary: "Create a new client",
	})
	.input(
		z.object({
			organizationId: idString(),
			// نوع العميل
			clientType: clientTypeEnum.optional().default("INDIVIDUAL"),
			// الأسماء
			firstName: optionalTrimmed(MAX_NAME),
			lastName: optionalTrimmed(MAX_NAME),
			businessName: optionalTrimmed(MAX_NAME),
			name: z.string().trim().min(1, "اسم العميل مطلوب").max(MAX_NAME),
			company: optionalTrimmed(MAX_NAME),
			// الاتصال
			phone: z.string().trim().max(MAX_PHONE).optional(),
			mobile: z.string().trim().max(MAX_PHONE).optional(),
			email: z.string().trim().email().max(254).optional().or(z.literal("")),
			// العنوان
			address: optionalTrimmed(MAX_ADDRESS),
			streetAddress1: optionalTrimmed(MAX_ADDRESS),
			streetAddress2: optionalTrimmed(MAX_ADDRESS),
			city: optionalTrimmed(MAX_NAME),
			region: optionalTrimmed(MAX_NAME),
			postalCode: z.string().trim().max(20).optional(),
			country: z.string().trim().max(3).optional().default("SA"),
			secondaryAddress: secondaryAddressSchema,
			// الحساب
			code: z.string().trim().max(MAX_CODE).optional(),
			currency: z.string().trim().max(3).optional().default("SAR"),
			displayLanguage: z.string().trim().max(10).optional().default("ar"),
			classification: z.array(z.string().trim().max(MAX_NAME)).optional().default([]),
			// الضريبة
			taxNumber: z.string().trim().max(MAX_CODE).optional(),
			crNumber: z.string().trim().max(MAX_CODE).optional(),
			// أخرى
			notes: optionalTrimmed(MAX_DESC),
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
