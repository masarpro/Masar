import { z } from "zod";
import { db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const setDefaultTemplate = protectedProcedure
	.route({
		method: "POST",
		path: "/onboarding/default-template",
		tags: ["Onboarding"],
		summary: "Set default finance template during onboarding",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			templateId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id);

		const { organizationId, templateId } = input;

		// Verify template belongs to org
		const template = await db.financeTemplate.findFirst({
			where: { id: templateId, organizationId },
		});

		if (!template) {
			throw new ORPCError("NOT_FOUND", { message: "القالب غير موجود" });
		}

		// Remove default from all templates of same type
		await db.financeTemplate.updateMany({
			where: { organizationId, templateType: template.templateType, isDefault: true },
			data: { isDefault: false },
		});

		// Set chosen template as default
		const updated = await db.financeTemplate.update({
			where: { id: templateId },
			data: { isDefault: true },
		});

		await db.onboardingProgress.upsert({
			where: { organizationId },
			update: { templateDone: true },
			create: { organizationId, templateDone: true },
		});

		return updated;
	});
