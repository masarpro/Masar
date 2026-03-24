import type { PropsWithChildren } from "react";
import { AccountingSeedCheck } from "@saas/finance/components/shell/AccountingSeedCheck";

export default function FinanceLayout({ children }: PropsWithChildren) {
	return (
		<div className="px-4 md:px-6 lg:px-8 py-6">
			<AccountingSeedCheck />
			{children}
		</div>
	);
}
