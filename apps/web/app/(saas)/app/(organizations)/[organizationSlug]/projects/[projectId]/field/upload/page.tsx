import { getActiveOrganization } from "@saas/auth/lib/server";
import { PhotoUploadForm } from "@saas/projects/components/forms/PhotoUploadForm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("projects.field.uploadPhoto"),
	};
}

export default async function UploadPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<div>
			<PhotoUploadForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</div>
	);
}
