import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="mx-auto max-w-2xl space-y-8 py-12">
			<div className="text-center space-y-2">
				<Skeleton className="mx-auto h-8 w-48" />
				<Skeleton className="mx-auto h-4 w-72" />
			</div>
			{/* Steps indicator */}
			<div className="flex items-center justify-center gap-2">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="flex items-center gap-2">
						<Skeleton className="h-8 w-8 rounded-full" />
						{i < 3 && <Skeleton className="h-0.5 w-12" />}
					</div>
				))}
			</div>
			{/* Form */}
			<div className="rounded-xl border border-border p-6 space-y-5">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-full rounded-lg" />
					</div>
				))}
			</div>
			<div className="flex justify-end gap-3">
				<Skeleton className="h-10 w-24 rounded-lg" />
				<Skeleton className="h-10 w-28 rounded-lg" />
			</div>
		</div>
	);
}
