import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ExpenseRunDetail } from "@saas/company/components/expense-runs/ExpenseRunDetail";
import { DetailPageSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.expenseRuns.runDetail") };
}

export default async function ExpenseRunDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; id: string }>;
}) {
	const { organizationSlug, id } = await params;
	return (
		<Suspense fallback={<DetailPageSkeleton />}>
			<ExpenseRunDetailPageContent
				organizationSlug={organizationSlug}
				id={id}
			/>
		</Suspense>
	);
}

async function ExpenseRunDetailPageContent({
	organizationSlug,
	id,
}: { organizationSlug: string; id: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<ExpenseRunDetail
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			runId={id}
		/>
	);
}
