"use client";

import dynamic from "next/dynamic";

const AdminRevenue = dynamic(
	() =>
		import("@saas/admin/component/revenue/AdminRevenue").then((m) => ({
			default: m.AdminRevenue,
		})),
	{
		loading: () => (
			<div className="h-96 animate-pulse rounded-lg bg-muted" />
		),
		ssr: false,
	},
);

export default function AdminRevenuePage() {
	return <AdminRevenue />;
}
