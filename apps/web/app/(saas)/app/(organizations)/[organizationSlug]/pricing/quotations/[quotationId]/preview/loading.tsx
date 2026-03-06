import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-4 w-24" />
				<div className="flex gap-2">
					<Skeleton className="h-10 w-28 rounded-lg" />
					<Skeleton className="h-10 w-28 rounded-lg" />
				</div>
			</div>
			<div className="rounded-xl border border-border p-8 space-y-6">
				<div className="flex justify-between">
					<Skeleton className="h-12 w-32" />
					<div className="space-y-1">
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-4 w-32" />
					</div>
				</div>
				<Skeleton className="h-px w-full" />
				<div className="rounded-lg border border-border">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex gap-4 border-b border-border p-3 last:border-0">
							{Array.from({ length: 4 }).map((_, j) => (
								<Skeleton key={j} className="h-4 flex-1" />
							))}
						</div>
					))}
				</div>
				<div className="flex justify-end">
					<Skeleton className="h-8 w-40" />
				</div>
			</div>
		</div>
	);
}
