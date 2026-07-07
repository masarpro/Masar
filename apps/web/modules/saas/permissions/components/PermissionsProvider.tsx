"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useOrganizationListQuery } from "@saas/organizations/lib/api";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { type ReactNode, useMemo } from "react";
import { PermissionsContext } from "../lib/permissions-context";

// Permissions rarely change mid-session; the permission editor invalidates
// this query explicitly after saving (and the server invalidates its own cache
// via invalidateAccessCache), so a long staleTime is safe.
const PERMISSIONS_STALE_TIME = 15 * 60 * 1000;

/**
 * Provides the current member's EFFECTIVE permissions to the client tree.
 * The query key includes organizationId (via oRPC input) so switching
 * organizations can never leak cached permissions cross-tenant.
 *
 * UX layer only — server-side authorization (verifyOrganizationAccess)
 * remains the actual guard on every procedure.
 */
export function PermissionsProvider({ children }: { children: ReactNode }) {
	const { activeOrganization } = useActiveOrganization();
	const params = useParams();
	const organizationSlug =
		typeof params?.organizationSlug === "string"
			? params.organizationSlug
			: undefined;

	// Waterfall breaker: don't wait for the active-organization query to
	// resolve — the organization list is hydrated by the (saas) layout above
	// this provider, so the slug→id lookup is available immediately and the
	// permissions query fires in parallel with the active-org query.
	const { data: organizationList } = useOrganizationListQuery();
	const organizationId =
		activeOrganization?.id ??
		(organizationSlug
			? organizationList?.find((org) => org.slug === organizationSlug)?.id
			: undefined);

	const { data, isLoading } = useQuery({
		...orpc.permissions.getMine.queryOptions({
			input: { organizationId: organizationId ?? "" },
		}),
		enabled: !!organizationId,
		staleTime: PERMISSIONS_STALE_TIME,
	});

	const value = useMemo(
		() => ({
			permissions: data?.permissions ?? null,
			roleType: data?.roleType ?? null,
			isOwner: data?.isOwner ?? false,
			isLoading: !!organizationId && isLoading,
		}),
		[data, isLoading, organizationId],
	);

	return (
		<PermissionsContext.Provider value={value}>
			{children}
		</PermissionsContext.Provider>
	);
}
