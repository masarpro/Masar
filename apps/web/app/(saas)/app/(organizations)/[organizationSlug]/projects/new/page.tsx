import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { CreateProjectForm } from "@saas/projects/components/CreateProjectForm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FormPageSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("projects.newProject"),
	};
}

export default async function NewProjectPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={<FormPageSkeleton />}>
			<NewProjectPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function NewProjectPageContent({
	organizationSlug,
}: {
	organizationSlug: string;
}) {
	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<div>
			<CreateProjectForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</div>
	);
}
