import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-4 w-40" />
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="rounded-xl border border-border p-5 space-y-3">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-8 w-28" />
						<Skeleton className="h-3 w-24" />
					</div>
				))}
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="rounded-xl border border-border p-6 space-y-4">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-48 w-full rounded-lg" />
				</div>
				<div className="rounded-xl border border-border p-6 space-y-4">
					<Skeleton className="h-5 w-32" />
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex items-center gap-3">
							<Skeleton className="h-8 w-8 rounded-full" />
							<Skeleton className="h-4 w-32 flex-1" />
							<Skeleton className="h-4 w-20" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
