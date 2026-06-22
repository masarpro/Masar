import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-48 rounded-xl" />
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<Skeleton key={i} className="aspect-square rounded-xl" />
				))}
			</div>
		</div>
	);
}
