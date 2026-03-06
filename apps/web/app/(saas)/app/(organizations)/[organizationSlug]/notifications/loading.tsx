import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-36" />
				<Skeleton className="h-9 w-28 rounded-lg" />
			</div>
			<div className="space-y-3">
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} className="flex items-start gap-3 rounded-xl border border-border p-4">
						<Skeleton className="h-10 w-10 rounded-full" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-full max-w-md" />
							<Skeleton className="h-3 w-32" />
						</div>
						<Skeleton className="h-2 w-2 rounded-full" />
					</div>
				))}
			</div>
		</div>
	);
}
