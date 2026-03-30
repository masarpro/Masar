import { ORPCError } from "@orpc/client";
import { createAiChat, db } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { enforceFeatureAccess } from "../../../lib/feature-gate";

export const createChat = subscriptionProcedure
	.route({
		method: "POST",
		path: "/ai/chats",
		tags: ["AI"],
		summary: "Create chat",
		description: "Create a new chat",
	})
	.input(
		z.object({
			title: z.string().trim().max(200).optional(),
			organizationId: z.string().trim().max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Strict rate limit for AI chat creation (5/min)
		const { rateLimitChecker, RATE_LIMITS } = await import("../../../lib/rate-limit");
		await rateLimitChecker(context.user.id, "ai.chats.create", RATE_LIMITS.STRICT);

		const { title, organizationId } = input;
		const user = context.user;

		if (organizationId) {
			const membership = await verifyOrganizationMembership(
				organizationId,
				user.id,
			);

			if (!membership) {
				throw new ORPCError("FORBIDDEN");
			}

			// Feature gate: check AI chat limit
			await enforceFeatureAccess(organizationId, "ai.chat", user);
		}

		const chat = await createAiChat({
			title: title,
			organizationId,
			userId: user.id,
		});

		if (!chat) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}

		// Track AI chat usage for the organization
		if (organizationId) {
			await db.aiChatUsage.upsert({
				where: { organizationId },
				update: { totalChats: { increment: 1 } },
				create: { organizationId, totalChats: 1 },
			});
		}

		return { chat };
	});
