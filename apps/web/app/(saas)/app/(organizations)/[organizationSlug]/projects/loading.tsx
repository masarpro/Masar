import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-10 w-36 rounded-lg" />
			</div>
			<Skeleton className="h-10 max-w-sm rounded-lg" />
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="rounded-xl border border-border p-5 space-y-3">
						<div className="flex items-center justify-between">
							<Skeleton className="h-6 w-32" />
							<Skeleton className="h-6 w-16 rounded-full" />
						</div>
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-2/3" />
						<div className="flex items-center gap-2 pt-2">
							<Skeleton className="h-2 flex-1 rounded-full" />
							<Skeleton className="h-4 w-12" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
