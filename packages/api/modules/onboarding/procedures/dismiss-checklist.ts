import { z } from "zod";
import { db } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const dismissChecklist = protectedProcedure
	.route({
		method: "POST",
		path: "/onboarding/dismiss-checklist",
		tags: ["Onboarding"],
		summary: "Dismiss the onboarding checklist from dashboard",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id);

		await db.onboardingProgress.update({
			where: { organizationId: input.organizationId },
			data: {
				checklistDismissed: true,
				checklistDismissedAt: new Date(),
			},
		});

		return { success: true };
	});
