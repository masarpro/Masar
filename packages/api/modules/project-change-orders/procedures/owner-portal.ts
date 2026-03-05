import { ORPCError } from "@orpc/server";
import {
	listChangeOrdersForOwner,
	getChangeOrderForOwner,
	getOwnerContextByToken,
} from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { rateLimitToken } from "../../../lib/rate-limit";
import { throwOwnerTokenError } from "../../project-owner/helpers";

/**
 * List change orders for owner portal (token-based access)
 */
export const listChangeOrdersForOwnerProcedure = publicProcedure
	.route({
		method: "GET",
		path: "/owner-portal/change-orders/list",
		tags: ["Owner Portal"],
		summary: "List change orders for owner portal",
	})
	.input(
		z.object({
			token: z.string(),
			page: z.number().int().positive().optional(),
			pageSize: z.number().int().positive().max(100).optional(),
		}),
	)
	.handler(async ({ input }) => {
		// Rate limit before any DB work
		await rateLimitToken(input.token, "ownerListChangeOrders");

		// Validate token
		const result = await getOwnerContextByToken(input.token);

		if (!result.ok) {
			throwOwnerTokenError(result.reason);
		}

		return await listChangeOrdersForOwner(
			result.project.organizationId,
			result.project.id,
			{
				page: input.page,
				pageSize: input.pageSize,
			},
		);
	});

/**
 * Get a single change order for owner portal (token-based access)
 */
export const getChangeOrderForOwnerProcedure = publicProcedure
	.route({
		method: "GET",
		path: "/owner-portal/change-orders/{changeOrderId}",
		tags: ["Owner Portal"],
		summary: "Get a change order for owner portal",
	})
	.input(
		z.object({
			token: z.string(),
			changeOrderId: z.string(),
		}),
	)
	.handler(async ({ input }) => {
		// Rate limit before any DB work
		await rateLimitToken(input.token, "ownerGetChangeOrder");

		// Validate token
		const result = await getOwnerContextByToken(input.token);

		if (!result.ok) {
			throwOwnerTokenError(result.reason);
		}

		const changeOrder = await getChangeOrderForOwner(
			result.project.organizationId,
			result.project.id,
			input.changeOrderId,
		);

		if (!changeOrder) {
			throw new ORPCError("NOT_FOUND", { message: "أمر التغيير غير موجود" });
		}

		return changeOrder;
	});
