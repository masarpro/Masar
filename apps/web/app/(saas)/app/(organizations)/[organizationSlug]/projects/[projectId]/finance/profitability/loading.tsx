import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6 p-6">
			<Skeleton className="h-8 w-48" />
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Skeleton className="h-32 rounded-2xl" />
				<Skeleton className="h-32 rounded-2xl" />
				<Skeleton className="h-32 rounded-2xl" />
			</div>
			<Skeleton className="h-64 rounded-2xl" />
		</div>
	);
}
