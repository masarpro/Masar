import type { PropsWithChildren } from "react";
import { AccountingSeedCheck } from "@saas/finance/components/shell/AccountingSeedCheck";
import { PageContextProvider } from "@saas/ai/components/PageContextProvider";

export default function FinanceLayout({ children }: PropsWithChildren) {
	return (
		<PageContextProvider
			moduleId="finance"
			pageName="Finance"
			pageNameAr="المالية والمحاسبة"
			pageDescription="صفحات النظام المالي: الفواتير، المصروفات، البنوك، المحاسبة، التقارير، سندات القبض والصرف"
		>
			<div className="px-4 md:px-6 lg:px-8 py-6">
				<AccountingSeedCheck />
				{children}
			</div>
		</PageContextProvider>
	);
}
