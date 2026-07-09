"use client";

import { GreetingHeader } from "@saas/shared/components/GreetingHeader";
import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";

interface SettingsHeaderProps {
	userName?: string;
}

export function SettingsHeader({ userName }: SettingsHeaderProps) {
	const t = useTranslations();

	return (
		<GreetingHeader
			icon={Settings}
			title={t("settings.menu.organization.title")}
			subtitle={`${t("settings.menu.organization.subtitle")}${userName ? ` - ${userName}` : ""}`}
		/>
	);
}
