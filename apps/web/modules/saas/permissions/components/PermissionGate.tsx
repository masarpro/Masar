"use client";

import type { Permissions } from "@repo/database/prisma/permissions";
import type { ReactNode } from "react";
import { usePermission } from "../hooks/use-permission";
import { AccessDenied } from "./AccessDenied";

/**
 * Client-side page/content gate. Renders children only when the member has
 * the required permission, otherwise shows AccessDenied (or a custom
 * fallback). UX layer only — every RPC is still authorized server-side.
 *
 * If `action` is omitted, ANY permission inside the section passes.
 */
export function PermissionGate({
	section,
	action,
	fallback,
	children,
}: {
	section: keyof Permissions;
	action?: string;
	fallback?: ReactNode;
	children: ReactNode;
}) {
	const { can, canAny, isOwner, permissions, isLoading } = usePermission();

	// Permissions not resolved yet (first unhydrated paint) — render nothing
	// briefly instead of flashing AccessDenied at an authorized member.
	if (!isOwner && !permissions && isLoading) {
		return null;
	}

	const allowed =
		isOwner || (action ? can(section, action) : canAny(section));

	if (!allowed) {
		return <>{fallback ?? <AccessDenied />}</>;
	}

	return <>{children}</>;
}
