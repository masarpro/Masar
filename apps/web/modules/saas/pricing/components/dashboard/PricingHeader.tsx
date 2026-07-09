"use client";

import { GreetingHeader } from "@saas/shared/components/GreetingHeader";
import { Calculator } from "lucide-react";
import { useTranslations } from "next-intl";

interface PricingHeaderProps {
	userName?: string;
}

export function PricingHeader({ userName }: PricingHeaderProps) {
	const t = useTranslations();

	return (
		<GreetingHeader
			icon={Calculator}
			title={t("pricing.title")}
			subtitle={`${t("pricing.dashboard.hello")}${userName ? ` ${userName}` : ""}`}
		/>
	);
}
