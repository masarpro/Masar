import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="max-w-2xl mx-auto space-y-6">
			<Skeleton className="h-8 w-48" />
			<div className="rounded-xl border border-border p-6 space-y-5">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-full rounded-lg" />
					</div>
				))}
			</div>
			<div className="flex gap-3 justify-end">
				<Skeleton className="h-10 w-24 rounded-lg" />
				<Skeleton className="h-10 w-32 rounded-lg" />
			</div>
		</div>
	);
}
