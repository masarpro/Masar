import { getActiveOrganization } from "@saas/auth/lib/server";
import { EditLeadPage } from "@saas/pricing/components/leads/EditLeadPage";
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
		title: t("pricing.leads.edit"),
	};
}

export default async function EditLeadPageRoute({
	params,
}: {
	params: Promise<{ organizationSlug: string; leadId: string }>;
}) {
	const { organizationSlug, leadId } = await params;

	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	const t = await getTranslations();

	return (
		<PricingShell
			organizationSlug={organizationSlug}
			sectionKey="leads"
			pageTitle={t("pricing.leads.edit")}
		>
			<EditLeadPage
				leadId={leadId}
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</PricingShell>
	);
}
