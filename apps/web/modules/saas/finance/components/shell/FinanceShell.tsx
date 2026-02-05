"use client";

import type { ReactNode } from "react";
import { FinanceSubPageHeader } from "./FinanceSubPageHeader";

export interface FinanceShellProps {
	organizationSlug: string;
	children: ReactNode;
	sectionKey?: string;
	pageTitle?: string;
	headerActions?: ReactNode;
}

export function FinanceShell({
	organizationSlug,
	children,
	sectionKey,
	pageTitle,
	headerActions,
}: FinanceShellProps) {
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			{/* Page Content */}
			<div className="flex-1 px-4 pt-2 pb-6 sm:px-6">
				{sectionKey && (
					<FinanceSubPageHeader
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
