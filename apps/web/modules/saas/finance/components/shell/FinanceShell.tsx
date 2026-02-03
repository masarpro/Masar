"use client";

import type { ReactNode } from "react";
import { FinancePageHeader } from "./FinancePageHeader";
import { FinanceNavigation } from "./FinanceNavigation";

export interface FinanceShellProps {
	organizationSlug: string;
	title?: string;
	subtitle?: string;
	children: ReactNode;
	/**
	 * Hide the navigation bar (useful for preview/print pages)
	 */
	hideNavigation?: boolean;
}

export function FinanceShell({
	organizationSlug,
	title,
	subtitle,
	children,
	hideNavigation = false,
}: FinanceShellProps) {
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			{/* Navigation Bar */}
			{!hideNavigation && (
				<FinanceNavigation organizationSlug={organizationSlug} />
			)}

			{/* Page Content */}
			<div className="flex-1 px-4 py-6 sm:px-6">
				{title && (
					<FinancePageHeader
						organizationSlug={organizationSlug}
						title={title}
						subtitle={subtitle}
					/>
				)}
				{children}
			</div>
		</div>
	);
}
