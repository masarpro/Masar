import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-9 w-9 rounded-lg" />
			</div>
			<div className="rounded-xl border border-border p-4 space-y-4 min-h-[50vh]">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
						<div className="flex items-end gap-2">
							{i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
							<Skeleton className={`h-16 rounded-xl ${i % 2 === 0 ? "w-64" : "w-48"}`} />
						</div>
					</div>
				))}
			</div>
			<div className="flex gap-2">
				<Skeleton className="h-12 flex-1 rounded-xl" />
				<Skeleton className="h-12 w-12 rounded-xl" />
			</div>
		</div>
	);
}
