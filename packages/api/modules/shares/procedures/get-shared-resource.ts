import { ORPCError } from "@orpc/server";
import { getShareLinkByToken, getSharedResourceData, db } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";

export const getSharedResourceProcedure = publicProcedure
	.route({
		method: "GET",
		path: "/shares/resource/{token}",
		tags: ["Shares"],
		summary: "Get a shared resource by token (public endpoint)",
	})
	.input(
		z.object({
			token: z.string(),
		}),
	)
	.handler(async ({ input }) => {
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
