import type { PropsWithChildren } from "react";
import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { AccountingSeedCheck } from "@saas/finance/components/shell/AccountingSeedCheck";
import { PageContextProvider } from "@saas/ai/components/PageContextProvider";
import { SectionRouteGate } from "@saas/permissions/components/SectionRouteGate";
import { cachedGetMyPermissions } from "@shared/lib/cached-queries";
import { redirect } from "next/navigation";

export default async function FinanceLayout({
	children,
	params,
}: PropsWithChildren<{
	params: Promise<{ organizationSlug: string }>;
}>) {
	const { organizationSlug } = await params;
	const [session, organization] = await Promise.all([
		getSession(),
		getActiveOrganization(organizationSlug),
	]);

	if (!session?.user) {
		redirect("/auth/login");
	}
	if (!organization) {
		redirect("/app");
	}

	// Server guard (RBAC-UI): members with no finance permission at all never
	// enter the section — no more blank pages. Backend authorization on every
	// procedure remains the actual security boundary.
	const { permissions, isOwner } = await cachedGetMyPermissions(
		organization.id,
	);
	const hasAnyFinance =
		isOwner ||
		(permissions ? Object.values(permissions.finance).some(Boolean) : false);

	if (!hasAnyFinance) {
		redirect(`/app/${organizationSlug}`);
	}

	return (
		<PageContextProvider
			moduleId="finance"
			pageName="Finance"
			pageNameAr="المالية والمحاسبة"
			pageDescription="صفحات النظام المالي: الفواتير، المصروفات، البنوك، المحاسبة، التقارير، سندات القبض والصرف"
		>
			{/* Padding is owned by FinanceShell (same model as pricing) — do not add it here too. */}
			<div>
				<AccountingSeedCheck />
				<SectionRouteGate sectionRoot="finance">
					{children}
				</SectionRouteGate>
			</div>
		</PageContextProvider>
	);
}
