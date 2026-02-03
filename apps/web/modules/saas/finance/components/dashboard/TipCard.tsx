"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";

export function TipCard() {
	const t = useTranslations();

	return (
		<div className="backdrop-blur-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-lg shadow-black/5 p-5 h-full">
			<div className="flex items-start gap-3">
				<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 shrink-0">
					<Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
				</div>
				<div>
					<p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">
						{t("finance.dashboard.alerts.tipTitle")}
					</p>
					<p className="text-xs text-slate-500 dark:text-slate-400">
						{t("finance.dashboard.alerts.tipContent")}
					</p>
				</div>
			</div>
		</div>
	);
}
