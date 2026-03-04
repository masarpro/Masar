import { db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const rfqEvaluate = subscriptionProcedure
	.route({
		method: "POST",
		path: "/procurement/rfq/{rfqId}/evaluate",
		tags: ["Procurement", "RFQ"],
		summary: "Evaluate vendor responses for an RFQ",
	})
	.input(
		z.object({
			organizationId: z.string(),
			rfqId: z.string(),
			evaluations: z.array(
				z.object({
					responseId: z.string(),
					technicalScore: z.number().min(0).max(10).optional(),
					priceScore: z.number().min(0).max(10).optional(),
					overallScore: z.number().min(0).max(10).optional(),
					evaluationNotes: z.string().optional(),
				}),
			),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "approve",
		});

		const rfq = await db.rFQ.findFirst({
			where: { id: input.rfqId, organizationId: input.organizationId },
		});
		if (!rfq) {
			throw new ORPCError("NOT_FOUND", {
				message: "طلب عرض السعر غير موجود",
			});
		}

		await db.$transaction(async (tx) => {
			for (const ev of input.evaluations) {
				await tx.rFQVendorResponse.update({
					where: { id: ev.responseId },
					data: {
						technicalScore: ev.technicalScore,
						priceScore: ev.priceScore,
						overallScore: ev.overallScore,
						evaluationNotes: ev.evaluationNotes,
					},
				});
			}

			await tx.rFQ.update({
				where: { id: input.rfqId },
				data: { status: "EVALUATED" },
			});
		});

		return { success: true };
	});
