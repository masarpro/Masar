"use client";

import { createContext, useContext } from "react";

/**
 * Context to share the owner portal session token across pages.
 * When a session token is available, API calls should prefer it over the URL token.
 */
export const OwnerSessionContext = createContext<string | null>(null);

/**
 * Returns the session token if available, otherwise null.
 * Pages should use this to get the auth credential for API calls.
 */
export function useOwnerSession() {
	return useContext(OwnerSessionContext);
}

/**
 * The session cookie MUST be scoped per access token. A single shared cookie
 * (one name + path=/owner) leaks the session of one link into every other
 * owner link: opening a freshly-created (valid) link while a stale session
 * from a revoked/expired/different link is still in the cookie would send that
 * stale session, resolve to REVOKED/EXPIRED, and render "invalid link" even
 * though the URL token is perfectly valid.
 *
 * We therefore key the cookie name AND its path by the URL token so each link
 * keeps its own isolated session.
 */
const COOKIE_PREFIX = "owner-portal-session-";

function cookieName(token: string): string {
	return `${COOKIE_PREFIX}${token}`;
}

/** Escape characters that are special in a RegExp. */
function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getSessionFromCookie(token: string): string | null {
	if (typeof document === "undefined") return null;
	const name = escapeRegExp(cookieName(token));
	// NOTE: the whitespace class must be "\\s" so the compiled RegExp contains
	// "\s" — a bare "\s" inside a template literal collapses to "s".
	const match = document.cookie.match(
		new RegExp(`(?:^|;\\s*)${name}=([^;]*)`),
	);
	return match ? decodeURIComponent(match[1]) : null;
}

export function setSessionCookie(
	token: string,
	sessionToken: string,
	expiresAt: string,
) {
	const expires = new Date(expiresAt).toUTCString();
	document.cookie = `${cookieName(token)}=${encodeURIComponent(sessionToken)}; path=/owner/${token}; expires=${expires}; SameSite=Lax; Secure`;
}

export function clearSessionCookie(token: string) {
	if (typeof document === "undefined") return;
	document.cookie = `${cookieName(token)}=; path=/owner/${token}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
}
