import { ORPCError } from "@orpc/server";
import { getShareLinkByToken, getSharedResourceData, db } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { enforceRateLimit, createIpRateLimitKey, RATE_LIMITS } from "../../../lib/rate-limit";

export const getSharedResourceProcedure = publicProcedure
	.route({
		method: "GET",
		path: "/shares/resource/{token}",
		tags: ["Shares"],
		summary: "Get a shared resource by token (public endpoint)",
	})
	.input(
		z.object({
			token: z.string().trim().max(200),
		}),
	)
	.handler(async ({ input, context }) => {
		// IP-based rate limiting to prevent token brute-force
		const ip = context.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
		await enforceRateLimit(createIpRateLimitKey(ip, "getSharedResource"), RATE_LIMITS.READ);

		// Get and validate share link
		const shareLink = await getShareLinkByToken(input.token);

		if (!shareLink) {
			throw new ORPCError("NOT_FOUND", {
				message: "Share link not found, revoked, or expired",
			});
		}

		// Get the resource data based on type
		const resourceData = await getSharedResourceData({
			organizationId: shareLink.organizationId,
			projectId: shareLink.projectId,
			resourceType: shareLink.resourceType,
			resourceId: shareLink.resourceId,
		});

		return {
			resourceType: shareLink.resourceType,
			resourceId: shareLink.resourceId,
			project: shareLink.project,
			expiresAt: shareLink.expiresAt,
			data: resourceData,
		};
	});
