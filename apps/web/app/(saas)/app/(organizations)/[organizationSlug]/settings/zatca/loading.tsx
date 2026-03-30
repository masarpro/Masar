import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-10 w-64" />
			<Skeleton className="h-5 w-96" />
			<div className="grid gap-4 mt-4">
				<Skeleton className="h-40 w-full rounded-2xl" />
				<Skeleton className="h-40 w-full rounded-2xl" />
				<Skeleton className="h-32 w-full rounded-2xl" />
			</div>
		</div>
	);
}
