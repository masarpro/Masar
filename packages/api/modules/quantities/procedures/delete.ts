import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { deleteCostStudy as deleteCostStudyQuery } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { db } from "@repo/database/prisma/client";

export const deleteCostStudy = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/quantities/{id}",
		tags: ["Quantities"],
		summary: "Delete cost study",
	})
	.input(
		z.object({
			id: z.string().trim().max(100),
			organizationId: z.string().trim().max(100),
			confirmDelete: z.boolean().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		// Check if the study has items before allowing delete
		const study = await db.costStudy.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			select: {
				id: true,
				convertedProjectId: true,
				generatedQuotationId: true,
				_count: {
					select: {
						structuralItems: true,
						finishingItems: true,
						mepItems: true,
						costingItems: true,
						manualItems: true,
					},
				},
			},
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}

		const totalItems = study._count.structuralItems + study._count.finishingItems
			+ study._count.mepItems + study._count.costingItems + study._count.manualItems;

		if (totalItems > 0 && !input.confirmDelete) {
			throw new ORPCError("BAD_REQUEST", {
				message: `هذه الدراسة تحتوي على ${totalItems} عنصر. يرجى تأكيد الحذف`,
			});
		}

		try {
			await deleteCostStudyQuery(input.id, input.organizationId);
			return { success: true };
		} catch {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}
	});
