import type { ReactNode } from "react";
import { SubPageHeader } from "@saas/shared/components/SubPageHeader";
import { PRICING_NAV_SECTIONS, getPricingSectionHref, getPricingHomeHref } from "./constants";

export interface PricingSubPageHeaderProps {
	organizationSlug: string;
	sectionKey: string;
	pageTitle?: string;
	actions?: ReactNode;
}

export function PricingSubPageHeader(props: PricingSubPageHeaderProps) {
	return (
		<SubPageHeader
			{...props}
			navSections={PRICING_NAV_SECTIONS}
			getHomeHref={getPricingHomeHref}
			getSectionHref={getPricingSectionHref}
			rootLabelKey="pricing.title"
			backLabelKey="pricing.shell.back"
		/>
	);
}
