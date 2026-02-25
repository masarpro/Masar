"use client";

import type { ReactNode } from "react";
import { PricingSubPageHeader } from "./PricingSubPageHeader";

export interface PricingShellProps {
	organizationSlug: string;
	children: ReactNode;
	sectionKey?: string;
	pageTitle?: string;
	headerActions?: ReactNode;
}

export function PricingShell({
	organizationSlug,
	children,
	sectionKey,
	pageTitle,
	headerActions,
}: PricingShellProps) {
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			{/* Page Content */}
			<div className="flex-1 px-4 pt-2 pb-6 sm:px-6">
				{sectionKey && (
					<PricingSubPageHeader
						organizationSlug={organizationSlug}
						sectionKey={sectionKey}
						pageTitle={pageTitle}
						actions={headerActions}
					/>
				)}
				{children}
			</div>
		</div>
	);
}
