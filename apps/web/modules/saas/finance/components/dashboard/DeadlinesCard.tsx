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
		<div className="bg-card border-2 border-chart-1/30 rounded-2xl p-5 h-full">
			<div className="flex items-center gap-2 mb-4">
				<Clock className="h-5 w-5 text-chart-1" />
				<h3 className="text-sm font-semibold text-chart-1">
					{t("finance.dashboard.alerts.upcomingDeadlines")}
				</h3>
				<span className="ms-auto text-xs font-medium text-chart-1 bg-chart-1/15 px-2 py-0.5 rounded-full">
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
							className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors border"
						>
							<div>
								<p className="font-medium text-sm text-card-foreground">
									{invoice.invoiceNo}
								</p>
								<p className="text-xs text-muted-foreground">
									{invoice.client?.name ?? "-"}
								</p>
							</div>
							<div className="text-end">
								<p className="font-semibold text-sm text-chart-1">
									{daysUntil} {t("common.days")}
								</p>
								<p className="text-xs text-muted-foreground">
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
