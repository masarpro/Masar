import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="container max-w-6xl pt-32 pb-24">
			<div className="mx-auto mb-12 max-w-2xl text-center">
				<Skeleton className="mx-auto h-10 w-64" />
			</div>
			<div className="mx-auto max-w-2xl space-y-4">
				{Array.from({ length: 20 }).map((_, i) => (
					<Skeleton key={i} className="h-4 w-full" />
				))}
			</div>
		</div>
	);
}
