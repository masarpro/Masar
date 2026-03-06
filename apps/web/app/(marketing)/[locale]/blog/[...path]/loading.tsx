import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="container pt-32 pb-24">
			<Skeleton className="h-4 w-24 mb-12" />
			<div className="mx-auto max-w-2xl text-center space-y-4">
				<Skeleton className="mx-auto h-10 w-96 max-w-full" />
				<div className="flex items-center justify-center gap-6">
					<div className="flex items-center gap-2">
						<Skeleton className="h-8 w-8 rounded-full" />
						<Skeleton className="h-4 w-20" />
					</div>
					<Skeleton className="h-4 w-24" />
				</div>
			</div>
			<Skeleton className="mt-6 h-64 w-full rounded-4xl" />
			<div className="mx-auto max-w-2xl mt-8 space-y-4">
				{Array.from({ length: 12 }).map((_, i) => (
					<Skeleton key={i} className="h-4 w-full" />
				))}
			</div>
		</div>
	);
}
