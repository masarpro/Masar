import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="mx-auto w-full max-w-sm space-y-6">
			<div className="space-y-2 text-center">
				<Skeleton className="mx-auto h-10 w-10 rounded-full" />
				<Skeleton className="mx-auto h-7 w-48" />
				<Skeleton className="mx-auto h-4 w-64" />
			</div>
			<div className="space-y-4">
				<div className="space-y-2">
					<Skeleton className="h-4 w-28" />
					<Skeleton className="h-10 w-full rounded-lg" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-10 w-full rounded-lg" />
				</div>
				<Skeleton className="h-10 w-full rounded-lg" />
			</div>
		</div>
	);
}
