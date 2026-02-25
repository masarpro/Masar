import type { ReactNode } from "react";

export interface CompanyShellProps {
	organizationSlug: string;
	children: ReactNode;
	pageTitle?: string;
	headerActions?: ReactNode;
}

export function CompanyShell({
	children,
	pageTitle,
	headerActions,
}: CompanyShellProps) {
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex-1 px-4 pt-2 pb-6 sm:px-6">
				{(pageTitle || headerActions) && (
					<div className="mb-6 flex items-center justify-between" dir="rtl">
						{pageTitle && (
							<h1 className="text-xl font-bold">{pageTitle}</h1>
						)}
						{headerActions && <div className="flex gap-2">{headerActions}</div>}
					</div>
				)}
				{children}
			</div>
		</div>
	);
}
