import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-10 w-32" />
			</div>
			<Skeleton className="h-14 w-full rounded-xl" />
			<Skeleton className="h-14 w-full rounded-xl" />
			<Skeleton className="h-14 w-full rounded-xl" />
			<Skeleton className="h-14 w-full rounded-xl" />
		</div>
	);
}
