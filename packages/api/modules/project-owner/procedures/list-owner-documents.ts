import { listDocuments } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { rateLimitToken } from "../../../lib/rate-limit";
import { resolveOwnerContext, throwOwnerTokenError } from "../helpers";

export const listOwnerDocumentsProcedure = publicProcedure
	.route({
		method: "GET",
		path: "/owner-portal/documents",
		tags: ["Owner Portal"],
		summary: "List project documents for the owner portal (read-only)",
	})
	.input(
		z
			.object({
				token: z.string().trim().min(1).max(200).optional(),
				sessionToken: z.string().trim().min(1).max(200).optional(),
				folderId: z.string().trim().max(100).optional(),
				uncategorized: z.boolean().optional(),
				search: z.string().trim().max(100).optional(),
				page: z.number().int().positive().optional().default(1),
				pageSize: z.number().int().positive().max(100).optional().default(50),
			})
			.refine((d) => d.token || d.sessionToken, {
				message: "token or sessionToken is required",
			}),
	)
	.handler(async ({ input }) => {
		await rateLimitToken(input.token || input.sessionToken!, "listOwnerDocuments");

		const result = await resolveOwnerContext(input);
		if (!result.ok) {
			throwOwnerTokenError(result.reason);
		}

		return listDocuments(result.organizationId, result.projectId, {
			folderId: input.folderId,
			uncategorized: input.uncategorized,
			search: input.search,
			page: input.page,
			pageSize: input.pageSize,
		});
	});
