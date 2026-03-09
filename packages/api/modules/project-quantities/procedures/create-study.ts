import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const createStudy = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/quantities/studies",
		tags: ["Project Quantities"],
		summary: "Create a new cost study linked to a project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			name: z.string().optional(),
			projectType: z.string().default("villa"),
			landArea: z.number().default(0),
			buildingArea: z.number().default(0),
			numberOfFloors: z.number().int().default(1),
			finishingLevel: z.string().default("standard"),
			overheadPercent: z.number().min(0).max(100).optional(),
			profitPercent: z.number().min(0).max(100).optional(),
			contingencyPercent: z.number().min(0).max(100).optional(),
			vatIncluded: z.boolean().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		const { project } = await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "create" },
		);

		const studyName = input.name || `دراسة كميات - ${project.name}`;

		const study = await db.costStudy.create({
			data: {
				organizationId: input.organizationId,
				createdById: context.user.id,
				projectId: input.projectId,
				name: studyName,
				projectType: input.projectType,
				landArea: input.landArea,
				buildingArea: input.buildingArea,
				numberOfFloors: input.numberOfFloors,
				finishingLevel: input.finishingLevel,
				...(input.overheadPercent !== undefined && {
					overheadPercent: input.overheadPercent,
				}),
				...(input.profitPercent !== undefined && {
					profitPercent: input.profitPercent,
				}),
				...(input.contingencyPercent !== undefined && {
					contingencyPercent: input.contingencyPercent,
				}),
				...(input.vatIncluded !== undefined && {
					vatIncluded: input.vatIncluded,
				}),
			},
		});

		return {
			id: study.id,
			name: study.name,
			projectId: study.projectId,
			totalCost: Number(study.totalCost),
			createdAt: study.createdAt,
		};
	});
