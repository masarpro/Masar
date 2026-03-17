"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { cn } from "@ui/lib";
import { Card } from "@ui/components/card";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface UpcomingItem {
	id: string;
	title: string;
	plannedEnd: Date | string | null;
	project: { id: string; name: string };
}

interface UpcomingPaymentsProps {
	items: UpcomingItem[];
	organizationSlug: string;
}

export function UpcomingPayments({
	items,
	organizationSlug,
}: UpcomingPaymentsProps) {
	const t = useTranslations();

	return (
		<Card className="p-5 dark:border-gray-800 dark:bg-gray-900">
			<h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-gray-100">
				{t("dashboard.upcoming.title")}
			</h3>

			{items.length > 0 ? (
				<div className="space-y-3">
					{items.slice(0, 4).map((item) => (
						<Link
							key={item.id}
							href={`/app/${organizationSlug}/projects/${item.project.id}/execution`}
							className="flex items-center gap-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-1 px-1 py-0.5"
						>
							<div
								className={cn(
									"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
									"bg-rose-50 dark:bg-rose-900/20",
								)}
							>
								<Calendar className="h-4 w-4 text-rose-500" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
									{item.project.name}
								</p>
								<p className="text-[11px] text-gray-400">
									{item.plannedEnd
									? new Date(
											item.plannedEnd,
										).toLocaleDateString("ar-SA", {
											day: "numeric",
											month: "short",
										})
									: "—"}
								</p>
							</div>
							<span className="shrink-0 text-xs font-medium text-gray-400">
								{item.title}
							</span>
						</Link>
					))}
				</div>
			) : (
				<div className="py-6 text-center">
					<p className="text-xs text-gray-400">
						{t("dashboard.upcoming.empty")}
					</p>
				</div>
			)}
		</Card>
	);
}
