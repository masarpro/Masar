import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-36" />
			</div>
			<Skeleton className="h-10 max-w-sm rounded-lg" />
			<div className="rounded-xl border border-border">
				<div className="flex gap-4 border-b border-border p-4">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-4 flex-1" />
					))}
				</div>
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} className="flex gap-4 border-b border-border p-4 last:border-0">
						<Skeleton className="h-8 w-8 rounded-full" />
						{Array.from({ length: 4 }).map((_, j) => (
							<Skeleton key={j} className="h-4 flex-1" />
						))}
					</div>
				))}
			</div>
		</div>
	);
}
