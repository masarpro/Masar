import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="container max-w-3xl pt-32 pb-16">
			<div className="mb-12 pt-8 text-center space-y-2">
				<Skeleton className="mx-auto h-12 w-48" />
				<Skeleton className="mx-auto h-5 w-64" />
			</div>
			<div className="space-y-8">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="border-s-2 border-border ps-6 space-y-3">
						<Skeleton className="h-5 w-32" />
						<div className="space-y-2">
							{Array.from({ length: 3 }).map((_, j) => (
								<Skeleton key={j} className="h-4 w-full max-w-sm" />
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
