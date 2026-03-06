import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			{/* Logo */}
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
			{/* Company Info */}
			<div className="rounded-xl border border-border p-6 space-y-4">
				<Skeleton className="h-5 w-36" />
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-full rounded-lg" />
					</div>
				))}
				<Skeleton className="h-9 w-24 rounded-lg" />
			</div>
		</div>
	);
}
