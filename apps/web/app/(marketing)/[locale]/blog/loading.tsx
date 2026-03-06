import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="container max-w-6xl pt-32 pb-16">
			<div className="mb-12 pt-8 text-center space-y-2">
				<Skeleton className="mx-auto h-12 w-48" />
				<Skeleton className="mx-auto h-5 w-64" />
			</div>
			<div className="grid gap-8 md:grid-cols-2">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="rounded-xl border border-border overflow-hidden">
						<Skeleton className="h-48 w-full" />
						<div className="p-6 space-y-3">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-6 w-full" />
							<Skeleton className="h-4 w-3/4" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
