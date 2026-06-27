import { listDocumentFolders } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { rateLimitToken } from "../../../lib/rate-limit";
import { resolveOwnerContext, throwOwnerTokenError } from "../helpers";

export const listOwnerFoldersProcedure = publicProcedure
	.route({
		method: "GET",
		path: "/owner-portal/document-folders",
		tags: ["Owner Portal"],
		summary: "List project document folders for the owner portal (read-only)",
	})
	.input(
		z
			.object({
				token: z.string().trim().min(1).max(200).optional(),
				sessionToken: z.string().trim().min(1).max(200).optional(),
			})
			.refine((d) => d.token || d.sessionToken, {
				message: "token or sessionToken is required",
			}),
	)
	.handler(async ({ input }) => {
		await rateLimitToken(input.token || input.sessionToken!, "listOwnerFolders");

		const result = await resolveOwnerContext(input);
		if (!result.ok) {
			throwOwnerTokenError(result.reason);
		}

		return listDocumentFolders(result.organizationId, result.projectId);
	});
