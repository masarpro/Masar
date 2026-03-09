import { ORPCError } from "@orpc/server";
import type { OwnerTokenFailReason, OwnerContextResult } from "@repo/database";
import { getOwnerContextByToken, getOwnerContextBySession } from "@repo/database";

/**
 * Throw an appropriate ORPCError based on token validation failure reason.
 * Uses distinct error codes so the frontend can differentiate between
 * expired tokens and invalid/revoked ones.
 */
export function throwOwnerTokenError(reason: OwnerTokenFailReason): never {
	switch (reason) {
		case "EXPIRED":
			throw new ORPCError("FORBIDDEN", {
				message: "TOKEN_EXPIRED",
			});
		case "REVOKED":
			throw new ORPCError("FORBIDDEN", {
				message: "TOKEN_REVOKED",
			});
		case "NOT_FOUND":
		default:
			throw new ORPCError("FORBIDDEN", {
				message: "TOKEN_INVALID",
			});
	}
}

/**
 * Resolve owner context from either a session token or a URL token.
 * Prefers session token when available.
 */
export async function resolveOwnerContext(input: {
	token?: string;
	sessionToken?: string;
}): Promise<OwnerContextResult> {
	if (input.sessionToken) {
		return getOwnerContextBySession(input.sessionToken);
	}
	if (input.token) {
		return getOwnerContextByToken(input.token);
	}
	return { ok: false, reason: "NOT_FOUND" };
}
