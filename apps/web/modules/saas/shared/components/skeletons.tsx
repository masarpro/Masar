import { Skeleton } from "@ui/components/skeleton";

/**
 * Skeleton for the organization home dashboard.
 * Used by: [organizationSlug]/loading.tsx, Dashboard.tsx
 */
export function HomeDashboardSkeleton() {
	return (
		<div className="flex flex-col gap-3 p-3 md:p-4 lg:p-5">
			{/* Top row: Projects + Finance */}
			<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
				<Skeleton className="h-[340px] rounded-2xl" />
				<Skeleton className="h-[340px] rounded-2xl" />
			</div>
			{/* 6 Quick Action cards */}
			<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="h-[80px] rounded-xl" />
				))}
			</div>
			{/* Bottom row: 3 cards */}
			<div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
				<Skeleton className="h-[200px] rounded-2xl" />
				<Skeleton className="h-[200px] rounded-2xl" />
				<Skeleton className="h-[200px] rounded-2xl" />
			</div>
		</div>
	);
}

/**
 * Skeleton for dashboard pages with stat cards + charts.
 * Used by: company/loading.tsx, CompanyDashboard, FinanceDashboard
 */
export function DashboardSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-48" />
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="rounded-xl border border-border p-5 space-y-3">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-8 w-28" />
						<Skeleton className="h-3 w-24" />
					</div>
				))}
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="rounded-xl border border-border p-6 space-y-4">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-48 w-full rounded-lg" />
				</div>
				<div className="rounded-xl border border-border p-6 space-y-4">
					<Skeleton className="h-5 w-32" />
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex items-center gap-3">
							<Skeleton className="h-8 w-8 rounded-full" />
							<Skeleton className="h-4 w-32 flex-1" />
							<Skeleton className="h-4 w-20" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

/**
 * Skeleton for table-based list pages.
 * Used by: leads, quotations, studies, invoices, banks, clients, payments, expenses, etc.
 */
export function ListTableSkeleton({
	rows = 6,
	cols = 5,
}: { rows?: number; cols?: number } = {}) {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-10 w-32 rounded-lg" />
			</div>
			<Skeleton className="h-10 max-w-sm rounded-lg" />
			<div className="rounded-xl border border-border">
				<div className="flex gap-4 border-b border-border p-4">
					{Array.from({ length: cols }).map((_, i) => (
						<Skeleton key={i} className="h-4 flex-1" />
					))}
				</div>
				{Array.from({ length: rows }).map((_, i) => (
					<div
						key={i}
						className="flex gap-4 border-b border-border p-4 last:border-0"
					>
						{Array.from({ length: cols }).map((_, j) => (
							<Skeleton key={j} className="h-4 flex-1" />
						))}
					</div>
				))}
			</div>
		</div>
	);
}

/**
 * Skeleton for card-grid list pages (projects, templates).
 */
export function CardGridSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-10 w-36 rounded-lg" />
			</div>
			<Skeleton className="h-10 max-w-sm rounded-lg" />
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="rounded-xl border border-border p-5 space-y-3">
						<div className="flex items-center justify-between">
							<Skeleton className="h-6 w-32" />
							<Skeleton className="h-6 w-16 rounded-full" />
						</div>
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-2/3" />
						<div className="flex items-center gap-2 pt-2">
							<Skeleton className="h-2 flex-1 rounded-full" />
							<Skeleton className="h-4 w-12" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/**
 * Skeleton for detail pages with header, stat cards, and detail section.
 * Used by: lead detail, study overview, asset detail, employee detail, etc.
 */
export function DetailPageSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-40" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-10 w-24 rounded-lg" />
					<Skeleton className="h-10 w-24 rounded-lg" />
				</div>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="rounded-xl border border-border p-4 space-y-3"
					>
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-6 w-32" />
					</div>
				))}
			</div>
			<div className="rounded-xl border border-border p-6 space-y-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="flex justify-between">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-4 w-48" />
					</div>
				))}
			</div>
		</div>
	);
}

/**
 * Skeleton for project overview pages with stats + charts + activity.
 */
export function ProjectOverviewSkeleton() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-4 w-40" />
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="rounded-xl border border-border p-5 space-y-3"
					>
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-8 w-28" />
						<Skeleton className="h-3 w-24" />
					</div>
				))}
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="rounded-xl border border-border p-6 space-y-4">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-48 w-full rounded-lg" />
				</div>
				<div className="rounded-xl border border-border p-6 space-y-4">
					<Skeleton className="h-5 w-32" />
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex items-center gap-3">
							<Skeleton className="h-8 w-8 rounded-full" />
							<Skeleton className="h-4 w-32 flex-1" />
							<Skeleton className="h-4 w-20" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

/**
 * Skeleton for form pages (create/edit).
 */
export function FormPageSkeleton({ fields = 6 }: { fields?: number } = {}) {
	return (
		<div className="max-w-2xl mx-auto space-y-6">
			<Skeleton className="h-8 w-48" />
			<div className="rounded-xl border border-border p-6 space-y-5">
				{Array.from({ length: fields }).map((_, i) => (
					<div key={i} className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-full rounded-lg" />
					</div>
				))}
			</div>
			<div className="flex gap-3 justify-end">
				<Skeleton className="h-10 w-24 rounded-lg" />
				<Skeleton className="h-10 w-32 rounded-lg" />
			</div>
		</div>
	);
}

/**
 * Skeleton for editor pages with form + embedded table.
 * Used by: quotation editor, invoice editor
 */
export function EditorPageSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-48" />
				<div className="flex gap-2">
					<Skeleton className="h-10 w-24 rounded-lg" />
					<Skeleton className="h-10 w-28 rounded-lg" />
				</div>
			</div>
			<div className="rounded-xl border border-border p-6 space-y-5">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-full rounded-lg" />
					</div>
				))}
				<div className="rounded-lg border border-border">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="flex gap-4 border-b border-border p-3 last:border-0"
						>
							{Array.from({ length: 4 }).map((_, j) => (
								<Skeleton key={j} className="h-4 flex-1" />
							))}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

/**
 * Skeleton for document preview pages (invoice preview, quotation preview).
 */
export function PreviewPageSkeleton() {
	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-4 w-24" />
				<div className="flex gap-2">
					<Skeleton className="h-10 w-28 rounded-lg" />
					<Skeleton className="h-10 w-28 rounded-lg" />
				</div>
			</div>
			<div className="rounded-xl border border-border p-8 space-y-6">
				<div className="flex justify-between">
					<Skeleton className="h-12 w-32" />
					<div className="space-y-1">
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-4 w-32" />
					</div>
				</div>
				<Skeleton className="h-px w-full" />
				<div className="rounded-lg border border-border">
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className="flex gap-4 border-b border-border p-3 last:border-0"
						>
							{Array.from({ length: 4 }).map((_, j) => (
								<Skeleton key={j} className="h-4 flex-1" />
							))}
						</div>
					))}
				</div>
				<div className="flex justify-end">
					<Skeleton className="h-8 w-40" />
				</div>
			</div>
		</div>
	);
}

/**
 * Skeleton for settings pages with card sections.
 */
export function SettingsPageSkeleton() {
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

/**
 * Skeleton for pricing study editor pages (structural, finishing, MEP, pricing).
 */
export function StudyEditorSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-10 w-32 rounded-lg" />
			</div>
			<div className="rounded-xl border border-border">
				<div className="flex gap-4 border-b border-border p-4">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-4 flex-1" />
					))}
				</div>
				{Array.from({ length: 8 }).map((_, i) => (
					<div
						key={i}
						className="flex gap-4 border-b border-border p-4 last:border-0"
					>
						{Array.from({ length: 6 }).map((_, j) => (
							<Skeleton key={j} className="h-4 flex-1" />
						))}
					</div>
				))}
			</div>
			<div className="flex justify-end">
				<Skeleton className="h-10 w-28 rounded-lg" />
			</div>
		</div>
	);
}

/**
 * Skeleton for cost study overview with header + stat cards + detail chart.
 */
export function StudyOverviewSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-40" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-10 w-24 rounded-lg" />
					<Skeleton className="h-10 w-28 rounded-lg" />
				</div>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="rounded-xl border border-border p-4 space-y-3"
					>
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-6 w-32" />
					</div>
				))}
			</div>
			<div className="rounded-xl border border-border p-6 space-y-4">
				<Skeleton className="h-5 w-32" />
				<Skeleton className="h-48 w-full rounded-lg" />
			</div>
		</div>
	);
}

/**
 * Minimal skeleton for lightweight sub-pages (chat, timeline).
 */
export function MinimalSkeleton() {
	return (
		<div className="flex min-h-[30vh] items-center justify-center">
			<Skeleton className="h-6 w-32" />
		</div>
	);
}
