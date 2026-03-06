import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="rounded-xl border border-border p-6 space-y-4">
				<Skeleton className="h-5 w-32" />
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<Skeleton className="h-6 w-24" />
						<Skeleton className="h-4 w-48" />
					</div>
					<Skeleton className="h-9 w-28 rounded-lg" />
				</div>
			</div>
			<div className="rounded-xl border border-border p-6 space-y-4">
				<Skeleton className="h-5 w-28" />
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{Array.from({ length: 2 }).map((_, i) => (
						<div key={i} className="rounded-xl border border-border p-6 space-y-3">
							<Skeleton className="h-6 w-24" />
							<Skeleton className="h-8 w-32" />
							<div className="space-y-2">
								{Array.from({ length: 4 }).map((_, j) => (
									<Skeleton key={j} className="h-4 w-full" />
								))}
							</div>
							<Skeleton className="h-10 w-full rounded-lg" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
