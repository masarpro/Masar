// Organization Finance Settings Procedures
// إعدادات المالية للمؤسسة (الشعار، البيانات البنكية، إلخ)

import {
	getOrganizationFinanceSettings,
	getOrCreateOrganizationFinanceSettings,
	updateOrganizationFinanceSettings,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import {
	MAX_NAME, MAX_DESC, MAX_CODE, MAX_PHONE, MAX_ADDRESS, MAX_URL,
	idString, optionalTrimmed, percentage, dayCount,
} from "../../../lib/validation-constants";

/**
 * Get organization finance settings
 */
export const getOrgFinanceSettingsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/settings",
		tags: ["Finance", "Settings"],
		summary: "Get organization finance settings",
	})
	.input(
		z.object({
			organizationId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		// Get or create settings to ensure they always exist
		const settings = await getOrCreateOrganizationFinanceSettings(
			input.organizationId,
		);

		return {
			...settings,
			defaultVatPercent: Number(settings.defaultVatPercent),
		};
	});

/**
 * Update organization finance settings
 */
export const updateOrgFinanceSettingsProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/finance/settings",
		tags: ["Finance", "Settings"],
		summary: "Update organization finance settings",
	})
	.input(
		z.object({
			organizationId: idString(),
			// Company info
			companyNameAr: optionalTrimmed(MAX_NAME),
			companyNameEn: optionalTrimmed(MAX_NAME),
			logo: z.string().trim().max(MAX_URL).optional(),
			address: optionalTrimmed(MAX_ADDRESS),
			addressEn: optionalTrimmed(MAX_ADDRESS),
			// National address fields
			buildingNumber: z.string().trim().max(20).optional(),
			street: optionalTrimmed(MAX_ADDRESS),
			secondaryNumber: z.string().trim().max(20).optional(),
			postalCode: z.string().trim().max(20).optional(),
			city: optionalTrimmed(MAX_NAME),
			phone: z.string().trim().max(MAX_PHONE).optional(),
			email: z.string().trim().email().max(254).optional().or(z.literal("")),
			website: z.string().trim().max(MAX_URL).optional(),
			taxNumber: z.string().trim().max(MAX_CODE).optional(),
			commercialReg: z.string().trim().max(MAX_CODE).optional(),
			// Bank details
			bankName: optionalTrimmed(MAX_NAME),
			bankNameEn: optionalTrimmed(MAX_NAME),
			accountName: optionalTrimmed(MAX_NAME),
			iban: z.string().trim().max(34).optional(),
			accountNumber: z.string().trim().max(50).optional(),
			swiftCode: z.string().trim().max(11).optional(),
			// Print settings
			headerText: optionalTrimmed(MAX_DESC),
			footerText: optionalTrimmed(MAX_DESC),
			thankYouMessage: optionalTrimmed(MAX_DESC),
			// Tax & currency
			defaultVatPercent: percentage().optional(),
			defaultCurrency: z.string().trim().max(3).optional(),
			// Default terms
			defaultPaymentTerms: optionalTrimmed(MAX_DESC),
			defaultDeliveryTerms: optionalTrimmed(MAX_DESC),
			defaultWarrantyTerms: optionalTrimmed(MAX_DESC),
			quotationValidityDays: dayCount().min(1).max(365).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "settings",
		});

		const { organizationId, ...data } = input;

		// Filter out undefined values and empty strings for email
		const cleanData = Object.fromEntries(
			Object.entries(data).filter(([key, value]) => {
				if (key === "email" && value === "") return true; // Allow clearing email
				return value !== undefined;
			}),
		);

		const settings = await updateOrganizationFinanceSettings(
			organizationId,
			cleanData,
		);

		return {
			...settings,
			defaultVatPercent: Number(settings.defaultVatPercent),
		};
	});
