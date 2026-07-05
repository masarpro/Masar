import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { PricingShell } from "@saas/pricing/components/shell";
import { EditorPageSkeleton } from "@saas/shared/components/skeletons";
import dynamic from "next/dynamic";
const QuotationForm = dynamic(
	() =>
		import("@saas/pricing/components/quotations/QuotationForm").then((m) => ({
			default: m.QuotationForm,
		})),
	{ loading: () => <EditorPageSkeleton /> },
);
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("pricing.quotations.edit") };
}

export default async function QuotationDraftPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; draftId: string }>;
}) {
	const { organizationSlug, draftId } = await params;

	return (
		<Suspense fallback={<EditorPageSkeleton />}>
			<QuotationDraftContent organizationSlug={organizationSlug} draftId={draftId} />
		</Suspense>
	);
}

async function QuotationDraftContent({
	organizationSlug,
	draftId,
}: { organizationSlug: string; draftId: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<PricingShell organizationSlug={organizationSlug}>
			<QuotationForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				mode="create"
				draftId={draftId}
			/>
		</PricingShell>
	);
}
