import { ORPCError } from "@orpc/server";
import { duplicateCostStudy as duplicateCostStudyQuery } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const duplicate = protectedProcedure
	.route({
		method: "POST",
		path: "/quantities/{id}/duplicate",
		tags: ["Quantities"],
		summary: "Duplicate cost study",
	})
	.input(
		z.object({
			id: z.string(),
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "create" },
		);

		try {
			const study = await duplicateCostStudyQuery(
				input.id,
				input.organizationId,
				context.user.id,
			);

			return {
				...study,
				landArea: Number(study.landArea),
				buildingArea: Number(study.buildingArea),
				structuralCost: Number(study.structuralCost),
				finishingCost: Number(study.finishingCost),
				mepCost: Number(study.mepCost),
				laborCost: Number(study.laborCost),
				overheadPercent: Number(study.overheadPercent),
				profitPercent: Number(study.profitPercent),
				contingencyPercent: Number(study.contingencyPercent),
				totalCost: Number(study.totalCost),
			};
		} catch {
			throw new ORPCError("NOT_FOUND", {
				message: "دراسة التكلفة غير موجودة",
			});
		}
	});
