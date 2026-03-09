"use client";

import { HomeDashboardSkeleton } from "@saas/shared/components/skeletons";
import dynamic from "next/dynamic";

const Dashboard = dynamic(
	() =>
		import("@saas/dashboard/components").then((m) => ({
			default: m.Dashboard,
		})),
	{ loading: () => <HomeDashboardSkeleton />, ssr: false },
);

export default function OrganizationStart() {
	return <Dashboard />;
}
