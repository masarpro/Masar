import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-64" />
			</div>
			{/* Checklist */}
			<div className="rounded-xl border border-border p-6 space-y-3">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="flex items-center gap-3">
						<Skeleton className="h-5 w-5 rounded" />
						<Skeleton className="h-4 w-48" />
					</div>
				))}
			</div>
			{/* Quick actions grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="rounded-xl border border-border p-5 space-y-3">
						<Skeleton className="h-10 w-10 rounded-lg" />
						<Skeleton className="h-5 w-28" />
						<Skeleton className="h-4 w-full" />
					</div>
				))}
			</div>
		</div>
	);
}
