// Organization Finance Settings Procedures
// إعدادات المالية للمؤسسة (الشعار، البيانات البنكية، إلخ)

import {
	getOrganizationFinanceSettings,
	getOrCreateOrganizationFinanceSettings,
	updateOrganizationFinanceSettings,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

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
			organizationId: z.string(),
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

		return settings;
	});

/**
 * Update organization finance settings
 */
export const updateOrgFinanceSettingsProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/finance/settings",
		tags: ["Finance", "Settings"],
		summary: "Update organization finance settings",
	})
	.input(
		z.object({
			organizationId: z.string(),
			// Company info
			companyNameAr: z.string().optional(),
			companyNameEn: z.string().optional(),
			logo: z.string().optional(),
			address: z.string().optional(),
			addressEn: z.string().optional(),
			phone: z.string().optional(),
			email: z.string().email().optional().or(z.literal("")),
			website: z.string().optional(),
			taxNumber: z.string().optional(),
			commercialReg: z.string().optional(),
			// Bank details
			bankName: z.string().optional(),
			bankNameEn: z.string().optional(),
			accountName: z.string().optional(),
			iban: z.string().optional(),
			accountNumber: z.string().optional(),
			swiftCode: z.string().optional(),
			// Print settings
			headerText: z.string().optional(),
			footerText: z.string().optional(),
			thankYouMessage: z.string().optional(),
			// Tax & currency
			defaultVatPercent: z.number().min(0).max(100).optional(),
			defaultCurrency: z.string().optional(),
			// Default terms
			defaultPaymentTerms: z.string().optional(),
			defaultDeliveryTerms: z.string().optional(),
			defaultWarrantyTerms: z.string().optional(),
			quotationValidityDays: z.number().min(1).max(365).optional(),
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

		return settings;
	});
