import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { DocumentDetail } from "@saas/projects/components/DocumentDetail";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DetailPageSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("projects.documents.documentDetail"),
	};
}

export default async function DocumentDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string; documentId: string }>;
}) {
	const { organizationSlug, projectId, documentId } = await params;

	return (
		<Suspense fallback={<DetailPageSkeleton />}>
			<DocumentDetailPageContent
				organizationSlug={organizationSlug}
				projectId={projectId}
				documentId={documentId}
			/>
		</Suspense>
	);
}

async function DocumentDetailPageContent({
	organizationSlug,
	projectId,
	documentId,
}: {
	organizationSlug: string;
	projectId: string;
	documentId: string;
}) {
	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<DocumentDetail
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			projectId={projectId}
			documentId={documentId}
		/>
	);
}
