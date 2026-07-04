import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { CompanyNavigation } from "@saas/company/components/shell";
import { PageContextProvider } from "@saas/ai/components/PageContextProvider";
import { SectionRouteGate } from "@saas/permissions/components/SectionRouteGate";
import { cachedGetMyPermissions } from "@shared/lib/cached-queries";

export default async function CompanyLayout({
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

	// Server guard (RBAC-UI): the company group is visible to members with any
	// company permission OR employees.view (the accountant edge case — the
	// employees section is separate from company in the permission model).
	const { permissions, isOwner } = await cachedGetMyPermissions(
		organization.id,
	);
	const hasCompanyAccess =
		isOwner ||
		(permissions
			? Object.values(permissions.company).some(Boolean) ||
				permissions.employees.view
			: false);

	if (!hasCompanyAccess) {
		redirect(`/app/${organizationSlug}`);
	}

	return (
		<PageContextProvider
			moduleId="company"
			pageName="Company"
			pageNameAr="إدارة المنشأة"
			pageDescription="صفحات إدارة الشركة: الموظفون، الرواتب، الإجازات، الأصول، المصروفات المتكررة، التقارير"
		>
			<div>
				<CompanyNavigation organizationSlug={organizationSlug} />
				<div className="px-4 md:px-6 lg:px-8 py-6">
					<SectionRouteGate sectionRoot="company">
						{children}
					</SectionRouteGate>
				</div>
			</div>
		</PageContextProvider>
	);
}
