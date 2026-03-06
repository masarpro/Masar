import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-40" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-10 w-24 rounded-lg" />
					<Skeleton className="h-10 w-24 rounded-lg" />
				</div>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="rounded-xl border border-border p-4 space-y-3">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-6 w-32" />
					</div>
				))}
			</div>
			<div className="rounded-xl border border-border p-6 space-y-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="flex justify-between">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-4 w-48" />
					</div>
				))}
			</div>
		</div>
	);
}
