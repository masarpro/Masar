import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { HandoverProtocolDetail } from "@saas/projects/components/handover/HandoverProtocolDetail";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("handover.protocol") };
}

export default async function HandoverDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string; protocolId: string }>;
}) {
	const { organizationSlug, projectId, protocolId } = await params;
	return (
		<Suspense fallback={<ListTableSkeleton rows={8} cols={2} />}>
			<HandoverDetailContent
				organizationSlug={organizationSlug}
				projectId={projectId}
				protocolId={protocolId}
			/>
		</Suspense>
	);
}

async function HandoverDetailContent({
	organizationSlug,
	projectId,
	protocolId,
}: { organizationSlug: string; projectId: string; protocolId: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<HandoverProtocolDetail
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			projectId={projectId}
			protocolId={protocolId}
		/>
	);
}
