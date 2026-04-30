import { Skeleton } from "@ui/components/skeleton";

export function LoadingSkeleton() {
	return (
		<div className="space-y-4">
			<Skeleton className="h-12 w-full" />
			{Array.from({ length: 5 }).map((_, i) => (
				<Skeleton key={i} className="h-20 w-full" />
			))}
		</div>
	);
}
