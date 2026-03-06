import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="mx-auto w-full max-w-md space-y-6 py-12">
			<div className="rounded-xl border border-border p-8 text-center space-y-4">
				<Skeleton className="mx-auto h-16 w-16 rounded-full" />
				<Skeleton className="mx-auto h-6 w-48" />
				<Skeleton className="mx-auto h-4 w-72" />
				<div className="flex gap-3 justify-center pt-2">
					<Skeleton className="h-10 w-24 rounded-lg" />
					<Skeleton className="h-10 w-28 rounded-lg" />
				</div>
			</div>
		</div>
	);
}
