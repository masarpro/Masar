import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BOQOverviewSkeleton } from "@saas/shared/components/skeletons";

const BOQOverview = dynamic(
	() =>
		import("@saas/projects/components/boq/BOQOverview").then((m) => ({
			default: m.BOQOverview,
		})),
	{
		loading: () => <BOQOverviewSkeleton />,
	},
);

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("projectBoq.title") };
}

export default async function QuantitiesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	return (
		<Suspense fallback={<BOQOverviewSkeleton />}>
			<QuantitiesPageContent organizationSlug={organizationSlug} projectId={projectId} />
		</Suspense>
	);
}

async function QuantitiesPageContent({
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
			<BOQOverview
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</div>
	);
}
