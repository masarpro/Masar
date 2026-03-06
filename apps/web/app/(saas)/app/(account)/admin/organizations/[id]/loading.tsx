import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-4 w-32" />
			<div className="rounded-xl border border-border p-6 space-y-5">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-full rounded-lg" />
					</div>
				))}
				<Skeleton className="h-10 w-28 rounded-lg" />
			</div>
		</div>
	);
}
