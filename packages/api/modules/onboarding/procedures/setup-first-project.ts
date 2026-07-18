import { z } from "zod";
import { db, createProject } from "@repo/database";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { enforceFeatureAccess } from "../../../lib/feature-gate";

export const setupFirstProject = subscriptionProcedure
	.route({
		method: "POST",
		path: "/onboarding/first-project",
		tags: ["Onboarding"],
		summary: "Create first project during onboarding",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectName: z.string().trim().min(2).max(200),
			ownerName: z.string().trim().max(200).optional(),
			estimatedBudget: z.number().nonnegative().max(999_999_999.99).optional(),
			city: z.string().trim().max(200).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "create",
		});

		// Enforce the same project-creation plan gate as the canonical
		// projects.create path, otherwise free-plan users could bypass the
		// 1-project limit via onboarding.
		await enforceFeatureAccess(
			input.organizationId,
			"projects.create",
			context.user,
		);

		const { organizationId, projectName, ownerName, estimatedBudget, city } =
			input;

		const project = await createProject({
			organizationId,
			createdById: context.user.id,
			name: projectName,
			clientName: ownerName,
			contractValue: estimatedBudget,
			location: city,
		});

		await db.onboardingProgress.upsert({
			where: { organizationId },
			update: { firstProjectDone: true },
			create: { organizationId, firstProjectDone: true },
		});

		return {
			...project,
			contractValue: project.contractValue
				? Number(project.contractValue)
				: null,
			progress: Number(project.progress),
		};
	});
