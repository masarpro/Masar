import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			{/* Avatar */}
			<div className="rounded-xl border border-border p-6 flex items-center gap-4">
				<Skeleton className="h-16 w-16 rounded-full" />
				<Skeleton className="h-9 w-28 rounded-lg" />
			</div>
			{/* Name */}
			<div className="rounded-xl border border-border p-6 space-y-4">
				<Skeleton className="h-5 w-32" />
				<Skeleton className="h-10 w-full rounded-lg" />
				<Skeleton className="h-9 w-24 rounded-lg" />
			</div>
			{/* Email */}
			<div className="rounded-xl border border-border p-6 space-y-4">
				<Skeleton className="h-5 w-36" />
				<Skeleton className="h-10 w-full rounded-lg" />
				<Skeleton className="h-9 w-24 rounded-lg" />
			</div>
		</div>
	);
}
