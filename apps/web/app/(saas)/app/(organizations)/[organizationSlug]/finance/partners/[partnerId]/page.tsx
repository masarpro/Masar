import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { PartnerFinanceDetail } from "@saas/finance/components/partners/PartnerFinanceDetail";
import { FinanceShell } from "@saas/finance/components/shell";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("finance.partners.detail.title") };
}

export default async function PartnerDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; partnerId: string }>;
}) {
	const { organizationSlug, partnerId } = await params;
	return (
		<Suspense fallback={<ListTableSkeleton rows={6} cols={3} />}>
			<PartnerDetailContent
				organizationSlug={organizationSlug}
				partnerId={partnerId}
			/>
		</Suspense>
	);
}

async function PartnerDetailContent({
	organizationSlug,
	partnerId,
}: {
	organizationSlug: string;
	partnerId: string;
}) {
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<FinanceShell organizationSlug={organizationSlug} sectionKey="partners">
			<PartnerFinanceDetail
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				partnerId={partnerId}
			/>
		</FinanceShell>
	);
}
