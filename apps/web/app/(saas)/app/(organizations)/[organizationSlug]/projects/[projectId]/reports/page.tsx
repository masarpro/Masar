import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { DailyReportsHub } from "@saas/projects/components/field/DailyReportsHub";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("projects.field.reportsTitle"),
	};
}

export default async function DailyReportsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	return (
		<Suspense fallback={<DashboardSkeleton />}>
			<DailyReportsPageContent
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</Suspense>
	);
}

async function DailyReportsPageContent({
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
		<DailyReportsHub
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			projectId={projectId}
		/>
	);
}
