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

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("pricing.quotations.create"),
	};
}

export default async function CreateQuotationPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	// No inner Suspense: the route loading.tsx skeleton covers the await.
	return <CreateQuotationPageContent organizationSlug={organizationSlug} />;
}

async function CreateQuotationPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	const t = await getTranslations();

	return (
		<PricingShell
			organizationSlug={organizationSlug}
			sectionKey="quotations"
			pageTitle={t("pricing.quotations.create")}
		>
			<Suspense fallback={<EditorPageSkeleton />}>
				<QuotationForm
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
					mode="create"
				/>
			</Suspense>
		</PricingShell>
	);
}
