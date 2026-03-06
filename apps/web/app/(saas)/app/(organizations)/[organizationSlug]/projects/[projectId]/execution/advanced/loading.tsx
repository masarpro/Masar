import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-48" />
				<div className="flex gap-2">
					<Skeleton className="h-10 w-24 rounded-lg" />
					<Skeleton className="h-10 w-24 rounded-lg" />
				</div>
			</div>
			<div className="rounded-xl border border-border p-4">
				<div className="flex gap-4 border-b border-border pb-4 mb-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<Skeleton key={i} className="h-4 w-16" />
					))}
				</div>
				{Array.from({ length: 10 }).map((_, i) => (
					<div key={i} className="flex items-center gap-4 py-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-6 flex-1 rounded" style={{ maxWidth: `${30 + Math.random() * 50}%` }} />
					</div>
				))}
			</div>
		</div>
	);
}
