import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

const MEPItemsView = dynamic(
	() =>
		import("@saas/projects/components/quantities/MEPItemsView").then((m) => ({
			default: m.MEPItemsView,
		})),
	{
		loading: () => <ListTableSkeleton rows={8} cols={7} />,
	},
);

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("projectQuantities.mep") };
}

export default async function MEPPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	return (
		<Suspense fallback={<ListTableSkeleton rows={8} cols={7} />}>
			<MEPPageContent organizationSlug={organizationSlug} projectId={projectId} />
		</Suspense>
	);
}

async function MEPPageContent({
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
			<MEPItemsView
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</div>
	);
}
