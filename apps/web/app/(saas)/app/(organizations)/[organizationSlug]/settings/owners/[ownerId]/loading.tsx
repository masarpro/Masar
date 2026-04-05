import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-32" />
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Skeleton className="h-7 w-40" />
					<Skeleton className="h-6 w-16 rounded-full" />
				</div>
				<Skeleton className="h-9 w-32 rounded-lg" />
			</div>
			<div className="rounded-xl border border-border p-6 space-y-4">
				<Skeleton className="h-5 w-36" />
				<div className="grid gap-4 sm:grid-cols-2">
					{Array.from({ length: 7 }).map((_, i) => (
						<div key={i} className="flex items-start gap-3">
							<Skeleton className="h-9 w-9 rounded-lg" />
							<div className="space-y-1">
								<Skeleton className="h-3 w-20" />
								<Skeleton className="h-4 w-32" />
							</div>
						</div>
					))}
				</div>
			</div>
			<div className="rounded-xl border border-border p-6 space-y-4">
				<Skeleton className="h-5 w-32" />
				<Skeleton className="h-20 w-48 rounded-lg" />
				<Skeleton className="h-9 w-32 rounded-lg" />
			</div>
		</div>
	);
}
