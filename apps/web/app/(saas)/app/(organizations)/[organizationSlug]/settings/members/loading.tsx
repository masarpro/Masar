import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			{/* Invite form */}
			<div className="rounded-xl border border-border p-6 space-y-4">
				<Skeleton className="h-5 w-36" />
				<div className="flex gap-3">
					<Skeleton className="h-10 flex-1 rounded-lg" />
					<Skeleton className="h-10 w-28 rounded-lg" />
					<Skeleton className="h-10 w-28 rounded-lg" />
				</div>
			</div>
			{/* Members table */}
			<div className="rounded-xl border border-border p-6 space-y-4">
				<Skeleton className="h-5 w-28" />
				<div className="flex gap-2">
					<Skeleton className="h-9 w-20 rounded-lg" />
					<Skeleton className="h-9 w-24 rounded-lg" />
				</div>
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="flex items-center justify-between py-3">
						<div className="flex items-center gap-3">
							<Skeleton className="h-9 w-9 rounded-full" />
							<div className="space-y-1">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-40" />
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Skeleton className="h-6 w-16 rounded-full" />
							<Skeleton className="h-8 w-8 rounded" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
