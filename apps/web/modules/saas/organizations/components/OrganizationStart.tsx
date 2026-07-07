"use client";

import type { Permissions } from "@repo/database/prisma/permissions";
import { HomeDashboardSkeleton } from "@saas/shared/components/skeletons";
import dynamic from "next/dynamic";

// SSR enabled: with the page server-prefetching the dashboard queries and
// passing organization/permissions as props, the server renders real content
// at first paint instead of a skeleton until the JS chunk hydrates.
// (Chart-heavy FinancePanel inside Dashboard keeps its own ssr:false split.)
const Dashboard = dynamic(
	() =>
		import("@saas/dashboard/components").then((m) => ({
			default: m.Dashboard,
		})),
	{ loading: () => <HomeDashboardSkeleton /> },
);

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
