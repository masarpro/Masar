export default function Loading() {
	return (
		<div className="container max-w-3xl pt-32 pb-20">
			<div className="mb-10 flex flex-col items-center gap-3">
				<div className="h-12 w-2/3 animate-pulse rounded-2xl bg-muted" />
				<div className="h-5 w-1/2 animate-pulse rounded-xl bg-muted" />
			</div>
			<div className="mb-6 h-14 w-full animate-pulse rounded-2xl bg-muted" />
			<div className="mb-10 flex flex-wrap justify-center gap-2">
				{Array.from({ length: 8 }).map((_, i) => (
					<div
						key={`pill-${i.toString()}`}
						className="h-9 w-24 animate-pulse rounded-full bg-muted"
					/>
				))}
			</div>
			<div className="space-y-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={`row-${i.toString()}`}
						className="h-16 w-full animate-pulse rounded-2xl bg-muted"
					/>
				))}
			</div>
		</div>
	);
}
