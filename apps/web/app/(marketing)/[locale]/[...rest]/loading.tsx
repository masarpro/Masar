import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="container max-w-3xl pt-32 pb-16 space-y-6">
			<Skeleton className="h-10 w-64" />
			<div className="space-y-3">
				{Array.from({ length: 8 }).map((_, i) => (
					<Skeleton key={i} className="h-4 w-full" />
				))}
			</div>
		</div>
	);
}
