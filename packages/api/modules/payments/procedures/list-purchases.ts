import {
	getPurchasesByOrganizationId,
	getPurchasesByUserId,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const listPurchases = protectedProcedure
	.route({
		method: "GET",
		path: "/payments/purchases",
		tags: ["Payments"],
		summary: "Get purchases",
		description:
			"Get all purchases of the current user or the provided organization",
	})
	.input(
		z.object({
			organizationId: z.string().nullish(),
		}),
	)
	.handler(async ({ input: { organizationId }, context: { user } }) => {
		if (organizationId) {
			await verifyOrganizationAccess(organizationId, user.id);

			const purchases =
				await getPurchasesByOrganizationId(organizationId);

			return { purchases };
		}

		const purchases = await getPurchasesByUserId(user.id);

		return { purchases };
	});
