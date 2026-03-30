import { z } from "zod";
import { db } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const getProgress = protectedProcedure
	.route({
		method: "GET",
		path: "/onboarding/progress",
		tags: ["Onboarding"],
		summary: "Get onboarding progress for an organization",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id);

		let progress = await db.onboardingProgress.findUnique({
			where: { organizationId: input.organizationId },
		});

		if (!progress) {
			progress = await db.onboardingProgress.create({
				data: { organizationId: input.organizationId },
			});
		}

		return progress;
	});
