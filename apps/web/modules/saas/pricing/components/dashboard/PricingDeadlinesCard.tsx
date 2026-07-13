"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Currency } from "@saas/finance/components/shared/Currency";

interface ExpiringQuotation {
	id: string;
	quotationNo: string;
	clientName: string;
	validUntil: string | Date;
	totalAmount: number;
}

interface PricingDeadlinesCardProps {
	expiringQuotations: ExpiringQuotation[];
	organizationSlug: string;
}

export function PricingDeadlinesCard({
	expiringQuotations,
	organizationSlug,
}: PricingDeadlinesCardProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/pricing`;

	if (expiringQuotations.length === 0) {
		return null;
	}

	return (
		<div className="bg-card border-2 rounded-2xl p-5 h-full">
			<div className="flex items-center gap-2 mb-4">
				<Clock className="h-5 w-5 text-chart-1" />
				<h3 className="text-sm font-semibold text-card-foreground">
					{t("pricing.dashboard.alerts.upcomingDeadlines")}
				</h3>
				<span className="ms-auto text-xs font-semibold text-chart-1 bg-chart-1/15 px-2.5 py-0.5 rounded-full">
					{expiringQuotations.length}
				</span>
			</div>

			<div className="space-y-2">
				{expiringQuotations.slice(0, 3).map((q) => {
					const daysUntil = Math.ceil(
						(new Date(q.validUntil).getTime() - Date.now()) /
							(1000 * 60 * 60 * 24),
					);

					return (
						<Link
							key={q.id}
							href={`${basePath}/quotations/${q.id}`}
							className="flex items-center justify-between p-3 rounded-xl bg-card hover:bg-accent transition-colors border-2"
						>
							<div>
								<p className="font-medium text-sm text-card-foreground">
									{q.quotationNo}
								</p>
								<p className="text-xs text-muted-foreground">
									{q.clientName}
								</p>
							</div>
							<div className="text-end">
								<p className="font-semibold text-sm text-chart-1">
									{daysUntil} {t("common.days")}
								</p>
								<p className="text-xs text-muted-foreground">
									<Currency amount={q.totalAmount} />
								</p>
							</div>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
