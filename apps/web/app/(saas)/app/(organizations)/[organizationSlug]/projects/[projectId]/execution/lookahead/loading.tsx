import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-10 w-28 rounded-lg" />
			</div>
			<div className="rounded-xl border border-border p-4">
				<div className="flex gap-4 border-b border-border pb-4 mb-4">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-4 w-20" />
					))}
				</div>
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} className="flex gap-4 py-3 border-b border-border last:border-0">
						{Array.from({ length: 5 }).map((_, j) => (
							<Skeleton key={j} className="h-4 flex-1" />
						))}
					</div>
				))}
			</div>
		</div>
	);
}
