"use client";

import type { ReactNode } from "react";
import { ProcurementSubPageHeader } from "./ProcurementSubPageHeader";

export interface ProcurementShellProps {
	organizationSlug: string;
	children: ReactNode;
	sectionKey?: string;
	pageTitle?: string;
	headerActions?: ReactNode;
}

export function ProcurementShell({
	organizationSlug,
	children,
	sectionKey,
	pageTitle,
	headerActions,
}: ProcurementShellProps) {
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex-1 px-4 pt-2 pb-6 sm:px-6">
				{sectionKey && (
					<ProcurementSubPageHeader
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
