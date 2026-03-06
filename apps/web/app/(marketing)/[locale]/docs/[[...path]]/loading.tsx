import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="container flex gap-8 pt-16 pb-16">
			<div className="flex-1 space-y-6">
				<div className="flex gap-2">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-4" />
					<Skeleton className="h-4 w-24" />
				</div>
				<Skeleton className="h-10 w-80" />
				<Skeleton className="h-5 w-full max-w-lg" />
				<div className="space-y-3 pt-4">
					{Array.from({ length: 15 }).map((_, i) => (
						<Skeleton key={i} className="h-4 w-full" />
					))}
				</div>
			</div>
			<div className="hidden lg:block w-56 space-y-3">
				<Skeleton className="h-4 w-24" />
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="h-3 w-full" />
				))}
			</div>
		</div>
	);
}
