import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="mx-auto w-full max-w-sm space-y-6">
			<div className="space-y-2 text-center">
				<Skeleton className="mx-auto h-10 w-10 rounded-full" />
				<Skeleton className="mx-auto h-7 w-48" />
				<Skeleton className="mx-auto h-4 w-72" />
			</div>
			<div className="flex justify-center gap-2">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="h-12 w-10 rounded-lg" />
				))}
			</div>
			<Skeleton className="h-10 w-full rounded-lg" />
			<Skeleton className="mx-auto h-4 w-40" />
		</div>
	);
}
