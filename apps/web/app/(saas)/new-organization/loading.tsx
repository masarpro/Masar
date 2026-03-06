import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="mx-auto w-full max-w-md space-y-6 py-12">
			<div className="text-center space-y-2">
				<Skeleton className="mx-auto h-8 w-48" />
				<Skeleton className="mx-auto h-4 w-64" />
			</div>
			<div className="rounded-xl border border-border p-6 space-y-5">
				<div className="space-y-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-10 w-full rounded-lg" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-10 w-full rounded-lg" />
				</div>
				<Skeleton className="h-10 w-full rounded-lg" />
			</div>
		</div>
	);
}
