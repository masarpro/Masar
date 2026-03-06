import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-10 w-36 rounded-lg" />
			</div>
			<div className="rounded-xl border border-border p-6 space-y-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="flex items-center justify-between py-3">
						<div className="flex items-center gap-3">
							<Skeleton className="h-10 w-10 rounded-full" />
							<div className="space-y-1">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-24" />
							</div>
						</div>
						<Skeleton className="h-9 w-20 rounded-lg" />
					</div>
				))}
			</div>
		</div>
	);
}
