import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";

const QuantitiesOverview = dynamic(
	() =>
		import("@saas/projects/components/quantities/QuantitiesOverview").then((m) => ({
			default: m.QuantitiesOverview,
		})),
	{
		loading: () => <DashboardSkeleton />,
	},
);

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("projectQuantities.title") };
}

export default async function StudiesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	return (
		<Suspense fallback={<DashboardSkeleton />}>
			<StudiesPageContent organizationSlug={organizationSlug} projectId={projectId} />
		</Suspense>
	);
}

async function StudiesPageContent({
	organizationSlug,
	projectId,
}: {
	organizationSlug: string;
	projectId: string;
}) {
	const activeOrganization = await getActiveOrganization(organizationSlug as string);
	if (!activeOrganization) return notFound();

	return (
		<div>
			<QuantitiesOverview
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</div>
	);
}
