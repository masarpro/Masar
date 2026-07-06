import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { DocumentsExplorer } from "@saas/projects/components/documents/DocumentsExplorer";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DocumentsExplorerSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("projects.documents.title"),
	};
}

export default async function DocumentsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	return (
		<Suspense fallback={<DocumentsExplorerSkeleton />}>
			<DocumentsPageContent organizationSlug={organizationSlug} projectId={projectId} />
		</Suspense>
	);
}

async function DocumentsPageContent({
	organizationSlug,
	projectId,
}: {
	organizationSlug: string;
	projectId: string;
}) {
	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<DocumentsExplorer
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			projectId={projectId}
		/>
	);
}
