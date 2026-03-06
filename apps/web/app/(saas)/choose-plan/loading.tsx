import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="mx-auto max-w-4xl space-y-8 py-12">
			<div className="text-center space-y-2">
				<Skeleton className="mx-auto h-8 w-48" />
				<Skeleton className="mx-auto h-4 w-72" />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{Array.from({ length: 2 }).map((_, i) => (
					<div key={i} className="rounded-2xl border border-border p-8 space-y-4">
						<Skeleton className="h-6 w-24" />
						<Skeleton className="h-10 w-36" />
						<Skeleton className="h-4 w-48" />
						<div className="space-y-2 pt-2">
							{Array.from({ length: 5 }).map((_, j) => (
								<Skeleton key={j} className="h-4 w-full" />
							))}
						</div>
						<Skeleton className="h-12 w-full rounded-xl" />
					</div>
				))}
			</div>
		</div>
	);
}
