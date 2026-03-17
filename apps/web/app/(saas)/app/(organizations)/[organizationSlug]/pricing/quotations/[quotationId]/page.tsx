import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { QuotationStudyBanner } from "@saas/pricing/components/quotation-builder/QuotationStudyBanner";
import { Skeleton } from "@ui/components/skeleton";
import dynamic from "next/dynamic";
const QuotationForm = dynamic(
	() =>
		import("@saas/pricing/components/quotations/QuotationForm").then((m) => ({
			default: m.QuotationForm,
		})),
	{ loading: () => <Skeleton className="h-96 w-full" /> },
);
import { PricingShell } from "@saas/pricing/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string; quotationId: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("pricing.quotations.edit"),
	};
}

export default async function EditQuotationPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; quotationId: string }>;
}) {
	const { organizationSlug, quotationId } = await params;

	return (
		<Suspense fallback={null}>
			<EditQuotationPageContent organizationSlug={organizationSlug} quotationId={quotationId} />
		</Suspense>
	);
}

async function EditQuotationPageContent({ organizationSlug, quotationId }: { organizationSlug: string; quotationId: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	const t = await getTranslations();

	return (
		<PricingShell
			organizationSlug={organizationSlug}
			sectionKey="quotations"
			pageTitle={t("pricing.quotations.edit")}
			hideSubPageHeader
		>
			<div className="space-y-4">
				<QuotationStudyBanner
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
					quotationId={quotationId}
				/>
				<QuotationForm
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
					mode="edit"
					quotationId={quotationId}
				/>
			</div>
		</PricingShell>
	);
}
