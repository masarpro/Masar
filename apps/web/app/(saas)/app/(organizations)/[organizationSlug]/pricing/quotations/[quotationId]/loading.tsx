import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-48" />
				<div className="flex gap-2">
					<Skeleton className="h-10 w-24 rounded-lg" />
					<Skeleton className="h-10 w-28 rounded-lg" />
				</div>
			</div>
			<div className="rounded-xl border border-border p-6 space-y-5">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-full rounded-lg" />
					</div>
				))}
				<div className="rounded-lg border border-border">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="flex gap-4 border-b border-border p-3 last:border-0">
							{Array.from({ length: 4 }).map((_, j) => (
								<Skeleton key={j} className="h-4 flex-1" />
							))}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
