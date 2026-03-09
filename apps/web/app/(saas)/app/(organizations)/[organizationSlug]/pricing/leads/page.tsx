import { getActiveOrganization } from "@saas/auth/lib/server";
import { PageContextProvider } from "@saas/ai/components/PageContextProvider";
import { LeadsListPage } from "@saas/pricing/components/leads/LeadsListPage";
import { CreateLeadButton } from "@saas/pricing/components/leads/CreateLeadButton";
import { PricingShell } from "@saas/pricing/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("pricing.leads.title"),
	};
}

export default async function LeadsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<PageContextProvider
			moduleId="leads"
			pageName="Leads"
			pageNameAr="العملاء المحتملين"
			pageDescription="عرض وإدارة العملاء المحتملين وتتبع التحويلات"
			visibleStats={{}}
		>
			<PricingShell
				organizationSlug={organizationSlug}
				sectionKey="leads"
				headerActions={<CreateLeadButton organizationSlug={organizationSlug} />}
			>
				<LeadsListPage
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
				/>
			</PricingShell>
		</PageContextProvider>
	);
}
