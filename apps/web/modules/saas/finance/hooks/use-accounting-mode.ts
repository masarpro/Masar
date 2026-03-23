"use client";

import { useCallback, useSyncExternalStore } from "react";

function getStorageKey(orgId: string) {
	return `masar_accounting_mode_${orgId}`;
}

function getSnapshot(orgId: string): boolean {
	if (typeof window === "undefined") return false;
	return localStorage.getItem(getStorageKey(orgId)) === "true";
}

function subscribe(callback: () => void) {
	window.addEventListener("storage", callback);
	// Custom event for same-tab updates
	window.addEventListener("accounting-mode-changed", callback);
	return () => {
		window.removeEventListener("storage", callback);
		window.removeEventListener("accounting-mode-changed", callback);
	};
}

export function useAccountingMode(organizationId: string) {
	const isEnabled = useSyncExternalStore(
		subscribe,
		() => getSnapshot(organizationId),
		() => false, // server snapshot
	);

	const toggle = useCallback(() => {
		const key = getStorageKey(organizationId);
		const current = localStorage.getItem(key) === "true";
		localStorage.setItem(key, String(!current));
		window.dispatchEvent(new Event("accounting-mode-changed"));
	}, [organizationId]);

	const enable = useCallback(() => {
		localStorage.setItem(getStorageKey(organizationId), "true");
		window.dispatchEvent(new Event("accounting-mode-changed"));
	}, [organizationId]);

	return { isEnabled, toggle, enable };
}
