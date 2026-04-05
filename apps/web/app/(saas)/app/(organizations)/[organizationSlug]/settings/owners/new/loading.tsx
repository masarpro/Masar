import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-32" />
			<div className="rounded-xl border border-border p-6 space-y-6">
				<Skeleton className="h-6 w-40" />
				<Skeleton className="h-12 w-full rounded-lg" />
				<div className="grid gap-6 sm:grid-cols-2">
					<Skeleton className="h-12 rounded-lg" />
					<Skeleton className="h-12 rounded-lg" />
				</div>
				<Skeleton className="h-12 w-full rounded-lg" />
				<div className="grid gap-6 sm:grid-cols-2">
					<Skeleton className="h-12 rounded-lg" />
					<Skeleton className="h-12 rounded-lg" />
				</div>
				<Skeleton className="h-12 w-full rounded-lg" />
				<Skeleton className="h-24 w-full rounded-lg" />
				<div className="flex justify-end gap-3">
					<Skeleton className="h-10 w-28 rounded-lg" />
					<Skeleton className="h-10 w-28 rounded-lg" />
				</div>
			</div>
		</div>
	);
}
