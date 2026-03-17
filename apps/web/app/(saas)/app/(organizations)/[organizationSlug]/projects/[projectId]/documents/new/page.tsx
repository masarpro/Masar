import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { CreateDocumentForm } from "@saas/projects/components/CreateDocumentForm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FormPageSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("projects.documents.addDocument"),
	};
}

export default async function NewDocumentPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	return (
		<Suspense fallback={<FormPageSkeleton />}>
			<NewDocumentPageContent organizationSlug={organizationSlug} projectId={projectId} />
		</Suspense>
	);
}

async function NewDocumentPageContent({
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
		<CreateDocumentForm
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			projectId={projectId}
		/>
	);
}
