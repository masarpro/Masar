import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { LeadDetailPage } from "@saas/pricing/components/leads/LeadDetailPage";
import { PricingShell } from "@saas/pricing/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string; leadId: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("pricing.leads.actions.view"),
	};
}

export default async function LeadDetailPageRoute({
	params,
}: {
	params: Promise<{ organizationSlug: string; leadId: string }>;
}) {
	const { organizationSlug, leadId } = await params;

	return (
		<Suspense fallback={null}>
			<LeadDetailPageContent organizationSlug={organizationSlug} leadId={leadId} />
		</Suspense>
	);
}

async function LeadDetailPageContent({ organizationSlug, leadId }: { organizationSlug: string; leadId: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	const t = await getTranslations();

	return (
		<PricingShell
			organizationSlug={organizationSlug}
			sectionKey="leads"
			pageTitle={t("pricing.leads.actions.view")}
		>
			<LeadDetailPage
				leadId={leadId}
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</PricingShell>
	);
}
