import { z } from "zod";
import { db } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const completeWizard = protectedProcedure
	.route({
		method: "POST",
		path: "/onboarding/complete",
		tags: ["Onboarding"],
		summary: "Mark onboarding wizard as completed",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			skippedSteps: z.array(z.enum(["inviteTeam"])).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id);

		const { organizationId, skippedSteps } = input;

		await db.onboardingProgress.upsert({
			where: { organizationId },
			update: {
				wizardCompleted: true,
				wizardCompletedAt: new Date(),
				wizardSkippedSteps: skippedSteps || [],
			},
			create: {
				organizationId,
				wizardCompleted: true,
				wizardCompletedAt: new Date(),
				wizardSkippedSteps: skippedSteps || [],
			},
		});

		await db.user.update({
			where: { id: context.user.id },
			data: { onboardingComplete: true },
		});

		return { success: true };
	});
