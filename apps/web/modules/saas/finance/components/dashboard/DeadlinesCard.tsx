"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@ui/components/skeleton";
import { Clock } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface DeadlinesCardProps {
	organizationId: string;
	organizationSlug: string;
}

export function DeadlinesCard({
	organizationId,
	organizationSlug,
}: DeadlinesCardProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/finance`;

	const { data, isLoading, isError } = useQuery(
		orpc.finance.outstanding.queryOptions({
			input: { organizationId, limit: 20 },
		}),
	);

	if (isLoading) {
		return <Skeleton className="h-40 w-full rounded-2xl" />;
	}

	// Upcoming = unpaid invoices whose due date hasn't passed yet
	const now = Date.now();
	const upcomingDeadlines = (data ?? [])
		.filter(
			(invoice) =>
				invoice.dueDate && new Date(invoice.dueDate).getTime() >= now,
		)
		.slice(0, 3);

	if (isError || upcomingDeadlines.length === 0) {
		return null;
	}

	return (
		<div className="backdrop-blur-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/50 rounded-2xl shadow-lg shadow-black/5 p-5 h-full">
			<div className="flex items-center gap-2 mb-4">
				<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
				<h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">
					{t("finance.dashboard.alerts.upcomingDeadlines")}
				</h3>
				<span className="ms-auto text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
					{upcomingDeadlines.length}
				</span>
			</div>

			<div className="space-y-2">
				{upcomingDeadlines.map((invoice) => {
					const path = `${basePath}/invoices/${invoice.id}`;
					const daysUntil = Math.ceil(
						(new Date(invoice.dueDate as string | Date).getTime() - now) /
							(1000 * 60 * 60 * 24),
					);

					return (
						<Link
							key={`invoice-${invoice.id}`}
							href={path}
							className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-colors border border-amber-100/50 dark:border-amber-900/30"
						>
							<div>
								<p className="font-medium text-sm text-slate-900 dark:text-slate-100">
									{invoice.invoiceNo}
								</p>
								<p className="text-xs text-slate-600 dark:text-slate-400">
									{invoice.client?.name ?? "-"}
								</p>
							</div>
							<div className="text-end">
								<p className="font-semibold text-sm text-amber-600 dark:text-amber-400">
									{daysUntil} {t("common.days")}
								</p>
								<p className="text-xs text-slate-500">
									{t("finance.dashboard.types.invoice")}
								</p>
							</div>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
