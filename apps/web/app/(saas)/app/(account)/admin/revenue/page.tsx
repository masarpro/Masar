"use client";

import { AdminRevenueSkeleton } from "@saas/shared/components/skeletons";
import dynamic from "next/dynamic";

const AdminRevenue = dynamic(
	() =>
		import("@saas/admin/component/revenue/AdminRevenue").then((m) => ({
			default: m.AdminRevenue,
		})),
	{
		loading: () => <AdminRevenueSkeleton />,
		ssr: false,
	},
);

export default function AdminRevenuePage() {
	return <AdminRevenue />;
}
