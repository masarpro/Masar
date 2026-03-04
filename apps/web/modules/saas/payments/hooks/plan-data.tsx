import type { config } from "@repo/config";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

type ProductReferenceId = keyof (typeof config)["payments"]["plans"];

export function usePlanData() {
	const t = useTranslations();

	const planData: Record<
		ProductReferenceId,
		{
			title: string;
			description: ReactNode;
			features: ReactNode[];
		}
	> = {
		free: {
			title: t("planData.free.title"),
			description: t("planData.free.description"),
			features: [
				t("planData.free.features.oneProject"),
				t("planData.free.features.twoUsers"),
				t("planData.free.features.aiChats"),
				t("planData.free.features.basicManagement"),
			],
		},
		pro: {
			title: t("planData.pro.title"),
			description: t("planData.pro.description"),
			features: [
				t("planData.pro.features.fiftyUsers"),
				t("planData.pro.features.hundredProjects"),
				t("planData.pro.features.unlimitedAi"),
				t("planData.pro.features.exports"),
				t("planData.pro.features.ownerPortal"),
				t("planData.pro.features.zatca"),
				t("planData.pro.features.reports"),
				t("planData.pro.features.support"),
			],
		},
		enterprise: {
			title: t("planData.enterprise.title"),
			description: t("planData.enterprise.description"),
			features: [
				t("planData.enterprise.features.unlimitedProjects"),
				t("planData.enterprise.features.enterpriseSupport"),
			],
		},
		lifetime: {
			title: t("planData.lifetime.title"),
			description: t("planData.lifetime.description"),
			features: [
				t("planData.lifetime.features.noRecurringCosts"),
				t("planData.lifetime.features.extendSupport"),
			],
		},
	};

	return { planData };
}
