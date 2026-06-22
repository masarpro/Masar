import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { MultiPhotoUploadForm } from "@saas/projects/components/photos/MultiPhotoUploadForm";
import { FormPageSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("projects.photos.uploadButton") };
}

export default async function PhotosUploadPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;
	return (
		<Suspense fallback={<FormPageSkeleton />}>
			<PhotosUploadWrapper
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</Suspense>
	);
}

async function PhotosUploadWrapper({
	organizationSlug,
	projectId,
}: {
	organizationSlug: string;
	projectId: string;
}) {
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<MultiPhotoUploadForm
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			projectId={projectId}
		/>
	);
}
