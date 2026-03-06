import { Skeleton } from "@ui/components/skeleton";

export default function Loading() {
	return (
		<div className="flex min-h-[30vh] items-center justify-center">
			<Skeleton className="h-6 w-32" />
		</div>
	);
}
