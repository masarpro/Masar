import { ORPCError } from "@orpc/server";
import type { OwnerTokenFailReason } from "@repo/database";

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
