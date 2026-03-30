import { z } from "zod";
import { db, createProject } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const setupFirstProject = protectedProcedure
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
