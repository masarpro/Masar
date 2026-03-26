import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { HandoverProtocolsList } from "@saas/projects/components/handover/HandoverProtocolsList";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("handover.title") };
}

export default async function HandoverPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;
	return (
		<Suspense fallback={<ListTableSkeleton rows={8} cols={6} />}>
			<HandoverPageContent organizationSlug={organizationSlug} projectId={projectId} />
		</Suspense>
	);
}

async function HandoverPageContent({
	organizationSlug,
	projectId,
}: { organizationSlug: string; projectId: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<HandoverProtocolsList
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			projectId={projectId}
		/>
	);
}
