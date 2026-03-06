import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-4 w-24" />
			<div className="rounded-xl border border-border p-6 space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-64" />
					<div className="flex gap-2">
						<Skeleton className="h-6 w-20 rounded-full" />
						<Skeleton className="h-6 w-20 rounded-full" />
					</div>
				</div>
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-2/3" />
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{Array.from({ length: 2 }).map((_, i) => (
					<div key={i} className="rounded-xl border border-border p-4 space-y-3">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-6 w-32" />
					</div>
				))}
			</div>
			<div className="rounded-xl border border-border p-6 space-y-4">
				<Skeleton className="h-5 w-28" />
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="flex items-center gap-3">
						<Skeleton className="h-3 w-3 rounded-full" />
						<Skeleton className="h-4 w-48" />
						<Skeleton className="h-3 w-24" />
					</div>
				))}
			</div>
		</div>
	);
}
