import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="mx-auto max-w-4xl space-y-6 py-8">
			<div className="rounded-xl border border-border p-6 space-y-4">
				<div className="flex items-center justify-between">
					<div className="space-y-2">
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-32" />
					</div>
					<Skeleton className="h-6 w-20 rounded-full" />
				</div>
			</div>
			<div className="rounded-xl border border-border p-6 space-y-4">
				<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="aspect-square w-full rounded-lg" />
					))}
				</div>
			</div>
		</div>
	);
}
