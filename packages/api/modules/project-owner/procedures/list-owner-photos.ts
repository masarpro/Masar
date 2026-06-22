import { getOwnerPortalPhotos } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { rateLimitToken } from "../../../lib/rate-limit";
import { resolveOwnerContext, throwOwnerTokenError } from "../helpers";

export const listOwnerPhotosProcedure = publicProcedure
	.route({
		method: "GET",
		path: "/owner-portal/photos",
		tags: ["Owner Portal"],
		summary: "List project photos for the owner portal (read-only)",
	})
	.input(
		z
			.object({
				token: z.string().trim().min(1).max(200).optional(),
				sessionToken: z.string().trim().min(1).max(200).optional(),
				limit: z.number().int().min(1).max(500).optional().default(300),
			})
			.refine((d) => d.token || d.sessionToken, {
				message: "token or sessionToken is required",
			}),
	)
	.handler(async ({ input }) => {
		await rateLimitToken(input.token || input.sessionToken!, "listOwnerPhotos");

		const result = await resolveOwnerContext(input);
		if (!result.ok) {
			throwOwnerTokenError(result.reason);
		}

		const { photos, coverPhotoId } = await getOwnerPortalPhotos(
			result.organizationId,
			result.projectId,
			{ limit: input.limit },
		);

		return { photos, coverPhotoId };
	});
