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
			organizationId: z.string(),
			projectName: z.string().min(2),
			ownerName: z.string().optional(),
			estimatedBudget: z.number().optional(),
			city: z.string().optional(),
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
