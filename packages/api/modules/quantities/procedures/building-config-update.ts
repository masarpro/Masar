import { ORPCError } from "@orpc/server";
import { updateBuildingConfig, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const buildingConfigUpdate = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/{costStudyId}/building-config",
		tags: ["Quantities"],
		summary: "Update building configuration",
	})
	.input(
		z.object({
			organizationId: z.string(),
			costStudyId: z.string(),
			buildingConfig: z.object({
				totalLandArea: z.number(),
				buildingPerimeter: z.number(),
				floors: z.array(
					z.object({
						id: z.string(),
						name: z.string(),
						area: z.number(),
						height: z.number(),
						sortOrder: z.number(),
						isRepeated: z.boolean().default(false),
						repeatCount: z.number().default(1),
						floorType: z.enum([
							"BASEMENT",
							"GROUND",
							"UPPER",
							"ANNEX",
							"ROOF",
							"MEZZANINE",
						]),
					}),
				),
			}),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		const study = await getCostStudyById(input.costStudyId, input.organizationId);
		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: "دراسة التكلفة غير موجودة",
			});
		}

		const updated = await updateBuildingConfig(
			input.costStudyId,
			input.organizationId,
			input.buildingConfig,
		);

		return { success: true, buildingConfig: updated.buildingConfig };
	});
