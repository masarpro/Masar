"use client";

import { GreetingHeader } from "@saas/shared/components/GreetingHeader";
import { Wallet } from "lucide-react";
import { useTranslations } from "next-intl";

interface FinanceHeaderProps {
	userName?: string;
}

export function FinanceHeader({ userName }: FinanceHeaderProps) {
	const t = useTranslations();

	return (
		<GreetingHeader
			icon={Wallet}
			title={t("finance.title")}
			subtitle={`${t("finance.dashboard.hello")}${userName ? ` ${userName}` : ""}`}
		/>
	);
}
