import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-32" />
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="rounded-xl border border-border p-6 space-y-3">
						<Skeleton className="h-6 w-24" />
						<Skeleton className="h-8 w-32" />
						<div className="space-y-2">
							{Array.from({ length: 4 }).map((_, j) => (
								<Skeleton key={j} className="h-4 w-full" />
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
