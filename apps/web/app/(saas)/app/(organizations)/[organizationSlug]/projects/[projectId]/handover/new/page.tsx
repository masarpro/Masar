import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { HandoverProtocolForm } from "@saas/projects/components/handover/HandoverProtocolForm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("handover.new") };
}

export default async function NewHandoverPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;
	return (
		<Suspense fallback={<ListTableSkeleton rows={6} cols={2} />}>
			<NewHandoverContent organizationSlug={organizationSlug} projectId={projectId} />
		</Suspense>
	);
}

async function NewHandoverContent({
	organizationSlug,
	projectId,
}: { organizationSlug: string; projectId: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<HandoverProtocolForm
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			projectId={projectId}
		/>
	);
}
