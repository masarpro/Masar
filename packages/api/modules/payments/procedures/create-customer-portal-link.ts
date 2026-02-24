import { ORPCError } from "@orpc/client";
import { getPurchaseById } from "@repo/database";
import { hasPermission } from "@repo/database/prisma/permissions";
import { logger } from "@repo/logs";
import { createCustomerPortalLink as createCustomerPortalLinkFn } from "@repo/payments";
import { z } from "zod";
import { localeMiddleware } from "../../../orpc/middleware/locale-middleware";
import { protectedProcedure } from "../../../orpc/procedures";
import { getUserPermissions } from "../../../lib/permissions/get-user-permissions";

export const createCustomerPortalLink = protectedProcedure
	.use(localeMiddleware)
	.route({
		method: "POST",
		path: "/payments/create-customer-portal-link",
		tags: ["Payments"],
		summary: "Create customer portal link",
		description:
			"Creates a customer portal link for the customer or team. If a purchase is provided, the link will be created for the customer of the purchase.",
	})
	.input(
		z.object({
			purchaseId: z.string(),
			redirectUrl: z.string().optional(),
		}),
	)
	.handler(
		async ({ input: { purchaseId, redirectUrl }, context: { user } }) => {
			const purchase = await getPurchaseById(purchaseId);

			if (!purchase) {
				throw new ORPCError("FORBIDDEN");
			}

			if (purchase.organizationId) {
				const permissions = await getUserPermissions(
					user.id,
					purchase.organizationId,
				);
				if (!hasPermission(permissions, "settings", "billing")) {
					throw new ORPCError("FORBIDDEN");
				}
			}

			if (purchase.userId && purchase.userId !== user.id) {
				throw new ORPCError("FORBIDDEN");
			}

			try {
				const customerPortalLink = await createCustomerPortalLinkFn({
					subscriptionId: purchase.subscriptionId ?? undefined,
					customerId: purchase.customerId,
					redirectUrl,
				});

				if (!customerPortalLink) {
					throw new ORPCError("INTERNAL_SERVER_ERROR");
				}

				return { customerPortalLink };
			} catch (e) {
				logger.error("Could not create customer portal link", e);
				throw new ORPCError("INTERNAL_SERVER_ERROR");
			}
		},
	);
