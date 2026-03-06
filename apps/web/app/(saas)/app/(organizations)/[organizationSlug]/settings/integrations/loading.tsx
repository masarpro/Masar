import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="rounded-xl border border-border p-6 space-y-4">
				<Skeleton className="h-5 w-36" />
				<Skeleton className="h-4 w-full max-w-md" />
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="flex items-center justify-between py-3">
						<div className="flex items-center gap-3">
							<Skeleton className="h-10 w-10 rounded-lg" />
							<div className="space-y-1">
								<Skeleton className="h-4 w-28" />
								<Skeleton className="h-3 w-40" />
							</div>
						</div>
						<Skeleton className="h-9 w-20 rounded-lg" />
					</div>
				))}
			</div>
		</div>
	);
}
