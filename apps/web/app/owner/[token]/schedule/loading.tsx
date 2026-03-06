import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-40" />
			<div className="rounded-xl border border-border p-6 space-y-3">
				<div className="flex justify-between">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-4 w-32" />
				</div>
			</div>
			<div className="space-y-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="flex items-center gap-4">
						<Skeleton className="h-10 w-10 rounded-full" />
						<div className="flex-1 space-y-1">
							<Skeleton className="h-4 w-48" />
							<Skeleton className="h-3 w-32" />
						</div>
						<Skeleton className="h-6 w-20 rounded-full" />
					</div>
				))}
			</div>
		</div>
	);
}
