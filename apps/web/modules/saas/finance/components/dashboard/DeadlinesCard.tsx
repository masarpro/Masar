"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface UpcomingDeadline {
	id: string;
	type: "invoice";
	documentNo: string;
	clientName: string;
	dueDate: string | Date;
}

interface DeadlinesCardProps {
	upcomingDeadlines?: UpcomingDeadline[];
	organizationSlug: string;
}

export function DeadlinesCard({
	upcomingDeadlines = [],
	organizationSlug,
}: DeadlinesCardProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/finance`;

	// Mock upcoming deadlines if none provided
	// TODO: Connect to real API
	const mockUpcomingDeadlines: UpcomingDeadline[] = upcomingDeadlines.length
		? upcomingDeadlines
		: [
				{
					id: "2",
					type: "invoice",
					documentNo: "INV-2024-015",
					clientName: "مؤسسة البناء",
					dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
				},
			];

	const hasUpcoming = mockUpcomingDeadlines.length > 0;

	if (!hasUpcoming) {
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
					{mockUpcomingDeadlines.length}
				</span>
			</div>

			<div className="space-y-2">
				{mockUpcomingDeadlines.slice(0, 3).map((deadline) => {
					const path = `${basePath}/invoices/${deadline.id}`;
					const daysUntil = Math.ceil(
						(new Date(deadline.dueDate).getTime() - Date.now()) /
							(1000 * 60 * 60 * 24),
					);

					return (
						<Link
							key={`${deadline.type}-${deadline.id}`}
							href={path}
							className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-colors border border-amber-100/50 dark:border-amber-900/30"
						>
							<div>
								<p className="font-medium text-sm text-slate-900 dark:text-slate-100">
									{deadline.documentNo}
								</p>
								<p className="text-xs text-slate-600 dark:text-slate-400">
									{deadline.clientName}
								</p>
							</div>
							<div className="text-end">
								<p className="font-semibold text-sm text-amber-600 dark:text-amber-400">
									{daysUntil} {t("common.days")}
								</p>
								<p className="text-xs text-slate-500">
									{t(`finance.dashboard.types.${deadline.type}`)}
								</p>
							</div>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
