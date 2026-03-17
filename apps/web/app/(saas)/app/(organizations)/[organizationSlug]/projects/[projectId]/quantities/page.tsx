import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { Skeleton } from "@ui/components/skeleton";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";

const BOQOverview = dynamic(
	() =>
		import("@saas/projects/components/boq/BOQOverview").then((m) => ({
			default: m.BOQOverview,
		})),
	{
		loading: () => (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<div className="grid grid-cols-2 gap-4">
					<Skeleton className="h-24 rounded-xl" />
					<Skeleton className="h-24 rounded-xl" />
				</div>
				<Skeleton className="h-64 rounded-xl" />
			</div>
		),
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
		<Suspense fallback={<DashboardSkeleton />}>
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
