"use client";

import type { Permissions } from "@repo/database/prisma/permissions";
import { Dashboard } from "@saas/dashboard/components";

// Static import (not next/dynamic): the Dashboard is the homepage's main
// content and is always needed, and the page already server-prefetches its
// queries + SSRs it. A dynamic() wrapper added a client-side lazy boundary
// whose `loading` skeleton flashed OVER the already-SSR'd content during chunk
// hydration (real content → skeleton → content = the "flutter"). Bundling it
// statically into this homepage-only client chunk removes that flash without
// changing the total JS the homepage loads.
// (Chart-heavy FinancePanel inside Dashboard keeps its own ssr:false split.)

export interface InitialPermissions {
	permissions: Permissions | null;
	roleType: string | null;
	isOwner: boolean;
}

export default function OrganizationStart({
	organizationId,
	organizationSlug,
	initialPermissions,
}: {
	organizationId?: string;
	organizationSlug?: string;
	initialPermissions?: InitialPermissions;
}) {
	return (
		<Dashboard
			organizationId={organizationId}
			organizationSlug={organizationSlug}
			initialPermissions={initialPermissions}
		/>
	);
}
