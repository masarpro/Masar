import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-48 rounded-xl" />
			<Skeleton className="h-11 w-full rounded-xl" />
			<div className="flex flex-col gap-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} className="h-16 rounded-xl" />
				))}
			</div>
		</div>
	);
}
