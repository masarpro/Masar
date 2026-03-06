import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="rounded-xl border border-border p-6 space-y-3">
				<Skeleton className="h-6 w-48" />
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-3 w-full rounded-full" />
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="rounded-xl border border-border p-5 space-y-3">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-8 w-28" />
					</div>
				))}
			</div>
			<div className="rounded-xl border border-border p-6 space-y-4">
				<Skeleton className="h-5 w-36" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />
			</div>
		</div>
	);
}
