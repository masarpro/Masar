import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { LookaheadView } from "@saas/projects-execution/components/lookahead/LookaheadView";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("execution.lookahead.title"),
	};
}

export default async function LookaheadPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	return (
		<Suspense fallback={<ListTableSkeleton />}>
			<LookaheadPageContent organizationSlug={organizationSlug} projectId={projectId} />
		</Suspense>
	);
}

async function LookaheadPageContent({
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

	return <LookaheadView projectId={projectId} />;
}
