import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { PhotosPageContent } from "@saas/projects/components/photos/PhotosPageContent";
import { PhotoGridSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("projects.photos.title") };
}

export default async function PhotosPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;
	return (
		<Suspense fallback={<PhotoGridSkeleton />}>
			<PhotosPageWrapper
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</Suspense>
	);
}

async function PhotosPageWrapper({
	organizationSlug,
	projectId,
}: {
	organizationSlug: string;
	projectId: string;
}) {
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<PhotosPageContent
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			projectId={projectId}
		/>
	);
}
