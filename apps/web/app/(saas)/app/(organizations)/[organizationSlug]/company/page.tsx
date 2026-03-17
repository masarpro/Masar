import { getActiveOrganization } from "@saas/auth/lib/server";
import { CompanyDashboard } from "@saas/company/components/dashboard/CompanyDashboard";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const t = await getTranslations();
	return { title: t("company.title") };
}

export default async function CompanyPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={<DashboardSkeleton />}>
			<CompanyPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function CompanyPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return <CompanyDashboard organizationId={activeOrganization.id} />;
}
