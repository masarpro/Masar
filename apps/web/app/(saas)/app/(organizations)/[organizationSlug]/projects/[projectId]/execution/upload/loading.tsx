import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="max-w-2xl mx-auto space-y-6">
			<Skeleton className="h-8 w-48" />
			<div className="rounded-xl border-2 border-dashed border-border p-12 flex flex-col items-center gap-4">
				<Skeleton className="h-12 w-12 rounded-full" />
				<Skeleton className="h-5 w-48" />
				<Skeleton className="h-4 w-36" />
				<Skeleton className="h-10 w-32 rounded-lg" />
			</div>
		</div>
	);
}
