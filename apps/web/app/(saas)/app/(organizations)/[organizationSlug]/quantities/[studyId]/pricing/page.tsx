import { getActiveOrganization } from "@saas/auth/lib/server";
import { PricingEditor } from "@saas/quantities/components/PricingEditor";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("quantities.pricing.title"),
	};
}

export default async function PricingPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; studyId: string }>;
}) {
	const { organizationSlug, studyId } = await params;
	const t = await getTranslations();

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<div>
			<PageHeader
				title={t("quantities.pricing.title")}
				subtitle={t("quantities.pricing.subtitle")}
			/>
			<PricingEditor
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				studyId={studyId}
			/>
		</div>
	);
}
