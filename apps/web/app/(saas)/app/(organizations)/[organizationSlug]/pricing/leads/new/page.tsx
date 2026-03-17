import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { CreateLeadPage } from "@saas/pricing/components/leads/CreateLeadPage";
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
		title: t("pricing.leads.create"),
	};
}

export default async function CreateLeadPageRoute({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={null}>
			<CreateLeadPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function CreateLeadPageContent({ organizationSlug }: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	const t = await getTranslations();

	return (
		<PricingShell
			organizationSlug={organizationSlug}
			sectionKey="leads"
			pageTitle={t("pricing.leads.create")}
		>
			<CreateLeadPage
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</PricingShell>
	);
}
