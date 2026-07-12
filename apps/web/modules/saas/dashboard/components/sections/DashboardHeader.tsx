"use client";

import { GreetingHeader } from "@saas/shared/components/GreetingHeader";
import { LayoutDashboard } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface DashboardHeaderProps {
	/** React Query dataUpdatedAt (ms) of the main dashboard query — 0 when no data yet. */
	lastUpdatedAt?: number;
}

/**
 * رأس لوحة التحكم الرئيسية — ترحيب + سطر «آخر تحديث» من توقيت جلب البيانات
 * الفعلي (dataUpdatedAt). لا يعرض السطر الثانوي عندما لا تتوفر المعلومة.
 */
export function DashboardHeader({ lastUpdatedAt }: DashboardHeaderProps) {
	const t = useTranslations();
	const locale = useLocale();

	const lastUpdated =
		lastUpdatedAt && lastUpdatedAt > 0
			? new Intl.DateTimeFormat(locale, {
					hour: "2-digit",
					minute: "2-digit",
				}).format(new Date(lastUpdatedAt))
			: null;

	return (
		<GreetingHeader
			icon={LayoutDashboard}
			title={t("dashboard.header.greeting")}
			subtitle={
				lastUpdated
					? t("dashboard.header.lastUpdated", { time: lastUpdated })
					: undefined
			}
		/>
	);
}
