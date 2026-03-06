import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-40" />
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="rounded-xl border border-border p-4 space-y-3">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-6 w-28" />
					</div>
				))}
			</div>
			<div className="rounded-xl border border-border">
				<div className="flex gap-4 border-b border-border p-4">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-4 flex-1" />
					))}
				</div>
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="flex gap-4 border-b border-border p-4 last:border-0">
						{Array.from({ length: 6 }).map((_, j) => (
							<Skeleton key={j} className="h-4 flex-1" />
						))}
					</div>
				))}
			</div>
		</div>
	);
}
