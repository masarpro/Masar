import type { ReactNode } from "react";
import { SubPageHeader } from "@saas/shared/components/SubPageHeader";
import { FINANCE_NAV_SECTIONS, getSectionHref, getFinanceHomeHref } from "./constants";

export interface FinanceSubPageHeaderProps {
	organizationSlug: string;
	sectionKey: string;
	pageTitle?: string;
	actions?: ReactNode;
}

export function FinanceSubPageHeader(props: FinanceSubPageHeaderProps) {
	return (
		<SubPageHeader
			{...props}
			navSections={FINANCE_NAV_SECTIONS}
			getHomeHref={getFinanceHomeHref}
			getSectionHref={getSectionHref}
			rootLabelKey="finance.title"
			backLabelKey="finance.shell.back"
		/>
	);
}
