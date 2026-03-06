import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			{/* Change Password */}
			<div className="rounded-xl border border-border p-6 space-y-4">
				<Skeleton className="h-5 w-40" />
				<Skeleton className="h-10 w-full rounded-lg" />
				<Skeleton className="h-10 w-full rounded-lg" />
				<Skeleton className="h-9 w-28 rounded-lg" />
			</div>
			{/* Connected Accounts */}
			<div className="rounded-xl border border-border p-6 space-y-4">
				<Skeleton className="h-5 w-44" />
				{Array.from({ length: 2 }).map((_, i) => (
					<div key={i} className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Skeleton className="h-8 w-8 rounded" />
							<Skeleton className="h-4 w-24" />
						</div>
						<Skeleton className="h-9 w-20 rounded-lg" />
					</div>
				))}
			</div>
			{/* Active Sessions */}
			<div className="rounded-xl border border-border p-6 space-y-4">
				<Skeleton className="h-5 w-36" />
				{Array.from({ length: 2 }).map((_, i) => (
					<div key={i} className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Skeleton className="h-8 w-8 rounded" />
							<div className="space-y-1">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-24" />
							</div>
						</div>
						<Skeleton className="h-9 w-20 rounded-lg" />
					</div>
				))}
			</div>
		</div>
	);
}
