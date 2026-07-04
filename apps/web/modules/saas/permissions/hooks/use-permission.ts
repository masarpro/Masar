"use client";

import type { Permissions } from "@repo/database/prisma/permissions";
import { useContext, useMemo } from "react";
import { PermissionsContext } from "../lib/permissions-context";

export interface UsePermissionResult {
	/** True when the member has the given permission. OWNER always passes. */
	can: (section: keyof Permissions, action: string) => boolean;
	/** True when the member has ANY permission inside the section. OWNER always passes. */
	canAny: (section: keyof Permissions) => boolean;
	permissions: Permissions | null;
	roleType: string | null;
	isOwner: boolean;
	isLoading: boolean;
}

/**
 * Client-side permission checks for UI gating (menus, pages, widgets).
 * Deny-by-default while permissions are loading — consumers that need to
 * avoid a flash should check `isLoading` first.
 */
export function usePermission(): UsePermissionResult {
	const ctx = useContext(PermissionsContext);

	const permissions = ctx?.permissions ?? null;
	const roleType = ctx?.roleType ?? null;
	const isOwner = ctx?.isOwner ?? false;
	const isLoading = ctx?.isLoading ?? false;

	return useMemo(() => {
		const can = (section: keyof Permissions, action: string): boolean => {
			if (isOwner) return true;
			if (!permissions) return false;
			const sectionPerms = permissions[section] as unknown as
				| Record<string, boolean>
				| undefined;
			return sectionPerms?.[action] ?? false;
		};

		const canAny = (section: keyof Permissions): boolean => {
			if (isOwner) return true;
			if (!permissions) return false;
			const sectionPerms = permissions[section] as unknown as
				| Record<string, boolean>
				| undefined;
			if (!sectionPerms) return false;
			return Object.values(sectionPerms).some(Boolean);
		};

		return { can, canAny, permissions, roleType, isOwner, isLoading };
	}, [permissions, roleType, isOwner, isLoading]);
}
