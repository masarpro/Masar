import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="space-y-24 pb-16 -mt-[72px] pt-[72px]">
			{/* Hero */}
			<div className="container flex flex-col items-center pt-32 text-center space-y-6">
				<Skeleton className="h-12 w-96 max-w-full" />
				<Skeleton className="h-6 w-[500px] max-w-full" />
				<Skeleton className="h-6 w-80 max-w-full" />
				<div className="flex gap-4 pt-4">
					<Skeleton className="h-12 w-40 rounded-xl" />
					<Skeleton className="h-12 w-40 rounded-xl" />
				</div>
			</div>

			{/* Features */}
			<div className="container">
				<div className="text-center space-y-3 mb-12">
					<Skeleton className="mx-auto h-8 w-64" />
					<Skeleton className="mx-auto h-5 w-96 max-w-full" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="rounded-xl border border-border p-6 space-y-3">
							<Skeleton className="h-10 w-10 rounded-lg" />
							<Skeleton className="h-6 w-32" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-3/4" />
						</div>
					))}
				</div>
			</div>

			{/* Stats */}
			<div className="container">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="text-center space-y-2">
							<Skeleton className="mx-auto h-10 w-24" />
							<Skeleton className="mx-auto h-4 w-20" />
						</div>
					))}
				</div>
			</div>

			{/* Pricing */}
			<div className="container max-w-4xl">
				<div className="text-center space-y-3 mb-12">
					<Skeleton className="mx-auto h-8 w-48" />
					<Skeleton className="mx-auto h-5 w-72" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{Array.from({ length: 2 }).map((_, i) => (
						<div key={i} className="rounded-2xl border border-border p-8 space-y-4">
							<Skeleton className="h-6 w-24" />
							<Skeleton className="h-10 w-32" />
							<div className="space-y-2">
								{Array.from({ length: 5 }).map((_, j) => (
									<Skeleton key={j} className="h-4 w-full" />
								))}
							</div>
							<Skeleton className="h-12 w-full rounded-xl" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
