import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-10 w-32" />
			</div>
			<Skeleton className="h-20 w-full rounded-xl" />
			<div className="rounded-xl border border-border p-6 space-y-4">
				<Skeleton className="h-5 w-28" />
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="flex items-center justify-between py-3">
						<div className="flex items-center gap-3">
							<div className="space-y-1">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-24" />
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Skeleton className="h-4 w-12" />
							<Skeleton className="h-6 w-16 rounded-full" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
