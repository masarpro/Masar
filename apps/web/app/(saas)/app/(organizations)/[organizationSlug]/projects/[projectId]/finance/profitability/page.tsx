import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProfitabilityReport } from "@saas/projects/components/finance/ProfitabilityReport";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Skeleton } from "@ui/components/skeleton";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("finance.profitability.title"),
	};
}

function ProfitabilitySkeleton() {
	return (
		<div className="space-y-6 p-6">
			<Skeleton className="h-8 w-48" />
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Skeleton className="h-32 rounded-2xl" />
				<Skeleton className="h-32 rounded-2xl" />
				<Skeleton className="h-32 rounded-2xl" />
			</div>
			<Skeleton className="h-64 rounded-2xl" />
		</div>
	);
}

export default async function ProfitabilityPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	return (
		<Suspense fallback={<ProfitabilitySkeleton />}>
			<ProfitabilityPageContent organizationSlug={organizationSlug} projectId={projectId} />
		</Suspense>
	);
}

async function ProfitabilityPageContent({
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
		<div>
			<ProfitabilityReport
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</div>
	);
}
