import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
			<Skeleton className="h-16 w-16 rounded-full" />
			<Skeleton className="h-6 w-32" />
			<Skeleton className="h-4 w-48" />
		</div>
	);
}
