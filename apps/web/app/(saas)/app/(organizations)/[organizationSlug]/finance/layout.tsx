import type { PropsWithChildren } from "react";
import { AccountingModeToggle } from "@saas/finance/components/shell/AccountingModeToggle";

export default function FinanceLayout({ children }: PropsWithChildren) {
	return (
		<div className="px-4 md:px-6 lg:px-8 py-6">
			<div className="flex justify-end mb-4">
				<AccountingModeToggle />
			</div>
			{children}
		</div>
	);
}
