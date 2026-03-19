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
		<div className="backdrop-blur-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/50 rounded-2xl shadow-lg shadow-black/5 p-5 h-full">
			<div className="flex items-center gap-2 mb-4">
				<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
				<h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">
					{t("pricing.dashboard.alerts.upcomingDeadlines")}
				</h3>
				<span className="ms-auto text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
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
							className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-colors border border-amber-100/50 dark:border-amber-900/30"
						>
							<div>
								<p className="font-medium text-sm text-slate-900 dark:text-slate-100">
									{q.quotationNo}
								</p>
								<p className="text-xs text-slate-600 dark:text-slate-400">
									{q.clientName}
								</p>
							</div>
							<div className="text-end">
								<p className="font-semibold text-sm text-amber-600 dark:text-amber-400">
									{daysUntil} {t("common.days")}
								</p>
								<p className="text-xs text-slate-500">
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
