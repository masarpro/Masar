import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="rounded-xl border border-destructive/30 p-6 space-y-4">
				<Skeleton className="h-5 w-36" />
				<Skeleton className="h-4 w-full max-w-md" />
				<Skeleton className="h-10 w-32 rounded-lg" />
			</div>
		</div>
	);
}
