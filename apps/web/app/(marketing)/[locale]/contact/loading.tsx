import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="container max-w-xl pt-32 pb-16">
			<div className="mb-12 pt-8 text-center space-y-2">
				<Skeleton className="mx-auto h-12 w-48" />
				<Skeleton className="mx-auto h-5 w-72" />
			</div>
			<div className="space-y-5">
				<div className="space-y-2">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-10 w-full rounded-lg" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-10 w-full rounded-lg" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-10 w-full rounded-lg" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-32 w-full rounded-lg" />
				</div>
				<Skeleton className="h-10 w-full rounded-lg" />
			</div>
		</div>
	);
}
