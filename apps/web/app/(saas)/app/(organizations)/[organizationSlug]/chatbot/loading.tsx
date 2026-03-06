import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-4 w-64" />
			</div>
			<div className="flex gap-4 h-[60vh]">
				<div className="w-64 rounded-xl border border-border p-4 space-y-3">
					<Skeleton className="h-9 w-full rounded-lg" />
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-10 w-full rounded-lg" />
					))}
				</div>
				<div className="flex-1 rounded-xl border border-border p-4 flex flex-col">
					<div className="flex-1 space-y-4 p-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
								<Skeleton className={`h-16 rounded-xl ${i % 2 === 0 ? "w-2/3" : "w-1/2"}`} />
							</div>
						))}
					</div>
					<Skeleton className="h-12 w-full rounded-xl" />
				</div>
			</div>
		</div>
	);
}
