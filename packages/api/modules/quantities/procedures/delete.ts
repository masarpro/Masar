import { ORPCError } from "@orpc/server";
import { deleteCostStudy as deleteCostStudyQuery } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const deleteCostStudy = protectedProcedure
	.route({
		method: "DELETE",
		path: "/quantities/{id}",
		tags: ["Quantities"],
		summary: "Delete cost study",
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
			{ section: "pricing", action: "studies" },
		);

		try {
			await deleteCostStudyQuery(input.id, input.organizationId);
			return { success: true };
		} catch {
			throw new ORPCError("NOT_FOUND", {
				message: "دراسة التكلفة غير موجودة",
			});
		}
	});
