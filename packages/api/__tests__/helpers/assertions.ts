/**
 * Custom test assertions for oRPC error handling.
 *
 * Usage:
 *   await expectForbidden(somePromise)
 *   await expectNotFound(somePromise)
 */

import { expect } from "vitest";
import { ORPCError } from "@orpc/server";

type AnyORPCError = ORPCError<string, unknown>;

async function expectORPCError(
	promise: Promise<unknown>,
	code: string,
): Promise<AnyORPCError> {
	try {
		await promise;
		expect.unreachable(`Expected ORPCError with code ${code} but promise resolved`);
	} catch (err) {
		expect(err).toBeInstanceOf(ORPCError);
		const orpcErr = err as AnyORPCError;
		expect(orpcErr.code).toBe(code);
		return orpcErr;
	}
	// Unreachable but TypeScript needs it
	throw new Error("unreachable");
}

export async function expectForbidden(promise: Promise<unknown>): Promise<AnyORPCError> {
	return expectORPCError(promise, "FORBIDDEN");
}

export async function expectNotFound(promise: Promise<unknown>): Promise<AnyORPCError> {
	return expectORPCError(promise, "NOT_FOUND");
}

export async function expectUnauthorized(promise: Promise<unknown>): Promise<AnyORPCError> {
	return expectORPCError(promise, "UNAUTHORIZED");
}

export async function expectBadRequest(promise: Promise<unknown>): Promise<AnyORPCError> {
	return expectORPCError(promise, "BAD_REQUEST");
}

export async function expectConflict(promise: Promise<unknown>): Promise<AnyORPCError> {
	return expectORPCError(promise, "CONFLICT");
}

export async function expectTooManyRequests(promise: Promise<unknown>): Promise<AnyORPCError> {
	return expectORPCError(promise, "TOO_MANY_REQUESTS");
}
