import dynamic from "next/dynamic";
import { Skeleton } from "@ui/components/skeleton";

const AdminRevenue = dynamic(
	() =>
		import("@saas/admin/component/revenue/AdminRevenue").then(
			(mod) => mod.AdminRevenue,
		),
	{
		ssr: false,
		loading: () => (
			<div className="space-y-6">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-28 rounded-lg" />
					))}
				</div>
				<Skeleton className="h-80 rounded-lg" />
			</div>
		),
	},
);

export default function AdminRevenuePage() {
	return <AdminRevenue />;
}
