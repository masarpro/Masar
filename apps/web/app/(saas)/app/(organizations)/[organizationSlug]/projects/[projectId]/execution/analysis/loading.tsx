import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-48" />
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="rounded-xl border border-border p-5 space-y-3">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-10 w-36" />
					</div>
				))}
			</div>
			<div className="rounded-xl border border-border p-6 space-y-4">
				<Skeleton className="h-5 w-32" />
				<Skeleton className="h-64 w-full rounded-lg" />
			</div>
		</div>
	);
}
