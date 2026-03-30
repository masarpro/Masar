import { z } from "zod";
import { db } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const setupCompanyInfo = protectedProcedure
	.route({
		method: "POST",
		path: "/onboarding/company-info",
		tags: ["Onboarding"],
		summary: "Set up company info during onboarding",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			name: z.string().trim().min(2).max(200),
			commercialRegister: z.string().trim().max(50).optional(),
			taxNumber: z.string().trim().max(50).optional(),
			contractorClass: z.string().trim().max(50).optional(),
			address: z.string().trim().max(500).optional(),
			city: z.string().trim().max(200).optional(),
			phone: z.string().trim().max(20).optional(),
			logo: z.string().trim().max(2048).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "settings",
			action: "organization",
		});

		const { organizationId, ...companyData } = input;

		const org = await db.organization.update({
			where: { id: organizationId },
			data: {
				name: companyData.name,
				commercialRegister: companyData.commercialRegister || null,
				taxNumber: companyData.taxNumber || null,
				contractorClass: companyData.contractorClass || null,
				address: companyData.address || null,
				city: companyData.city || null,
				phone: companyData.phone || null,
				logo: companyData.logo || null,
			},
		});

		await db.onboardingProgress.upsert({
			where: { organizationId },
			update: {
				companyInfoDone: true,
				logoDone: !!companyData.logo,
			},
			create: {
				organizationId,
				companyInfoDone: true,
				logoDone: !!companyData.logo,
			},
		});

		return org;
	});
