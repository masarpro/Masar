import { ORPCError } from "@orpc/server";
import {
	listChangeOrdersForOwner,
	getChangeOrderForOwner,
	getOwnerContextByToken,
} from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";

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
		// Validate token
		const context = await getOwnerContextByToken(input.token);

		if (!context) {
			throw new ORPCError("UNAUTHORIZED", { message: "رمز الوصول غير صالح" });
		}

		const result = await listChangeOrdersForOwner(
			context.project.organizationId,
			context.project.id,
			{
				page: input.page,
				pageSize: input.pageSize,
			},
		);

		return result;
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
		// Validate token
		const context = await getOwnerContextByToken(input.token);

		if (!context) {
			throw new ORPCError("UNAUTHORIZED", { message: "رمز الوصول غير صالح" });
		}

		const changeOrder = await getChangeOrderForOwner(
			context.project.organizationId,
			context.project.id,
			input.changeOrderId,
		);

		if (!changeOrder) {
			throw new ORPCError("NOT_FOUND", { message: "أمر التغيير غير موجود" });
		}

		return changeOrder;
	});
