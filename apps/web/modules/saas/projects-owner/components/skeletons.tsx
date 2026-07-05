import { Skeleton } from "@ui/components/skeleton";

/**
 * Shared owner-portal skeletons.
 * Each route's loading.tsx AND its page's isLoading branch must render the
 * SAME component from this file so navigation shows a single, stable
 * loading state (no skeleton morphing between layers).
 */

/** /owner/[token] — hero card + KPI row + section cards */
export function OwnerSummarySkeleton() {
	return (
		<div className="space-y-4 sm:space-y-6">
			<Skeleton className="h-40 w-full rounded-2xl" />
			<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-24 rounded-2xl" />
				))}
			</div>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} className="h-28 rounded-2xl" />
				))}
			</div>
		</div>
	);
}

/** /owner/[token]/schedule — header card + tabbed schedule card */
export function OwnerScheduleSkeleton() {
	return (
		<div className="space-y-4 sm:space-y-6">
			<Skeleton className="h-28 w-full rounded-2xl" />
			<Skeleton className="h-96 w-full rounded-2xl" />
		</div>
	);
}

/** /owner/[token]/payments — title + KPI row + stages + payments/claims cards */
export function OwnerPaymentsSkeleton() {
	return (
		<div className="space-y-4 sm:space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-6 w-40" />
				<Skeleton className="h-4 w-64" />
			</div>
			<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-24 rounded-2xl" />
				))}
			</div>
			<Skeleton className="h-40 w-full rounded-2xl" />
			<Skeleton className="h-48 w-full rounded-2xl" />
		</div>
	);
}

/** /owner/[token]/chat — chat card frame: header, bubbles, input */
export function OwnerChatSkeleton() {
	return (
		<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
			<div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
				<Skeleton className="h-5 w-32" />
				<Skeleton className="h-8 w-20 rounded-xl" />
			</div>
			<div className="h-[60vh] space-y-4 p-6 sm:h-[400px]">
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={i}
						className={`flex gap-3 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}
					>
						<Skeleton className="h-9 w-9 shrink-0 rounded-full" />
						<Skeleton
							className={`h-16 rounded-2xl ${i % 2 === 0 ? "w-3/5" : "w-2/5"}`}
						/>
					</div>
				))}
			</div>
			<div className="border-t border-slate-200 p-4 dark:border-slate-700">
				<Skeleton className="h-[60px] w-full rounded-xl" />
			</div>
		</div>
	);
}

/** /owner/[token]/changes — title + stat cards + list card */
export function OwnerChangesSkeleton() {
	return (
		<div className="space-y-6">
			<div>
				<Skeleton className="h-7 w-48" />
				<Skeleton className="mt-1 h-4 w-64" />
			</div>
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-20 rounded-xl" />
				))}
			</div>
			<div className="space-y-3 rounded-xl border border-border p-4">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} className="h-12 w-full" />
				))}
			</div>
		</div>
	);
}

/** /owner/[token]/changes/[changeId] — back link + header + info cards + description */
export function OwnerChangeDetailSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-4 w-32" />
			<Skeleton className="h-40 w-full rounded-xl" />
			<div className="grid gap-4 sm:grid-cols-2">
				<Skeleton className="h-24 rounded-xl" />
				<Skeleton className="h-24 rounded-xl" />
			</div>
			<Skeleton className="h-32 w-full rounded-xl" />
		</div>
	);
}

/** /owner/[token]/photos — title + photo grid */
export function OwnerPhotosSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-48 rounded-xl" />
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<Skeleton key={i} className="aspect-square rounded-xl" />
				))}
			</div>
		</div>
	);
}

/** /owner/[token]/documents — title + search + folder rows */
export function OwnerDocumentsSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-48 rounded-xl" />
			<Skeleton className="h-11 w-full rounded-xl" />
			<div className="flex flex-col gap-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} className="h-16 rounded-xl" />
				))}
			</div>
		</div>
	);
}
