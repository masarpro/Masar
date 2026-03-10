import { getActiveOrganization } from "@saas/auth/lib/server";
import { Skeleton } from "@ui/components/skeleton";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

const QuantitiesOverview = dynamic(
	() =>
		import("@saas/projects/components/quantities/QuantitiesOverview").then((m) => ({
			default: m.QuantitiesOverview,
		})),
	{
		loading: () => (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-48 w-full rounded-xl" />
			</div>
		),
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
