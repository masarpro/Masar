import { ORPCError } from "@orpc/client";
import { createAiChat, db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { enforceFeatureAccess } from "../../../lib/feature-gate";

export const createChat = protectedProcedure
	.route({
		method: "POST",
		path: "/ai/chats",
		tags: ["AI"],
		summary: "Create chat",
		description: "Create a new chat",
	})
	.input(
		z.object({
			title: z.string().optional(),
			organizationId: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
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
