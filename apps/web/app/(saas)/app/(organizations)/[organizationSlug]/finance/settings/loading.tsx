import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="max-w-3xl space-y-8">
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-72" />
			</div>
			{Array.from({ length: 3 }).map((_, i) => (
				<div key={i} className="rounded-xl border border-border p-6 space-y-4">
					<Skeleton className="h-5 w-36" />
					<div className="space-y-3">
						<div className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-10 w-full rounded-lg" />
						</div>
						<div className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-10 w-full rounded-lg" />
						</div>
					</div>
				</div>
			))}
			<Skeleton className="h-10 w-28 rounded-lg" />
		</div>
	);
}
