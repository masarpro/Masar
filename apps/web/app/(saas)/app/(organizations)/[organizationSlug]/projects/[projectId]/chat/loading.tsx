import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="flex min-h-[50vh] items-center justify-center">
			<Skeleton className="h-8 w-32" />
		</div>
	);
}
