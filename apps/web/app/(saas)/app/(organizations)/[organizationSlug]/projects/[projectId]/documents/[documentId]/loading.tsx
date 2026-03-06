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
			<div className="rounded-xl border border-border p-6 space-y-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<Skeleton key={i} className="h-4 w-full" />
				))}
			</div>
		</div>
	);
}
