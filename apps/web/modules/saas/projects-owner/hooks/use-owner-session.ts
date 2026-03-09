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

const COOKIE_NAME = "owner-portal-session";

export function getSessionFromCookie(): string | null {
	if (typeof document === "undefined") return null;
	const match = document.cookie.match(
		new RegExp(`(?:^|;\s*)${COOKIE_NAME}=([^;]*)`),
	);
	return match ? decodeURIComponent(match[1]) : null;
}

export function setSessionCookie(sessionToken: string, expiresAt: string) {
	const expires = new Date(expiresAt).toUTCString();
	document.cookie = `${COOKIE_NAME}=${encodeURIComponent(sessionToken)}; path=/owner; expires=${expires}; SameSite=Lax; Secure`;
}
